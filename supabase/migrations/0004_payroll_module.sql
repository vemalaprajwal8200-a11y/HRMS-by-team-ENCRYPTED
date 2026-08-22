-- Phase 5: one current payroll record per employee.
alter table public.payroll
  add column if not exists basic_salary numeric,
  add column if not exists allowances numeric not null default 0,
  add column if not exists deductions numeric not null default 0,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists updated_by uuid references public.users(id);

update public.payroll
set basic_salary = coalesce(basic_salary, gross_salary, 0),
    allowances = coalesce(allowances, total_allowances, 0),
    deductions = coalesce(deductions, total_deductions, 0),
    updated_at = coalesce(updated_at, created_at, now())
where basic_salary is null;

alter table public.payroll alter column basic_salary set not null;
create unique index if not exists payroll_user_id_key on public.payroll (user_id);