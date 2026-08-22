'use client';

import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

type AdminRecord = { id: string; date: string; check_in: string | null; check_out: string | null; status: 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE'; profiles: { full_name: string; employee_id: string; department: string | null } };
const time = (value: string | null) => value ? new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';

export default function AdminAttendancePage() {
  const [records, setRecords] = useState<AdminRecord[]>([]);
  const [date, setDate] = useState('');
  const [department, setDepartment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = async () => { setLoading(true); const params = new URLSearchParams(); if (date) params.set('date', date); if (department) params.set('department', department); const response = await fetch(`/api/attendance?${params}`); const result = await response.json(); if (!response.ok) setError(result.error || 'Could not load attendance.'); else { setError(''); setRecords(result.records); } setLoading(false); };
  useEffect(() => { void load(); }, [date, department]);
  return <div className="space-y-6"><div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-surface-900">Attendance oversight</h1><p className="text-sm text-surface-500">Review team attendance records.</p></div><Button variant="outline" size="sm" onClick={() => void load()} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>Refresh</Button></div><div className="flex flex-col sm:flex-row gap-3"><input aria-label="Filter by date" type="date" value={date} onChange={(event) => setDate(event.target.value)} className="rounded-lg border border-surface-200 px-3 py-2 text-sm" /><input aria-label="Filter by department" placeholder="Department" value={department} onChange={(event) => setDepartment(event.target.value)} className="rounded-lg border border-surface-200 px-3 py-2 text-sm" /></div>{error && <p className="text-sm text-rose-700">{error}</p>}<div className="rounded-2xl border border-surface-200 bg-white shadow-card overflow-hidden">{loading ? <div className="p-8 text-sm text-surface-500">Loading attendance...</div> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-surface-50 text-left text-xs text-surface-500"><tr><th className="p-4">Employee</th><th className="p-4">Date</th><th className="p-4">Check in</th><th className="p-4">Check out</th><th className="p-4">Status</th></tr></thead><tbody>{records.map((record) => <tr key={record.id} className="border-t border-surface-100"><td className="p-4"><div className="font-medium">{record.profiles.full_name}</div><div className="text-xs text-surface-500">{record.profiles.employee_id} · {record.profiles.department || '—'}</div></td><td className="p-4">{record.date}</td><td className="p-4">{time(record.check_in)}</td><td className="p-4">{time(record.check_out)}</td><td className="p-4"><Badge variant={record.status === 'PRESENT' ? 'success' : record.status === 'HALF_DAY' ? 'warning' : record.status === 'LEAVE' ? 'primary' : 'danger'}>{record.status.replace('_', ' ')}</Badge></td></tr>)}</tbody></table></div>}</div></div>;
}
