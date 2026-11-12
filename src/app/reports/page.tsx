"use client";

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ClipboardCheck, ClipboardList, Gauge, Layers, Plus, UserRound } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import Tabs from '@/components/ui/Tabs';
import DailyReportsView from '@/components/reports/DailyReportsView';
import ComplianceView, { Person } from '@/components/reports/ComplianceView';
import { PerformanceView, WorkloadView } from '@/components/reports/InsightViews';
import { DateRange, DateRangeBar, LEADER_ROLES, PRESETS, REPORTING_ROLES, SENIOR_ROLES, roleName } from '@/components/reports/shared';

type TabId = 'team' | 'tracker' | 'performance' | 'workload' | 'mine';

// links from elsewhere in the app still use the old tab names
const LEGACY: Record<string, TabId> = { TEAM: 'team', MY: 'mine', KPI: 'performance', RESOURCES: 'workload' };

export default function ReportsPageRoute() {
    // useSearchParams needs a Suspense boundary for the production build
    return <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-[#111113]" />}><ReportsPage /></Suspense>;
}

function ReportsPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const params = useSearchParams();
    const user = session?.user as any;
    const role = (user?.role || '').toUpperCase();
    const viewer = user?.name ? `${user.name} (${roleName(role)})` : 'EUSAI user';

    const isLeader = LEADER_ROLES.includes(role);
    const isSenior = SENIOR_ROLES.includes(role);
    const reports = REPORTING_ROLES.includes(role);

    const tabs = useMemo(() => [
        ...(isLeader ? [{ id: 'team', label: 'Team reports', icon: ClipboardList }, { id: 'tracker', label: 'Submission tracker', icon: ClipboardCheck }] : []),
        ...(isSenior ? [{ id: 'performance', label: 'Performance', icon: Gauge }, { id: 'workload', label: 'Workload', icon: Layers }] : []),
        ...(reports ? [{ id: 'mine', label: 'My reports', icon: UserRound }] : []),
    ], [isLeader, isSenior, reports]);

    const requested = params.get('tab') || params.get('activeTab') || '';
    const initial = (LEGACY[requested] || requested) as TabId;
    const [tab, setTab] = useState<TabId>('team');
    useEffect(() => {
        if (!role) return;
        const allowed = tabs.map(t => t.id);
        setTab(allowed.includes(initial) ? initial : (allowed[0] as TabId) || 'mine');
    }, [role]); // eslint-disable-line react-hooks/exhaustive-deps

    const changeTab = (id: string) => {
        setTab(id as TabId);
        const url = new URL(window.location.href);
        url.searchParams.delete('activeTab');
        url.searchParams.set('tab', id);
        router.replace(url.pathname + url.search, { scroll: false });
    };

    const [range, setRange] = useState<DateRange>(() => PRESETS.find(p => p.id === '7d')!.range());

    // people in this viewer's scope who file daily reports (for filters and the tracker)
    const [people, setPeople] = useState<Person[]>([]);
    useEffect(() => {
        if (!isLeader) return;
        fetch('/api/team').then(r => (r.ok ? r.json() : null)).then(d => {
            const list: any[] = Array.isArray(d) ? d : d?.users || [];
            setPeople(list
                .filter(u => !u.isSuspended && REPORTING_ROLES.includes((u.role || '').toUpperCase()) && u.id !== user?.id)
                .map(u => ({ id: u.id, name: u.name || u.email, role: u.role, image: u.image, createdAt: u.createdAt }))
                .sort((a, b) => a.name.localeCompare(b.name)));
        }).catch(() => setPeople([]));
    }, [isLeader, user?.id]);

    const description =
        role === 'DIRECTOR' || role === 'MANAGEMENT' ? 'Daily reports, submission compliance, performance and workload across the organisation.'
            : role === 'MANAGER' ? 'Reports, compliance, performance and workload for your departments and team.'
                : role === 'TEAM_LEADER' ? 'Daily reports and submission compliance for your team.'
                    : 'Your daily reports and history.';

    if (!session) return <div className="h-64 animate-pulse rounded-xl bg-[#111113]" />;
    const usesRange = tab === 'team' || tab === 'tracker' || tab === 'mine';

    return (
        <div className="space-y-6">
            <PageHeader
                eyebrow="Insights"
                title="Reports"
                description={description}
                actions={reports && (
                    <Link href="/reports/submit" className="flex h-9 items-center gap-2 rounded-lg bg-blue-600 px-3.5 text-sm font-medium text-white transition-colors hover:bg-blue-500">
                        <Plus className="h-4 w-4" />Submit today’s report
                    </Link>
                )}
            />

            {tabs.length > 1 && <Tabs items={tabs} value={tab} onChange={changeTab} />}

            {usesRange && <DateRangeBar value={range} onChange={setRange} />}

            {tab === 'team' && isLeader && <DailyReportsView key="team" scope="team" range={range} viewer={viewer} people={people} />}
            {tab === 'tracker' && isLeader && <ComplianceView range={range} viewer={viewer} people={people} />}
            {tab === 'performance' && isSenior && <PerformanceView viewer={viewer} />}
            {tab === 'workload' && isSenior && <WorkloadView viewer={viewer} />}
            {tab === 'mine' && reports && <DailyReportsView key="mine" scope="my" range={range} viewer={viewer} people={[]} />}
        </div>
    );
}
