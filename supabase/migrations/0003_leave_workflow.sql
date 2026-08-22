-- Phase 4: leave workflow, notifications, and atomic approval side effects.
alter table public.leave_requests
  add column if not exists admin_comment text,
  add column if not exists reviewed_at timestamptz;

alter table public.leave_requests
  drop constraint if exists leave_requests_status_check;
update public.leave_requests set status = upper(status);
alter table public.leave_requests
  add constraint leave_requests_status_check
    check (status in ('PENDING', 'APPROVED', 'REJECTED'));
alter table public.leave_requests alter column status set default 'PENDING';

alter table public.leave_requests
  drop constraint if exists leave_requests_type_check;
update public.leave_requests set type = upper(type);
alter table public.leave_requests
  add constraint leave_requests_type_check
    check (type in ('PAID', 'SICK', 'UNPAID'));

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;
drop policy if exists "Users can view own notifications" on public.notifications;
create policy "Users can view own notifications" on public.notifications for select using (auth.uid() = user_id);
drop policy if exists "Users can update own notifications" on public.notifications;
create policy "Users can update own notifications" on public.notifications for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- One transaction boundary for the state transition, attendance sync, and notification.
create or replace function public.decide_leave_request(
  request_id uuid,
  next_status text,
  comment_text text default null
)
returns public.leave_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  request_row public.leave_requests;
  day date;
begin
  if not public.is_admin() then
    raise exception 'ADMIN_REQUIRED' using errcode = '42501';
  end if;
  if next_status not in ('APPROVED', 'REJECTED') then
    raise exception 'INVALID_STATUS' using errcode = '22023';
  end if;

  select * into request_row from public.leave_requests where id = request_id for update;
  if not found then raise exception 'REQUEST_NOT_FOUND' using errcode = 'P0002'; end if;
  if request_row.status <> 'PENDING' then raise exception 'REQUEST_ALREADY_DECIDED' using errcode = 'P0001'; end if;

  update public.leave_requests
  set status = next_status, admin_comment = comment_text, reviewed_by = auth.uid(), reviewed_at = now()
  where id = request_id
  returning * into request_row;

  if next_status = 'APPROVED' then
    day := request_row.start_date;
    while day <= request_row.end_date loop
      insert into public.attendance (user_id, date, status, source)
      values (request_row.user_id, day, 'LEAVE', 'LEAVE_SYNC')
      on conflict (user_id, date) do update set status = 'LEAVE', source = 'LEAVE_SYNC';
      day := day + 1;
    end loop;
  end if;

  insert into public.notifications (user_id, message)
  values (
    request_row.user_id,
    'Your ' || request_row.type || ' leave for ' || request_row.start_date || ' to ' || request_row.end_date ||
      ' was ' || lower(next_status) || case when next_status = 'REJECTED' and nullif(comment_text, '') is not null then ': ' || comment_text else '' end
  );
  return request_row;
end;
$$;