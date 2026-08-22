-- ==============================================================================
-- DAYFLOW HRMS — Phase 2: Employee Profile Management
-- ==============================================================================
-- Additive migration on top of 0001_init.sql. No existing columns are dropped
-- or renamed, so this is safe to run on a live Phase 1 database.
--
-- What this does:
--   1. Adds `documents` jsonb column to profiles (array of {name, url} objects,
--      managed by admins via PATCH /api/profile/[userId]).
--   2. Adds an updated_at auto-touch trigger so any profile update keeps
--      updated_at accurate without client cooperation.
--   3. Adds a btree index on department for the admin employee directory's
--      server-side ?department= filter.
--
-- Note: base_salary / allowances / deductions remain on profiles from Phase 1
-- for backwards compatibility only. They are NOT editable through any Phase 2
-- endpoint — Payroll (Phase 5) will read from the `payroll` table joined by
-- user_id instead. Removing these columns is deferred to avoid a breaking
-- migration during the hackathon.
-- ==============================================================================

-- 1. DOCUMENTS (JSON array of {name, url})
alter table public.profiles
    add column if not exists documents jsonb not null default '[]'::jsonb;

-- Optional sanity constraint: documents must be a JSON array of objects with name+url.
-- Validated again server-side in the PATCH endpoints; this is defense in depth.
do $$
begin
    if not exists (
        select 1 from pg_constraint where conname = 'profiles_documents_shape'
    ) then
        alter table public.profiles add constraint profiles_documents_shape
            check (jsonb_typeof(documents) = 'array');
    end if;
end $$;

-- 2. UPDATED_AT AUTO-TOUCH TRIGGER
create or replace function public.touch_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

drop trigger if exists on_profiles_updated on public.profiles;

create trigger on_profiles_updated
    before update on public.profiles
    for each row execute function public.touch_updated_at();

-- 3. DEPARTMENT INDEX (admin directory ?department= filter)
create index if not exists idx_profiles_department
    on public.profiles (department);
