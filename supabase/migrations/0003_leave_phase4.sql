-- ==============================================================================
-- DAYFLOW HRMS — Phase 4: Leave & Approval Workflow
-- Depends on 0001_init.sql (leave_requests stub) and 0002_attendance_phase3.sql
-- (attendance.source, unique (user_id, date)). Idempotent / safe to re-run.
-- ==============================================================================

-- 1. Extend leave_requests ------------------------------------------------------
alter table public.leave_requests drop column if exists comments;
alter table public.leave_requests add column if not exists admin_comment text;
alter table public.leave_requests add column if not exists reviewed_at timestamptz;

-- Narrow leave type to the three the app supports (PAID | SICK | UNPAID).
alter table public.leave_requests drop constraint if exists leave_requests_type_check;
alter table public.leave_requests
  add constraint leave_requests_type_check
  check (type in ('paid', 'sick', 'unpaid'));

-- 2. Notifications table --------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

create policy "Users can view own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users can update own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

-- Inserts are performed by the SECURITY DEFINER RPC below, but allow admins too.
create policy "Admins can insert notifications"
  on public.notifications for insert
  with check (is_admin());

-- 3. Atomic leave decision (state machine + attendance sync + notification) -------
-- One transaction guarantees: a PENDING request becomes APPROVED/REJECTED AND the
-- attendance records are synced (or reverted on failure). No partial "approved but
-- not synced" state is possible.
create or replace function public.apply_leave_decision(
  p_request_id uuid,
  p_admin_id uuid,
  p_status text,          -- 'approved' | 'rejected'
  p_admin_comment text
)
returns public.leave_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.leave_requests;
  v_is_admin boolean;
begin
  -- Guard: caller must be an admin (defense in depth; route also checks).
  select exists (
    select 1 from public.profiles where id = p_admin_id and role = 'admin'
  ) into v_is_admin;
  if not v_is_admin then
    raise exception 'Forbidden: admin role required';
  end if;

  -- State-machine guard: only PENDING can be decided.
  select * into v_request
  from public.leave_requests
  where id = p_request_id
  for update;

  if v_request is null then
    raise exception 'Leave request not found';
  end if;

  if v_request.status <> 'pending' then
    raise exception 'Request is already %', v_request.status;
  end if;

  -- Persist the decision.
  update public.leave_requests
  set status = p_status,
      reviewed_by = p_admin_id,
      reviewed_at = now(),
      admin_comment = p_admin_comment
  where id = p_request_id
  returning * into v_request;

  -- Side effect only on approval: upsert LEAVE attendance for every date in range,
  -- overwriting any AUTO-derived status or absent record for those dates.
  if p_status = 'approved' then
    insert into public.attendance (user_id, date, status, source, updated_at)
    select
      v_request.user_id,
      d::date,
      'leave',
      'leave_sync',
      now()
    from generate_series(v_request.start_date, v_request.end_date, interval '1 day') as d
    on conflict (user_id, date)
    do update set status = 'leave', source = 'leave_sync', updated_at = now();
  end if;

  -- Notify the employee.
  insert into public.notifications (user_id, message, read, created_at)
  values (
    v_request.user_id,
    case
      when p_status = 'approved'
        then format(
          'Your %s leave for %s – %s was approved',
          lower(v_request.type),
          to_char(v_request.start_date, 'Mon DD'),
          to_char(v_request.end_date, 'Mon DD')
        )
      else
        format(
          'Your %s leave for %s – %s was rejected%s',
          lower(v_request.type),
          to_char(v_request.start_date, 'Mon DD'),
          to_char(v_request.end_date, 'Mon DD'),
          case when coalesce(p_admin_comment, '') <> ''
               then ': ' || p_admin_comment else '' end
        )
    end,
    false,
    now()
  );

  return v_request;
end;
$$;
