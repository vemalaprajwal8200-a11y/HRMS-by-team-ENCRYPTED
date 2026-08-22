-- ==============================================================================
-- DAYFLOW HRMS — Phase 3: Attendance Tracking
-- Extends the Phase 1 `attendance` stub. Safe to re-run (idempotent).
-- ==============================================================================

-- 1. status values: rename 'half-day' -> 'half_day' (snake_case consistency)
--    and align with the four-state enum: present | absent | half_day | leave
alter table public.attendance drop constraint if exists attendance_status_check;
alter table public.attendance
  add constraint attendance_status_check
  check (status in ('present', 'absent', 'half_day', 'leave'));

-- 2. source column: distinguishes "system-derived from check-in" (auto) from
--    "overwritten because a leave was approved" (leave_sync, written by Phase 4).
alter table public.attendance
  add column if not exists source text not null
  check (source in ('auto', 'leave_sync')) default 'auto';

-- 3. One attendance record per employee per day (unique (user_id, date)).
create unique index if not exists attendance_user_date_unique
  on public.attendance (user_id, date);

-- 4. RLS: allow employees to update their OWN attendance (required for check-out).
drop policy if exists "Admins can update attendance" on public.attendance;
create policy "Users can update own attendance or admin manage"
  on public.attendance for update
  using (auth.uid() = user_id or is_admin())
  with check (auth.uid() = user_id or is_admin());
