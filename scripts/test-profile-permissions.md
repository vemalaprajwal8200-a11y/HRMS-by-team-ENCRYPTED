# Phase 2 — Profile Permission Boundary Tests (Live API)

Run these **after** starting the app with a configured Supabase project:

```
npm run dev          # terminal 1
```

You need two registered users:
- an **employee** account (role = employee)
- an **admin** account (role = admin)

Grab each user's auth cookie from the browser DevTools → Application → Cookies
→ copy the cookie named `sb-<project-ref>-auth-token` (whole value) while
signed in as that user. Substitute below. On Windows PowerShell:

```powershell
$emp  = "sb-xxxxx-auth-token=<PASTE_EMPLOYEE_COOKIE>"
$adm  = "sb-xxxxx-auth-token=<PASTE_ADMIN_COOKIE>"
$base = "http://localhost:3000"
$otherUserId = "<UUID of any OTHER employee>"   # from GET /api/employees as admin
```

## 1. Employee edits own allowed field -> expect 200

```powershell
Invoke-RestMethod -Method Patch -Uri "$base/api/profile/me" -Headers @{ Cookie = $emp } `
  -ContentType "application/json" -Body '{"phone":"+91 99999 88888"}'
# Expect: 200 with updated profile JSON
```

## 2. Employee tries to edit restricted fields via API directly -> expect 403

This is the escalation attempt judges may try. The server must reject it even
though the UI never offers these inputs:

```powershell
try {
  Invoke-RestMethod -Method Patch -Uri "$base/api/profile/me" -Headers @{ Cookie = $emp } `
    -ContentType "application/json" -Body '{"phone":"+91 1","designation":"CTO","department":"C-Suite","base_salary":999999}'
  Write-Output "FAIL: request should have been rejected"
} catch {
  Write-Output "PASS: $($_.Exception.Response.StatusCode)"   # Expect: 403 Forbidden
}
# Response body lists rejected_fields: designation, department, base_salary
```

Also try role escalation:

```powershell
try {
  Invoke-RestMethod -Method Patch -Uri "$base/api/profile/me" -Headers @{ Cookie = $emp } `
    -ContentType "application/json" -Body '{"role":"admin"}'
  Write-Output "FAIL: role change should have been rejected"
} catch {
  Write-Output "PASS: $($_.Exception.Response.StatusCode)"   # Expect: 403
}
```

## 3. Employee hits admin-only endpoints -> expect 403

```powershell
try { Invoke-RestMethod -Uri "$base/api/employees" -Headers @{ Cookie = $emp } } catch { $_.Exception.Response.StatusCode }        # 403
try { Invoke-RestMethod -Uri "$base/api/profile/$otherUserId" -Headers @{ Cookie = $emp } } catch { $_.Exception.Response.StatusCode }  # 403
try {
  Invoke-RestMethod -Method Patch -Uri "$base/api/profile/$otherUserId" -Headers @{ Cookie = $emp } `
    -ContentType "application/json" -Body '{"designation":"Hacked"}'
} catch { $_.Exception.Response.StatusCode }   # 403
```

## 4. Admin views & edits another employee's HR fields -> expect 200

```powershell
Invoke-RestMethod -Uri "$base/api/employees?search=priya&department=Human%20Resources" -Headers @{ Cookie = $adm }
# Expect: 200, filtered rows + departments facet + pagination

Invoke-RestMethod -Method Patch -Uri "$base/api/profile/$otherUserId" -Headers @{ Cookie = $adm } `
  -ContentType "application/json" -Body '{"designation":"Senior Engineer","department":"Platform","date_of_joining":"2024-02-01"}'
# Expect: 200
```

## 5. Admin cannot touch identity or payroll fields either -> expect 403

Salary lives in the `payroll` table (Phase 5). Role/email changes must go
through the Supabase Admin API. Both are rejected here by design:

```powershell
try {
  Invoke-RestMethod -Method Patch -Uri "$base/api/profile/$otherUserId" -Headers @{ Cookie = $adm } `
    -ContentType "application/json" -Body '{"full_name":"X","base_salary":1,"role":"admin"}'
  Write-Output "FAIL"
} catch { Write-Output "PASS: $($_.Exception.Response.StatusCode)" }   # 403
```

## 6. Unauthenticated access -> expect 401

```powershell
try { Invoke-RestMethod -Uri "$base/api/employees" } catch { $_.Exception.Response.StatusCode }              # 401
try { Invoke-RestMethod -Uri "$base/api/profile/me" } catch { $_.Exception.Response.StatusCode }             # 401
```

## Checklist before demoing

- [ ] Migration `supabase/migrations/0002_phase2_profiles.sql` applied in Supabase SQL editor
- [ ] Cloudinary env vars set in `.env.local` and upload preset created (Unsigned)
- [ ] All six scenarios above executed with both cookies; statuses matched expectations
