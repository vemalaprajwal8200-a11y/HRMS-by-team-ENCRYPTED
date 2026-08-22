-- Phase 6 admin capability layer: provisioning, payroll detail, and leave allocation.
alter table public.users add column if not exists must_change_password boolean not null default false;
alter table public.users add column if not exists company_name text;

alter table public.payroll
  add column if not exists month_wage numeric,
  add column if not exists working_days_per_week integer not null default 5,
  add column if not exists break_time_hours numeric not null default 1,
  add column if not exists basic_salary_type text not null default 'PERCENTAGE',
  add column if not exists basic_salary_value numeric not null default 100,
  add column if not exists hra_type text not null default 'PERCENTAGE',
  add column if not exists hra_value numeric not null default 0,
  add column if not exists standard_allowance_type text not null default 'PERCENTAGE',
  add column if not exists standard_allowance_value numeric not null default 0,
  add column if not exists performance_bonus_type text not null default 'PERCENTAGE',
  add column if not exists performance_bonus_value numeric not null default 0,
  add column if not exists leave_travel_allowance_type text not null default 'PERCENTAGE',
  add column if not exists leave_travel_allowance_value numeric not null default 0,
  add column if not exists pf_employee_percent numeric not null default 0,
  add column if not exists pf_employer_percent numeric not null default 0,
  add column if not exists professional_tax numeric not null default 0;

update public.payroll set month_wage = coalesce(month_wage, basic_salary + allowances) where month_wage is null;
alter table public.payroll add constraint payroll_component_type_check check (
  basic_salary_type in ('FIXED', 'PERCENTAGE') and hra_type in ('FIXED', 'PERCENTAGE') and
  standard_allowance_type in ('FIXED', 'PERCENTAGE') and performance_bonus_type in ('FIXED', 'PERCENTAGE') and
  leave_travel_allowance_type in ('FIXED', 'PERCENTAGE')
);

create table if not exists public.leave_balances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  leave_type text not null check (leave_type in ('PAID', 'SICK', 'UNPAID')),
  allocated_days numeric not null default 0 check (allocated_days >= 0),
  year integer not null,
  unique (user_id, leave_type, year)
);
alter table public.leave_balances enable row level security;
drop policy if exists "Users can view own leave balances or admins view all" on public.leave_balances;
create policy "Users can view own leave balances or admins view all" on public.leave_balances for select using (auth.uid() = user_id or public.is_admin());
drop policy if exists "Admins can manage leave balances" on public.leave_balances;
create policy "Admins can manage leave balances" on public.leave_balances for all using (public.is_admin()) with check (public.is_admin());