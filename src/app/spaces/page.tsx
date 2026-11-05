"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowUpRight, BookOpen, Briefcase, Building2, Layers, Plus, Search } from 'lucide-react';
import { useSpace } from '@/context/SpaceContext';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import Input from '@/components/ui/Input';
import PageHeader from '@/components/ui/PageHeader';
import Tabs from '@/components/ui/Tabs';
import { Skeleton } from '@/components/ui/Skeleton';
import CreateSpaceModal from '@/components/modals/CreateSpaceModal';

export default function SpacesPage() {
    const router = useRouter();
    const { spaces, isLoading } = useSpace();
    const { data: session } = useSession();
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('ALL');
    const [createOpen, setCreateOpen] = useState(false);

    const userRole = (session?.user as any)?.role || 'EMPLOYEE';
    // Only directors can create departments (enforced by the spaces API).
    const canManageSpaces = userRole === 'DIRECTOR';

    const q = searchQuery.toLowerCase();
    const filteredSpaces = spaces.filter((space: any) =>
        (space.name.toLowerCase().includes(q) || space.description?.toLowerCase().includes(q))
        && (filterType === 'ALL' || space.type === filterType)
    );
    const count = (type: string) => spaces.filter((s: any) => s.type === type).length;

    return (
        <div className="space-y-6">
            <PageHeader
                eyebrow="Organization"
                title="Departments"
                description="Departments and spaces group your projects, people and knowledge."
                actions={canManageSpaces && <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setCreateOpen(true)}>New department</Button>}
            />

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Tabs value={filterType} onChange={setFilterType} items={[
                    { id: 'ALL', label: 'All', count: spaces.length },
                    { id: 'DEPARTMENT', label: 'Departments', count: count('DEPARTMENT') },
                    { id: 'STANDARD', label: 'Spaces', count: count('STANDARD') },
                ]} />
                <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search departments" leftIcon={<Search />} containerClassName="sm:w-72" />
            </div>

            {isLoading ? (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map(i => <Skeleton key={i} className="h-56" />)}</div>
            ) : filteredSpaces.length === 0 ? (
                <Card>
                    <EmptyState
                        icon={Building2}
                        title={spaces.length === 0 ? 'No departments yet' : 'No departments match'}
                        description={spaces.length === 0 ? 'Create a department to group projects and people.' : 'Try a different search or filter.'}
                        action={spaces.length === 0 && canManageSpaces && <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setCreateOpen(true)}>New department</Button>}
                    />
                </Card>
            ) : (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {filteredSpaces.map((space: any, i: number) => (
                        <Card key={space.id} delay={i * 0.04} interactive padding="none" onClick={() => router.push(`/spaces/${space.id}`)} className="group overflow-hidden">
                            <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${space.color}, ${space.color}33)` }} />
                            <div className="p-5">
                                <div className="flex items-start justify-between">
                                    <span className="flex h-12 w-12 items-center justify-center rounded-xl text-base font-bold text-white" style={{ backgroundColor: space.color, boxShadow: `0 10px 30px -10px ${space.color}` }}>
                                        {space.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                                    </span>
                                    <ArrowUpRight className="h-5 w-5 text-slate-600 transition group-hover:text-slate-200" />
                                </div>
                                <h3 className="mt-4 truncate font-display text-lg font-bold text-white">{space.name}</h3>
                                <p className="mt-1 line-clamp-2 min-h-[40px] text-sm text-slate-400">{space.description || 'No description yet.'}</p>
                                <div className="mt-5 flex items-center gap-4 border-t border-white/[0.06] pt-4 text-sm">
                                    <span className="flex items-center gap-1.5 text-slate-300"><Briefcase className="h-4 w-4 text-blue-300" />{space._count?.projects || 0} projects</span>
                                    <span className="flex items-center gap-1.5 text-slate-300"><Layers className="h-4 w-4 text-amber-300" />{space._count?.resources || 0} resources</span>
                                    <Badge tone={space.type === 'DEPARTMENT' ? 'violet' : 'slate'} className="ml-auto">{space.type === 'DEPARTMENT' ? 'Department' : 'Space'}</Badge>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            <Card padding="lg" className="flex flex-col items-start gap-4 border-violet-400/20 bg-gradient-to-r from-violet-500/[0.1] to-transparent sm:flex-row sm:items-center">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300 ring-1 ring-inset ring-violet-400/25"><BookOpen className="h-5 w-5" /></span>
                <div className="flex-1">
                    <p className="font-semibold text-white">How departments work</p>
                    <p className="mt-0.5 text-sm text-slate-400">Each department has a manager, members, projects and its own knowledge pages. Members see the work of the departments they belong to.</p>
                </div>
                <Button variant="secondary" onClick={() => router.push('/welcome')}>Read the guide</Button>
            </Card>

            <CreateSpaceModal open={createOpen} onClose={() => setCreateOpen(false)} />
        </div>
    );
}
