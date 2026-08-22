-- ==============================================================================
-- DAYFLOW HRMS — Initial Database Schema & RLS Policies (Phase 1)
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ==============================================================================
-- 1. PROFILES TABLE
-- ==============================================================================
create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    employee_id text unique not null,
    full_name text not null,
    email text not null,
    role text not null check (role in ('employee', 'admin')) default 'employee',
    phone text,
    address text,
    photo_url text,
    designation text default 'Software Engineer',
    department text default 'Engineering',
    date_of_joining date default current_date,
    employment_type text default 'Full-time',
    base_salary numeric default 75000,
    allowances numeric default 25000,
    deductions numeric default 10000,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- ==============================================================================
-- 2. ATTENDANCE TABLE (Phase 3 Stub)
-- ==============================================================================
create table if not exists public.attendance (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    date date not null default current_date,
    check_in timestamptz,
    check_out timestamptz,
    status text check (status in ('present', 'absent', 'half-day', 'leave')) default 'present',
    created_at timestamptz not null default now()
);

-- ==============================================================================
-- 3. LEAVE REQUESTS TABLE (Phase 4 Stub)
-- ==============================================================================
create table if not exists public.leave_requests (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    type text not null check (type in ('paid', 'sick', 'unpaid', 'casual', 'maternity', 'paternity')),
    start_date date not null,
    end_date date not null,
    remarks text,
    status text not null check (status in ('pending', 'approved', 'rejected')) default 'pending',
    reviewed_by uuid references public.profiles(id),
    comments text,
    created_at timestamptz not null default now()
);

-- ==============================================================================
-- 4. PAYROLL TABLE (Phase 5 Stub)
-- ==============================================================================
create table if not exists public.payroll (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    month text not null,
    gross_salary numeric not null default 0,
    total_allowances numeric not null default 0,
    total_deductions numeric not null default 0,
    net_salary numeric not null default 0,
    status text not null check (status in ('draft', 'processed', 'paid')) default 'draft',
    created_at timestamptz not null default now()
);

-- ==============================================================================
-- 5. TRIGGER: Sync auth.users to public.profiles on Signup (Robust & Collision-Safe)
-- ==============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
    _employee_id text;
    _full_name text;
    _role text;
    _id_exists boolean;
begin
    -- 1. Extract and sanitize full name
    _full_name := coalesce(
        nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
        split_part(coalesce(new.email, 'user'), '@', 1)
    );

    -- 2. Extract and normalize role (strictly 'admin' or 'employee')
    _role := lower(coalesce(nullif(trim(new.raw_user_meta_data->>'role'), ''), 'employee'));
    if _role not in ('admin', 'employee') then
        _role := 'employee';
    end if;

    -- 3. Extract and sanitize employee_id
    _employee_id := upper(coalesce(nullif(trim(new.raw_user_meta_data->>'employee_id'), ''), 'EMP-' || substring(new.id::text, 1, 6)));

    -- 4. Check for employee_id collisions with other users
    select exists (
        select 1 from public.profiles
        where employee_id = _employee_id and id != new.id
    ) into _id_exists;

    -- If collision occurs, make employee_id unique by appending a unique short hash
    if _id_exists then
        _employee_id := _employee_id || '-' || upper(substring(new.id::text, 1, 4));
    end if;

    -- 5. Insert or update profile safely
    insert into public.profiles (
        id,
        employee_id,
        full_name,
        email,
        role,
        designation,
        department,
        employment_type,
        base_salary,
        allowances,
        deductions,
        created_at,
        updated_at
    )
    values (
        new.id,
        _employee_id,
        _full_name,
        coalesce(new.email, ''),
        _role,
        case when _role = 'admin' then 'HR Administrator' else 'Software Engineer' end,
        case when _role = 'admin' then 'Human Resources' else 'Engineering' end,
        'Full-time',
        case when _role = 'admin' then 95000 else 75000 end,
        case when _role = 'admin' then 30000 else 25000 end,
        case when _role = 'admin' then 15000 else 10000 end,
        now(),
        now()
    )
    on conflict (id) do update set
        email = excluded.email,
        full_name = coalesce(excluded.full_name, profiles.full_name),
        role = excluded.role,
        updated_at = now();

    return new;
