"use client";

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { CircleAlert, Pencil } from 'lucide-react';
import { StatusPill } from '@/components/ui/Badge';
import EmploymentModal, { type EmployeeRow } from '@/components/employees/EmploymentModal';

const fmt = (d: string | null) => (d ? new Date(`${d}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null);

/** Employment record on a profile page: company, employee ID, designation, joining date and status. */
export default function EmploymentPanel({ userId }: { userId: string }) {
    const { data: session } = useSession();
    const [employee, setEmployee] = useState<EmployeeRow | null>(null);
    const [canEdit, setCanEdit] = useState(false);
    const [editing, setEditing] = useState(false);

    useEffect(() => {
        let alive = true;
        fetch(`/api/employees/${userId}`).then(r => (r.ok ? r.json() : null)).then(d => {
            if (!alive || !d) return;
            setEmployee(d.employee);
            setCanEdit(!!d.canEdit);
        }).catch(() => {});
        return () => { alive = false; };
    }, [userId]);

    if (!employee) return null;
    const rows: [string, React.ReactNode][] = [
        ['Company', employee.company?.legalName],
        ['Designation', employee.designation],
        ['Joined', fmt(employee.dateOfJoining)],
        ...(employee.employmentStatus !== 'ACTIVE' ? [['Last day', fmt(employee.exitDate)] as [string, React.ReactNode]] : []),
    ];

    return (
        <div>
            <div className="mb-4 flex items-center justify-between">
                <h4 className="text-[11px] font-semibold text-white/30">Employment</h4>
                {canEdit && (
                    <button type="button" onClick={() => setEditing(true)} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-zinc-400 hover:bg-white/5 hover:text-white">
                        <Pencil className="h-3 w-3" />Edit
                    </button>
                )}
            </div>
            <div className="space-y-3 rounded-2xl border border-white/5 bg-[#09090B] p-4">
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <p className="text-[11px] text-zinc-500">Employee ID</p>
                        {employee.employeeCode
                            ? <p className="font-mono text-sm font-semibold tracking-wide text-white">{employee.employeeCode}</p>
                            : <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-amber-300"><CircleAlert className="h-3.5 w-3.5" />Not issued yet</p>}
                    </div>
                    <StatusPill status={employee.employmentStatus} />
                </div>
                {rows.map(([label, value]) => (
                    <div key={label}>
                        <p className="text-[11px] text-zinc-500">{label}</p>
                        <p className="text-sm text-zinc-200">{value || <span className="text-zinc-600">Not set</span>}</p>
                    </div>
                ))}
            </div>
            {canEdit && (
                <EmploymentModal employee={editing ? employee : null} onClose={() => setEditing(false)} onSaved={setEmployee}
                    selfId={(session?.user as any)?.id} />
            )}
        </div>
    );
}
