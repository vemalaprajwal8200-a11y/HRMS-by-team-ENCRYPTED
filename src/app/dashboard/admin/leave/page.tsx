'use client';

import { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

type RequestRow = { id: string; type: string; start_date: string; end_date: string; status: 'PENDING' | 'APPROVED' | 'REJECTED'; profiles: { full_name: string; employee_id: string } };

export default function AdminLeavePage() {
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [status, setStatus] = useState('PENDING');
  const [comments, setComments] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const load = async () => { const response = await fetch(`/api/leave-requests?status=${status}`); const result = await response.json(); if (response.ok) { setError(''); setRequests(result.requests); } else setError(result.error); };
  useEffect(() => { void load(); }, [status]);
  const decide = async (id: string, nextStatus: 'APPROVED' | 'REJECTED') => { const response = await fetch(`/api/leave-requests/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: nextStatus, admin_comment: comments[id] || '' }) }); const result = await response.json(); if (!response.ok) setError(result.error); else void load(); };
  return <div className="space-y-6"><div><h1 className="text-2xl font-bold text-surface-900">Leave approvals</h1><p className="text-sm text-surface-500">Review employee requests and sync approved leave to attendance.</p></div><select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-lg border border-surface-200 px-3 py-2 text-sm"><option value="PENDING">Pending</option><option value="APPROVED">Approved</option><option value="REJECTED">Rejected</option><option value="">All statuses</option></select>{error && <p className="text-sm text-rose-700">{error}</p>}<div className="rounded-2xl border border-surface-200 bg-white shadow-card overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-surface-50 text-left text-xs text-surface-500"><tr><th className="p-4">Employee</th><th className="p-4">Leave</th><th className="p-4">Dates</th><th className="p-4">Comment / action</th></tr></thead><tbody>{requests.length === 0 ? <tr><td colSpan={4} className="p-8 text-center text-sm text-surface-500">No leave requests match this filter.</td></tr> : requests.map((request) => <tr key={request.id} className="border-t border-surface-100"><td className="p-4"><div className="font-medium">{request.profiles.full_name}</div><div className="text-xs text-surface-500">{request.profiles.employee_id}</div></td><td className="p-4"><Badge>{request.type}</Badge></td><td className="p-4">{request.start_date} to {request.end_date}</td><td className="p-4">{request.status === 'PENDING' ? <div className="flex flex-wrap gap-2"><input value={comments[request.id] || ''} onChange={(event) => setComments({ ...comments, [request.id]: event.target.value })} placeholder="Optional comment" className="min-w-40 rounded-lg border border-surface-200 px-2 py-1.5 text-xs" /><Button size="sm" variant="primary" onClick={() => void decide(request.id, 'APPROVED')} leftIcon={<Check className="w-3.5 h-3.5" />}>Approve</Button><Button size="sm" variant="outline" onClick={() => void decide(request.id, 'REJECTED')} leftIcon={<X className="w-3.5 h-3.5" />}>Reject</Button></div> : <Badge variant={request.status === 'APPROVED' ? 'success' : 'danger'}>{request.status}</Badge>}</td></tr>)}</tbody></table></div></div></div>;
}
