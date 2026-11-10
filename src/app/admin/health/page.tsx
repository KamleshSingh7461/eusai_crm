"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { Activity, CheckCircle2, Clock, Cpu, Database, RefreshCw, Server, XCircle } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card, { CardHeader } from '@/components/ui/Card';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { humanize } from '@/components/ui/tones';

interface Health {
    environment: string;
    node: string;
    uptimeSeconds: number;
    memoryMb: number;
    database: { ok: boolean; latencyMs: number | null; error?: string };
    counts: Record<string, number>;
    configured: Record<string, boolean>;
    checkedAt: string;
}

const CONFIG_LABELS: Record<string, string> = { googleSignIn: 'Google sign-in', email: 'Outgoing email (SMTP)', cronSecret: 'Scheduled jobs secret', ai: 'AI provider key' };
const uptime = (s: number) => (s < 3600 ? `${Math.floor(s / 60)} min` : s < 86400 ? `${Math.floor(s / 3600)} hr` : `${Math.floor(s / 86400)} days`);

export default function PlatformHealthPage() {
    const [health, setHealth] = useState<Health | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/system?view=health');
            if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Health check failed');
            setHealth(await res.json());
            setError('');
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    return (
        <div className="space-y-6">
            <PageHeader
                eyebrow="System admin"
                title="Platform health"
                description="Database connection, server status and configuration for this environment."
                actions={<Button variant="secondary" isLoading={loading} leftIcon={<RefreshCw className="h-4 w-4" />} onClick={load}>Run check</Button>}
            />

            {error && <Card className="border-rose-400/25 text-sm text-rose-200">{error}</Card>}

            {!health ? (
                <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4">{[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-40" />)}</div>
            ) : (
                <>
                    <section className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4">
                        <StatCard label="Database" value={health.database.ok ? 'Online' : 'Down'} icon={Database} tone={health.database.ok ? 'emerald' : 'rose'}
                            note={health.database.ok ? `${health.database.latencyMs} ms response` : health.database.error} />
                        <StatCard label="Environment" value={humanize(health.environment)} icon={Server} tone="blue" note={`Node ${health.node}`} />
                        <StatCard label="Uptime" value={uptime(health.uptimeSeconds)} icon={Clock} tone="violet" note="Since the server last started" />
                        <StatCard label="Memory" value={`${health.memoryMb} MB`} icon={Cpu} tone="amber" note="Server process" />
                    </section>

                    <section className="grid gap-5 xl:grid-cols-2">
                        <Card padding="lg">
                            <CardHeader title="Configuration" description="Integrations set for this environment" />
                            <ul className="mt-5 space-y-3">
                                {Object.entries(health.configured).map(([key, ok]) => (
                                    <li key={key} className="flex items-center gap-3 rounded-xl bg-white/[0.03] p-3 text-sm">
                                        {ok ? <CheckCircle2 className="h-5 w-5 text-emerald-300" /> : <XCircle className="h-5 w-5 text-zinc-500" />}
                                        <span className="flex-1 text-zinc-200">{CONFIG_LABELS[key] || key}</span>
                                        <Badge tone={ok ? 'emerald' : 'slate'}>{ok ? 'Configured' : 'Not set'}</Badge>
                                    </li>
                                ))}
                            </ul>
                        </Card>
                        <Card padding="lg">
                            <CardHeader title="Records" description="What is stored in the database" />
                            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                                {Object.entries(health.counts).map(([key, value]) => (
                                    <div key={key} className="rounded-xl bg-white/[0.03] p-4">
                                        <p className="font-display text-2xl font-semibold text-white tabular-nums">{value.toLocaleString('en-IN')}</p>
                                        <p className="text-xs text-zinc-500">{humanize(key.replace(/([A-Z])/g, '_$1'))}</p>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </section>
                    <p className="flex items-center gap-2 text-xs text-zinc-500"><Activity className="h-3.5 w-3.5" />Checked {new Date(health.checkedAt).toLocaleString('en-IN')}</p>
                </>
            )}
        </div>
    );
}
