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
