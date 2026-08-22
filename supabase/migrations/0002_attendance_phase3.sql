-- Phase 3: one attendance record per employee per day.
alter table public.attendance
  drop constraint if exists attendance_status_check;

alter table public.attendance
  add column if not exists source text not null default 'AUTO'
    check (source in ('AUTO', 'LEAVE_SYNC'));

alter table public.attendance
  alter column status set default 'ABSENT';

update public.attendance
set status = upper(replace(status, '-', '_'))
where status in ('present', 'absent', 'half-day', 'leave');

alter table public.attendance
  add constraint attendance_status_check
    check (status in ('PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE'));

create unique index if not exists attendance_user_date_key
  on public.attendance (user_id, date);