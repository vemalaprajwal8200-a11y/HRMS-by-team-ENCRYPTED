import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, unauthorized, forbidden } from '@/lib/api/guard';

export const dynamic = 'force-dynamic';

const LIST_COLUMNS =
  'id, employee_id, full_name, email, role, designation, department, photo_url, date_of_joining';
const MAX_PAGE_SIZE = 100;

/**
 * GET /api/employees — ADMIN ONLY.
 * Server-side searchable/filterable directory. Query params:
 *   ?search=       matches full_name or employee_id (case-insensitive)
 *   ?department=   exact department match
 *   ?page=         1-based page number (default 1)
 *   ?pageSize=     up to 100 rows per page (default 25)
 *
 * All filtering happens in Postgres (ilike/eq + range) so this scales to the
 * eventual dataset — we never fetch-all-then-filter client side.
 */
export async function GET(request: NextRequest) {
  const auth = await getAuthContext();
  if (!auth) return unauthorized();
  if (auth.role !== 'admin') {
    return forbidden('Admin access required for the employee directory.');
  }

  const { searchParams } = request.nextUrl;

  const search = (searchParams.get('search') ?? '').trim().slice(0, 100);
  const department = (searchParams.get('department') ?? '').trim().slice(0, 120);

  const pageRaw = Number.parseInt(searchParams.get('page') ?? '1', 10);
  const pageSizeRaw = Number.parseInt(searchParams.get('pageSize') ?? '25', 10);
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
  const pageSize =
    Number.isFinite(pageSizeRaw) && pageSizeRaw > 0
      ? Math.min(pageSizeRaw, MAX_PAGE_SIZE)
      : 25;

  let query = auth.supabase
    .from('profiles')
    .select(LIST_COLUMNS, { count: 'exact' })
    .order('full_name', { ascending: true })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (search) {
    // Escape user input so it is treated literally inside the ilike pattern.
    const escaped = search.replace(/[%_\\]/g, (match) => `\\${match}`);
    query = query.or(
      `full_name.ilike.%${escaped}%,employee_id.ilike.%${escaped}%`
    );
  }

  if (department && department !== 'ALL') {
    query = query.eq('department', department);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('GET /api/employees failed:', error.message);
    return NextResponse.json(
      { error: 'Could not load the employee directory.' },
      { status: 500 }
    );
  }

  // Distinct departments for the filter dropdown (cheap on indexed column).
  const { data: deptRows } = await auth.supabase
    .from('profiles')
    .select('department')
    .not('department', 'is', null);

  const deptList = (deptRows ?? []) as Array<{ department: string | null }>;
  const departments = Array.from(
    new Set(deptList.map((row) => row.department).filter(Boolean))
  ).sort() as string[];

  return NextResponse.json({
    employees: data ?? [],
    departments,
    pagination: {
      page,
      pageSize,
      total: count ?? 0,
      totalPages: Math.max(1, Math.ceil((count ?? 0) / pageSize)),
    },
  });
}
