# Dayflow HRMS

Phase 1 foundation for the Odoo x NMIT Hackathon 2026. The app uses Next.js and Supabase Auth/Postgres. Supabase Auth manages password hashing, email verification, and secure session cookies; the profile trigger stores the app role and employee ID.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Create `.env.local` with:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase-anon-key>
```

Apply `supabase/migrations/0001_init.sql` in the Supabase SQL editor. It creates the application `users` identity table plus additive profile/module stubs. Supabase Auth stores password hashes and verification tokens; enable email confirmation in Supabase Auth. Confirmation links use `/auth/callback`; configure the Supabase Site URL and redirect URL to include the deployed origin and `/auth/callback`.

## Phase 1 flow

Sign up with an employee ID, email, role, and a password containing at least 8 characters, one number, and one uppercase letter. Confirm the email, sign in, and use the role-specific dashboard. Both `/dashboard/employee` and `/employee/dashboard` are supported, as are the equivalent admin routes.

## Deployment

Deploy this Next.js app to Vercel, add the same Supabase environment variables, and set the Supabase Site URL and redirect allow-list to the Vercel URL. The live URL is deployment-specific and should be recorded here after deployment:

`Pending deployment`

## Attendance Phase 3

Apply `supabase/migrations/0002_attendance_phase3.sql` after the Phase 1 migration. Employees can use `/employee/attendance` to check in/out and review a seven-day table. Admins can use `/admin/attendance` for date and department-filtered oversight.

Verification notes:

- A normal check-in followed by check-out derives `PRESENT`; late or incomplete days derive `HALF_DAY`.
- `deriveAttendanceStatus` is exported from `src/lib/attendance/status.ts` and returns an existing `LEAVE` status unchanged when `source` is `LEAVE_SYNC`.
- `GET /api/attendance/me` always filters by the authenticated Supabase user ID, so an employee cannot fetch another employee&apos;s records by changing request parameters.
- Missing daily/weekly rows are returned as lazy `ABSENT` records without inserting anything into the database.

## Leave Phase 4

Apply `supabase/migrations/0003_leave_workflow.sql` after the attendance migration. Employees use `/employee/leave` to submit and track `PAID`, `SICK`, or `UNPAID` requests. Admins use `/admin/leave` to approve or reject pending requests. The database function `decide_leave_request` enforces the terminal state machine and performs approval, `LEAVE_SYNC` attendance upserts for every date, and employee notification creation in one transaction.

Verification guarantees:

- Approval creates one `LEAVE` / `LEAVE_SYNC` attendance record for every date in the requested range.
- A second approval or rejection of a decided request is rejected by the database state-machine guard and returns HTTP `409`.
- Employee leave reads and creates are scoped to the authenticated user; only an admin role can call the decision endpoint.

## Payroll Phase 5

Apply `supabase/migrations/0004_payroll_module.sql` after the Phase 4 migration. Employees can view their current payroll snapshot at `/employee/profile` through `GET /api/payroll/me`; the profile display computes net pay as basic salary plus allowances minus deductions without storing a computed field. Admins can manage current records at `/admin/payroll` through `GET /api/payroll` and `PATCH /api/payroll/:userId`.

Payroll guarantees:

- Employee payroll reads are filtered by the authenticated user ID, and the employee-facing API has no mutation method.
- Admin-only updates reject zero or negative basic salary, negative allowances/deductions, and deductions greater than basic salary plus allowances before any database write.
- The profile salary section uses the real `/api/payroll/me` response rather than the profile snapshot values.
