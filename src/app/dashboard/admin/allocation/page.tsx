'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';

type Employee = { id: string; full_name: string; employee_id: string };
type Allocation = { PAID: string; SICK: string; UNPAID: string };

export default function AdminAllocationPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [values, setValues] = useState<Record<string, Allocation>>({});
  const [message, setMessage] = useState('');
  useEffect(() => { void fetch('/api/employees').then((response) => response.json()).then((result) => setEmployees(result.employees || [])); }, []);
  const save = async (id: string) => { const response = await fetch(`/api/leave-balances/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ balances: values[id] || { PAID: '20', SICK: '10', UNPAID: '0' } }) }); const result = await response.json(); setMessage(response.ok ? 'Allocation updated.' : result.error); };
  return <div className="space-y-6"><div><h1 className="text-2xl font-bold text-surface-900">Leave allocation</h1><p className="text-sm text-surface-500">Set yearly balances for each employee.</p></div>{message && <p className="text-sm text-surface-600">{message}</p>}<div className="overflow-x-auto rounded-2xl border border-surface-200 bg-white shadow-card"><table className="w-full text-sm"><thead className="bg-surface-50 text-left text-xs text-surface-500"><tr><th className="p-4">Employee</th><th className="p-4">Paid days</th><th className="p-4">Sick days</th><th className="p-4">Unpaid days</th><th className="p-4">Action</th></tr></thead><tbody>{employees.length === 0 ? <tr><td colSpan={5} className="p-8 text-center text-sm text-surface-500">No employees available.</td></tr> : employees.map((employee) => { const allocation = values[employee.id] || { PAID: '20', SICK: '10', UNPAID: '0' }; return <tr key={employee.id} className="border-t border-surface-100"><td className="p-4 font-medium">{employee.full_name}<span className="ml-2 text-xs text-surface-500">{employee.employee_id}</span></td>{(['PAID', 'SICK', 'UNPAID'] as const).map((type) => <td className="p-4" key={type}><input type="number" min="0" value={allocation[type]} onChange={(event) => setValues({ ...values, [employee.id]: { ...allocation, [type]: event.target.value } })} className="w-24 rounded-lg border border-surface-200 px-2 py-1.5" /></td>)}<td className="p-4"><Button size="sm" variant="primary" onClick={() => void save(employee.id)}>Save</Button></td></tr>; })}</tbody></table></div></div>;
}