exception
    when others then
        -- Log warning and allow auth signup to complete rather than aborting transaction
        raise warning 'handle_new_user trigger encountered an error: %', sqlerrm;
        return new;
end;
$$;

-- Drop trigger if already exists and recreate
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

-- ==============================================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
alter table public.profiles enable row level security;
alter table public.attendance enable row level security;
alter table public.leave_requests enable row level security;
alter table public.payroll enable row level security;

-- Helper function: Check if current authenticated user is an admin (Security Definer with isolated search path)
create or replace function public.is_admin()
returns boolean
language plpgsql
security definer
set search_path = public, auth
stable
as $$
begin
    return exists (
        select 1 from public.profiles
        where id = auth.uid() and role = 'admin'
    );
end;
$$;

-- Drop old policies if existing to avoid conflict on re-runs
drop policy if exists "Users can view their own profile or admins view all" on public.profiles;
drop policy if exists "Users can view profiles" on public.profiles;
drop policy if exists "Users can update their own profile or admins update all" on public.profiles;
drop policy if exists "Users can insert their own profile or admins insert all" on public.profiles;
drop policy if exists "Admins can delete profiles" on public.profiles;

-- PROFILES RLS POLICIES
-- 1. SELECT: Authenticated users can view team member directory records
create policy "Users can view profiles"
    on public.profiles for select
    using (auth.role() = 'authenticated');

-- 2. UPDATE: Users can UPDATE their own contact info, Admins can update all fields
create policy "Users can update their own profile or admins update all"
    on public.profiles for update
    using (auth.uid() = id or is_admin())
    with check (auth.uid() = id or is_admin());

-- 3. INSERT: Users creating their own profile (id = auth.uid()) or admins creating any profile
create policy "Users can insert their own profile or admins insert all"
    on public.profiles for insert
    with check (auth.uid() = id or is_admin());

-- 4. DELETE: Only admins can delete profiles
create policy "Admins can delete profiles"
    on public.profiles for delete
    using (is_admin());

-- ATTENDANCE RLS POLICIES
drop policy if exists "Users can view own attendance or admin can view all" on public.attendance;
drop policy if exists "Users can record own attendance or admin manage" on public.attendance;
drop policy if exists "Admins can update attendance" on public.attendance;

create policy "Users can view own attendance or admin can view all"
    on public.attendance for select
    using (auth.uid() = user_id or is_admin());

create policy "Users can record own attendance or admin manage"
    on public.attendance for insert
    with check (auth.uid() = user_id or is_admin());

create policy "Admins can update attendance"
    on public.attendance for update
    using (is_admin());

-- LEAVE REQUESTS RLS POLICIES
drop policy if exists "Users can view own leave requests or admin view all" on public.leave_requests;
drop policy if exists "Users can create own leave requests" on public.leave_requests;
drop policy if exists "Admins can update leave requests" on public.leave_requests;

create policy "Users can view own leave requests or admin view all"
    on public.leave_requests for select
    using (auth.uid() = user_id or is_admin());

create policy "Users can create own leave requests"
    on public.leave_requests for insert
    with check (auth.uid() = user_id or is_admin());

create policy "Admins can update leave requests"
    on public.leave_requests for update
    using (is_admin());

-- PAYROLL RLS POLICIES
drop policy if exists "Users can view own payroll or admin view all" on public.payroll;
drop policy if exists "Only admins can manage payroll" on public.payroll;

create policy "Users can view own payroll or admin view all"
    on public.payroll for select
    using (auth.uid() = user_id or is_admin());

create policy "Only admins can manage payroll"
    on public.payroll for all
    using (is_admin());
