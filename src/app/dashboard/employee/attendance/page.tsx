'use client';

import { useEffect, useState } from 'react';
import { CalendarCheck, Clock3, LogIn, LogOut, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

type RecordRow = { id: string; date: string; check_in: string | null; check_out: string | null; status: 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE'; source: 'AUTO' | 'LEAVE_SYNC'; created_at: string };
const today = () => new Date().toISOString().slice(0, 10);
const time = (value: string | null) => value ? new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';

export default function AttendancePage() {
  const [records, setRecords] = useState<RecordRow[]>([]);
  const [todayRecord, setTodayRecord] = useState<RecordRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    const response = await fetch('/api/attendance/me?range=weekly');
    const result = await response.json();
    if (!response.ok) setError(result.error || 'Could not load attendance.');
    else { setRecords(result.records); setTodayRecord(result.records.find((record: RecordRow) => record.date === today()) || null); }
    setLoading(false);
  };
  useEffect(() => { void load(); }, []);

  const act = async (endpoint: 'check-in' | 'check-out') => {
    setWorking(true); setError('');
    const optimisticTime = new Date().toISOString();
    const optimistic: RecordRow = todayRecord
      ? { ...todayRecord, check_out: optimisticTime, status: 'PRESENT' }
      : { id: 'optimistic', date: today(), check_in: optimisticTime, check_out: null, status: 'PRESENT', source: 'AUTO', created_at: optimisticTime };
    setTodayRecord(optimistic);
    setRecords((current) => [optimistic, ...current.filter((record) => record.date !== today())]);
    try {
      const response = await fetch(`/api/attendance/${endpoint}`, { method: 'POST' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Attendance update failed.');
      setTodayRecord(result.record);
      setRecords((current) => [result.record, ...current.filter((record) => record.date !== today())]);
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Attendance update failed.'); await load(); }
    finally { setWorking(false); }
  };

  return <div className="space-y-6">
    <div className="flex items-center justify-between gap-4"><div><h1 className="text-2xl font-bold text-surface-900">Attendance</h1><p className="text-sm text-surface-500">Track today and review your last seven days.</p></div><Button variant="outline" size="sm" onClick={() => void load()} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>Refresh</Button></div>
    <section className="rounded-2xl border border-brand-200 bg-brand-50/60 p-6 shadow-card"><div className="flex items-center gap-2 text-brand-700 text-sm font-semibold"><CalendarCheck className="w-5 h-5" /> Today&apos;s attendance</div><div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-5"><div><p className="text-xl font-bold text-surface-900">{todayRecord?.check_out ? 'Done for today' : todayRecord?.check_in ? `Checked in at ${time(todayRecord.check_in)}` : 'Nothing recorded yet'}</p><p className="text-sm text-surface-600 mt-1">{todayRecord?.check_out ? `Checked in ${time(todayRecord.check_in)} / out ${time(todayRecord.check_out)}` : 'Start your workday with one tap.'}</p></div>{todayRecord?.check_out ? <Badge variant="success" size="md">Complete</Badge> : <Button variant="primary" size="lg" isLoading={working} onClick={() => void act(todayRecord?.check_in ? 'check-out' : 'check-in')} leftIcon={todayRecord?.check_in ? <LogOut className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}>{todayRecord?.check_in ? 'Check Out' : 'Check In'}</Button>}</div>{error && <p className="mt-4 text-sm text-rose-700">{error}</p>}</section>
    <section className="rounded-2xl border border-surface-200 bg-white shadow-card overflow-hidden"><div className="p-5 border-b border-surface-100"><h2 className="font-bold text-surface-900">Last 7 days</h2></div>{loading ? <div className="p-8 text-sm text-surface-500">Loading attendance...</div> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-surface-50 text-left text-xs text-surface-500"><tr><th className="p-4">Date</th><th className="p-4">Check in</th><th className="p-4">Check out</th><th className="p-4">Status</th></tr></thead><tbody>{records.map((record) => <tr key={record.id || record.date} className={`border-t border-surface-100 ${record.date === today() ? 'bg-brand-50/40' : ''}`}><td className="p-4 font-medium">{record.date}{record.date === today() && <span className="ml-2 text-xs text-brand-600">Today</span>}</td><td className="p-4"><Clock3 className="inline w-3.5 h-3.5 mr-1 text-surface-400" />{time(record.check_in)}</td><td className="p-4">{time(record.check_out)}</td><td className="p-4"><Badge variant={record.status === 'PRESENT' ? 'success' : record.status === 'LEAVE' ? 'primary' : record.status === 'HALF_DAY' ? 'warning' : 'danger'}>{record.status.replace('_', ' ')}</Badge></td></tr>)}</tbody></table></div>}</section>
  </div>;
}
