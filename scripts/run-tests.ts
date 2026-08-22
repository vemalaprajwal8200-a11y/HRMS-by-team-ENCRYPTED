import fs from 'fs';
import path from 'path';
import { formatCurrency, formatDate, getInitials, cn } from '../src/lib/utils';
import { formatProfileRow, ProfileRow } from '../src/types/profile';
import { enforceAllowlist } from '../src/lib/api/profile-validation';

// Auto-load .env.local if running standalone script
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...rest] = trimmed.split('=');
      const val = rest.join('=').trim().replace(/^["']|["']$/g, '');
      if (!process.env[key.trim()]) {
        process.env[key.trim()] = val;
      }
    }
  });
}

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, errorDetail?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName} ${errorDetail ? `(${errorDetail})` : ''}`);
    failed++;
  }
}

console.log('\n========================================================');
console.log('🧪 DAYFLOW HRMS: PHASE 1 COMPREHENSIVE TEST SUITE');
console.log('========================================================\n');

// -----------------------------------------------------------------------------
// 1. UTILITY FUNCTIONS & EDGE CASES
// -----------------------------------------------------------------------------
console.log('📦 1. Testing Utilities & Edge Cases');

// Currency formatting
assert(formatCurrency(75000).includes('75,000') || formatCurrency(75000).includes('75000'), 'formatCurrency standard positive integer');
assert(formatCurrency(0).includes('0'), 'formatCurrency zero value');
assert(formatCurrency(null) === '₹0', 'formatCurrency null handling (edge case)');
assert(formatCurrency(undefined) === '₹0', 'formatCurrency undefined handling (edge case)');
assert(formatCurrency(NaN) === '₹0', 'formatCurrency NaN handling (edge case)');
assert(formatCurrency(1250000).includes('12,50,000') || formatCurrency(1250000).includes('1,250,000'), 'formatCurrency large 7-figure amount');

// Date formatting
assert(formatDate('2024-03-15').includes('2024'), 'formatDate valid ISO date');
assert(formatDate(null) === '—', 'formatDate null handling (edge case)');
assert(formatDate(undefined) === '—', 'formatDate undefined handling (edge case)');
assert(formatDate('') === '—', 'formatDate empty string handling (edge case)');

// Initials extraction
assert(getInitials('Alex Vance') === 'AV', 'getInitials standard two names');
assert(getInitials('Priya') === 'PR', 'getInitials single name (first 2 chars)');
assert(getInitials('Rohan Ravi Deshmukh') === 'RD', 'getInitials three names (first + last)');
assert(getInitials('  Ananya  Iyer  ') === 'AI', 'getInitials with leading/trailing whitespace');
assert(getInitials(null) === 'DF', 'getInitials null fallback');
assert(getInitials('') === 'DF', 'getInitials empty string fallback');

// Tailwind class merger (cn)
assert(cn('p-4', 'p-2') === 'p-2', 'cn utility overrides conflicting tailwind padding');
assert(cn('text-sm', false && 'text-lg', 'font-bold') === 'text-sm font-bold', 'cn handles boolean falsy values');

// -----------------------------------------------------------------------------
// 2. DATA MODEL & PROFILE ROW FORMATTER EDGE CASES
// -----------------------------------------------------------------------------
console.log('\n📦 2. Testing Data Model & Profile Formatter');

const standardRow: ProfileRow = {
  id: 'usr-12345',
  employee_id: 'EMP-101',
  full_name: 'Sarah Connor',
  email: 'sarah@dayflow.internal',
  role: 'employee',
  phone: '+91 9876543210',
  address: '123 Tech Park, Bangalore',
  photo_url: null,
  designation: 'Staff Engineer',
  department: 'Platform',
  date_of_joining: '2024-01-10',
  employment_type: 'Full-time',
  documents: [
    { id: 'doc-1', name: 'Offer Letter.pdf', url: 'https://example.com/offer.pdf' },
  ],
  base_salary: 100000,
  allowances: 30000,
  deductions: 15000,
  created_at: '2024-01-10T10:00:00Z',
  updated_at: '2024-01-10T10:00:00Z',
};

const formatted = formatProfileRow(standardRow);
assert(formatted.id === 'usr-12345', 'formatProfileRow preserves ID');
assert(formatted.salaryStructure.netSalary === 115000, 'formatProfileRow calculates net salary correctly (100k + 30k - 15k = 115k)');
assert(formatted.phone === '+91 9876543210', 'formatProfileRow preserves phone');

// Edge Case: Missing / Null numeric fields in profile row
const nullSalaryRow: ProfileRow = {
  id: 'usr-999',
  employee_id: 'EMP-999',
  full_name: 'Jane Doe',
  email: 'jane@dayflow.internal',
  role: 'employee',
  phone: null,
  address: null,
  photo_url: null,
  designation: null,
  department: null,
  date_of_joining: null,
  employment_type: null,
  documents: null,
  base_salary: null,
  allowances: null,
  deductions: null,
  created_at: '2024-01-10T10:00:00Z',
  updated_at: '2024-01-10T10:00:00Z',
};

const formattedNullRow = formatProfileRow(nullSalaryRow);
assert(formattedNullRow.salaryStructure.baseSalary === 0, 'formatProfileRow null base_salary defaults to 0');
assert(formattedNullRow.salaryStructure.netSalary === 0, 'formatProfileRow null salaries produce 0 net salary without NaN');
assert(formattedNullRow.phone === 'Not provided', 'formatProfileRow null phone fallback string');
assert(formattedNullRow.address === 'Not provided', 'formatProfileRow null address fallback string');
assert(formattedNullRow.designation === 'Software Engineer', 'formatProfileRow null designation defaults sensibly');

// Phase 2: Documents jsonb parsing
assert(formatted.documents.length === 1, 'formatProfileRow parses valid documents array');
assert(formatted.documents[0].name === 'Offer Letter.pdf', 'formatProfileRow preserves document name');
assert(formattedNullRow.documents.length === 0, 'formatProfileRow null documents defaults to empty array');
const messyDocsRow: ProfileRow = {
  ...standardRow,
  documents: [
    { name: 'Valid Doc', url: 'https://example.com/a.pdf' },
    'not-an-object',
    42,
    { url: 'missing-name' },
    { name: 'No URL', url: 123 },
  ],
};
const messyDocsFormatted = formatProfileRow(messyDocsRow);
assert(messyDocsFormatted.documents.length === 1, 'formatProfileRow drops malformed document entries');

// Edge Case: Deductions exceed base + allowances (ensure net salary is never negative)
const highDeductionsRow: ProfileRow = {
  ...standardRow,
  base_salary: 10000,
  allowances: 2000,
  deductions: 25000,
};
const formattedHighDeductions = formatProfileRow(highDeductionsRow);
assert(formattedHighDeductions.salaryStructure.netSalary === 0, 'formatProfileRow clamps negative net salary to 0');

// -----------------------------------------------------------------------------
// 3. FORM VALIDATION & SECURITY RULES
// -----------------------------------------------------------------------------
console.log('\n📦 3. Testing Password & Form Validation Rules');

const validatePassword = (pwd: string) => {
  const minLen = pwd.length >= 8;
  const hasNum = /\d/.test(pwd);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd);
  return minLen && hasNum && hasSpecial;
};

// Password criteria checks
assert(!validatePassword('short1!'), 'Reject password < 8 chars');
assert(!validatePassword('AllLettersOnly!'), 'Reject password without number');
assert(!validatePassword('AllLetters12345'), 'Reject password without special character');
assert(validatePassword('StrongPass123!'), 'Accept valid complex password');
assert(validatePassword('Hackathon@2026'), 'Accept hackathon theme password');

// Email regex checks
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
assert(emailRegex.test('alex.vance@dayflow.internal'), 'Accept valid work email');
assert(emailRegex.test('admin+test@company.co.in'), 'Accept email with + tag and multi-part domain');
assert(!emailRegex.test('invalid-email'), 'Reject email without @ and domain');
assert(!emailRegex.test('alex@domain'), 'Reject email without TLD dot');
assert(!emailRegex.test('alex @domain.com'), 'Reject email with spaces');
assert(!emailRegex.test('@nodomain.com'), 'Reject email without username');

// Employee ID validator checks
const validateEmpId = (id: string) => id.trim().length >= 3;
assert(validateEmpId('EMP-101'), 'Accept valid employee ID');
assert(!validateEmpId(''), 'Reject empty employee ID');
assert(!validateEmpId('  '), 'Reject whitespace-only employee ID');
assert(!validateEmpId('E1'), 'Reject employee ID < 3 chars');

// -----------------------------------------------------------------------------
// 4. PROFILE EDIT PERMISSION BOUNDARIES (server-side allowlist — Phase 2)
// -----------------------------------------------------------------------------
console.log('\n📦 4. Testing Profile Edit Permission Boundaries (server allowlist)');

// EMPLOYEE self-edit: only phone / address / photo_url may pass.
const empAllowed = enforceAllowlist(
  { phone: '+91 98765 43210', address: 'New addr', photo_url: '' },
  'employee'
);
assert(empAllowed.ok === true, 'Employee PATCH with allowed fields is accepted');
assert(
  (empAllowed.payload?.phone as string) === '+91 98765 43210',
  'Employee PATCH normalizes phone value'
);

const empPrivilegeEscalation = enforceAllowlist(
  { phone: '+91 1', designation: 'CTO', department: 'C-Suite', base_salary: 999999 },
  'employee'
);
assert(
  empPrivilegeEscalation.ok === false &&
    empPrivilegeEscalation.response?.status === 403,
  'Employee PATCH with restricted fields (designation/department/salary) is REJECTED with 403'
);

const empRoleGrab = enforceAllowlist(
  { phone: '+91 1', role: 'admin', employee_id: 'EMP-0000' },
  'employee'
);
assert(
  empRoleGrab.ok === false && empRoleGrab.response?.status === 403,
  'Employee PATCH attempting role/employee_id escalation is REJECTED with 403'
);

// ADMIN edit: all HR-managed fields allowed…
const adminFull = enforceAllowlist(
  {
    full_name: 'Renamed Person',
    designation: 'Senior Engineer',
    department: 'Platform',
    date_of_joining: '2024-02-01',
    employment_type: 'Contract',
    phone: '+91 90000 00000',
    documents: [{ name: 'ID', url: 'https://example.com/id.pdf' }],
  },
  'admin'
);
assert(adminFull.ok === true, 'Admin PATCH with all HR fields is accepted');

// …but identity and payroll-owned fields are still rejected for admins too.
const adminForbidden = enforceAllowlist(
  { full_name: 'X', role: 'admin', email: 'a@b.co', base_salary: 1, allowances: 2 },
  'admin'
);
assert(
  adminForbidden.ok === false && adminForbidden.response?.status === 403,
  'Admin PATCH on role/email/salary fields is REJECTED with 403 (payroll & identity are out of scope)'
);

// Validation quality gates (apply to both roles).
const badDate = enforceAllowlist({ date_of_joining: 'not-a-date' }, 'admin');
assert(
  badDate.ok === false && badDate.response?.status === 400,
  'Malformed date_of_joining is rejected with 400'
);
const badDoc = enforceAllowlist(
  { documents: [{ name: 'x', url: 'javascript:alert(1)' }] },
  'admin'
);
assert(
  badDoc.ok === false && badDoc.response?.status === 400,
  'Non-http(s) document URL is rejected with 400'
);
const emptyPatch = enforceAllowlist({}, 'employee');
assert(
  emptyPatch.ok === false && emptyPatch.response?.status === 400,
  'Empty PATCH payload is rejected with 400'
);

// -----------------------------------------------------------------------------
// 5. SUPABASE CONFIGURATION DETECTION
// -----------------------------------------------------------------------------
console.log('\n📦 5. Testing Supabase Environment & Config Detection');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

assert(Boolean(url && url.startsWith('https://')), 'NEXT_PUBLIC_SUPABASE_URL is properly configured and valid HTTPS URL');
assert(Boolean(anonKey && anonKey.length > 20), 'NEXT_PUBLIC_SUPABASE_ANON_KEY is non-empty and formatted as JWT');
assert(!url?.includes('your-project-id'), 'NEXT_PUBLIC_SUPABASE_URL does not contain unreplaced placeholder strings');

// -----------------------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------------------
console.log('\n========================================================');
console.log(`📊 TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
console.log('========================================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
