"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
    GraduationCap,
    MapPin,
    Phone,
    Mail,
    Globe,
    Plus,
    Search,
    Loader2,
    X,
    CheckCircle2,
    FileText,
    TrendingUp
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { useRouter } from 'next/navigation';

interface University {
    id: string;
    name: string;
    location: string;
    status: string;
    contactPerson: string;
    email: string;
    phone: string;
    website: string;
    description: string;
    _count: {
        milestones: number;
        businessOrders: number;
    };
    milestones: any[];
    businessOrders: any[];
}

export default function UniversitiesPage() {
    const { data: session } = useSession();
    const { showToast } = useToast();
    const router = useRouter();
    const [universities, setUniversities] = useState<University[]>([]);
    const [meta, setMeta] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [teamOnly, setTeamOnly] = useState(false);
    const userRole = (session?.user as any)?.role;
    const userId = (session?.user as any)?.id;

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        location: '',
        status: 'PROSPECT',
        contactPerson: '',
        email: '',
        phone: '',
        website: '',
        description: ''
    });

    useEffect(() => {
        fetchUniversities();
    }, [filterStatus, teamOnly]);

    const fetchUniversities = async () => {
        setIsLoading(true);
        try {
            const query = new URLSearchParams();
            if (filterStatus !== 'ALL') query.append('status', filterStatus);
            if (teamOnly) query.append('teamOnly', 'true');

            const res = await fetch(`/api/universities?${query.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setUniversities(data.universities);
                setMeta(data.meta);
            } else {
                showToast('Failed to load universities', 'error');
            }
        } catch (error) {
            showToast('Network error', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/universities', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                showToast('University added successfully', 'success');
                setIsCreateModalOpen(false);
                fetchUniversities();
                setFormData({
                    name: '', location: '', status: 'PROSPECT', contactPerson: '',
                    email: '', phone: '', website: '', description: ''
                });
            } else {
                showToast('Failed to add university', 'error');
            }
        } catch (error) {
            showToast('Error creating university', 'error');
        }
    };

    // Order State
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [selectedUniversityForOrder, setSelectedUniversityForOrder] = useState<University | null>(null);
    const [availableMOUs, setAvailableMOUs] = useState<any[]>([]);
    const [orderFormData, setOrderFormData] = useState({
        title: '',
        amount: '',
        milestoneId: '',
        description: '',
        status: 'PENDING',
        date: new Date().toISOString().split('T')[0]
    });

    const handleOpenOrderModal = async (university: University) => {
        setSelectedUniversityForOrder(university);
        setIsOrderModalOpen(true);
        // Fetch MOUs for this university
        try {
            const res = await fetch(`/api/milestones?universityId=${university.id}&category=MOU`);
            if (res.ok) {
                const data = await res.json();
                setAvailableMOUs(data);
            }
        } catch (error) {
            console.error("Failed to fetch MOUs", error);
        }
    };

    const handleCreateOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUniversityForOrder) return;

        try {
            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...orderFormData,
                    universityId: selectedUniversityForOrder.id
                })
            });

            if (res.ok) {
                showToast('Business Order created successfully', 'success');
                setIsOrderModalOpen(false);
                setOrderFormData({
                    title: '', amount: '', milestoneId: '', description: '', status: 'PENDING', date: new Date().toISOString().split('T')[0]
                });
                fetchUniversities(); // Refresh counts
            } else {
                showToast('Failed to create order', 'error');
            }
        } catch (error) {
            showToast('Error creating order', 'error');
        }
    };

    const handleUpdateStatus = async (universityId: string, newStatus: string) => {
        try {
            const res = await fetch('/api/universities', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: universityId, status: newStatus })
            });

            if (res.ok) {
                showToast(`Status updated to ${newStatus}`, 'success');
                fetchUniversities();
            } else {
                showToast('Failed to update status', 'error');
            }
        } catch (error) {
            showToast('Error updating status', 'error');
        }
    };

    const filteredUniversities = universities.filter(uni =>
        uni.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        uni.location?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">Universities</h1>
                    <p className="mt-2 max-w-2xl text-base text-zinc-400">Manage university partnerships, agreements, and MOUs.</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="btn-eusai-create flex items-center gap-2 px-6 py-3 h-auto"
                >
                    <Plus className="w-5 h-5" />
                    Add University
                </button>
            </div>

            {/* Executive Partnership Dashboard */}
            {meta && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in slide-in-from-top-4 duration-500">
                    <div className="card-jira p-5 bg-[var(--notion-bg-primary)] border border-[var(--notion-border-default)] rounded-sm shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-blue-500/10 rounded-sm">
                            <GraduationCap className="w-6 h-6 text-[#3B82F6]" />
                        </div>
                        <div>
                            <div className="text-2xl font-semibold text-heading">{meta.partnerCount} / {meta.totalEntities}</div>
                            <div className="text-xs font-semibold text-body">Partners / Total</div>
                        </div>
                    </div>

                    <div className="card-jira p-5 bg-[var(--notion-bg-primary)] border border-[var(--notion-border-default)] rounded-sm shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-green-500/10 rounded-sm">
                            <CheckCircle2 className="w-6 h-6 text-[#34D399]" />
                        </div>
                        <div>
                            <div className="text-2xl font-semibold text-heading">{meta.conversionRate}%</div>
                            <div className="text-xs font-semibold text-body">Partner Conversion</div>
                        </div>
                    </div>

                    <div className="card-jira p-5 bg-[var(--notion-bg-primary)] border border-[var(--notion-border-default)] rounded-sm shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-indigo-500/10 rounded-sm">
                            <TrendingUp className="w-6 h-6 text-[#8B5CF6]" />
                        </div>
                        <div>
                            <div className="text-2xl font-semibold text-heading">₹{(meta.totalValue / 100000).toFixed(1)}L</div>
                            <div className="text-xs font-semibold text-body">Portfolio Value</div>
                        </div>
                    </div>

                    <div className="card-jira p-5 bg-[var(--notion-bg-primary)] border border-[var(--notion-border-default)] rounded-sm shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-orange-500/10 rounded-sm">
                            <FileText className="w-6 h-6 text-[#F59E0B]" />
                        </div>
                        <div>
                            <div className="text-2xl font-semibold text-heading">{meta.milestoneProgress}%</div>
                            <div className="text-xs font-semibold text-body">Milestone Health</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="card-jira p-4 flex flex-col md:flex-row gap-4 items-center bg-[var(--notion-bg-primary)] border border-[var(--notion-border-default)] rounded-sm shadow-sm">
                <div className="w-full md:w-auto flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-body" />
                    <input
                        placeholder="Search universities..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] rounded-sm text-sm focus:border-[#3B82F6] outline-none"
                    />
                </div>
                <div className="w-full md:w-auto">
                    <select
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)}
                        className="w-full px-3 py-2 bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] rounded-sm text-sm focus:border-[#3B82F6] outline-none"
                    >
                        <option value="ALL">All Statuses</option>
                        <option value="PROSPECT">Prospect</option>
                        <option value="PARTNER">Partner</option>
                        <option value="INACTIVE">Inactive</option>
                    </select>
                </div>
                {(userRole === 'TEAM_LEADER' || userRole === 'MANAGER') && (
                    <div className="flex items-center gap-1 bg-[var(--notion-bg-tertiary)] p-1 rounded-sm">
                        <button
                            onClick={() => setTeamOnly(false)}
                            className={`px-3 py-1 text-xs font-semibold rounded-sm transition-all ${!teamOnly ? 'bg-[var(--notion-bg-primary)] text-[#3B82F6] shadow-sm' : 'text-subheading hover:text-heading'}`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setTeamOnly(true)}
                            className={`px-3 py-1 text-xs font-semibold rounded-sm transition-all ${teamOnly ? 'bg-[var(--notion-bg-primary)] text-[#3B82F6] shadow-sm' : 'text-subheading hover:text-heading'}`}
                        >
                            My Team
                        </button>
                    </div>
                )}
            </div>

            {/* Grid */}
            {isLoading ? (
                <div className="p-6 sm:p-12 flex flex-col items-center justify-center gap-3 text-body">
                    <Loader2 className="w-8 h-8 animate-spin text-[#3B82F6]" />
                    <p className="text-sm">Loading universities...</p>
                </div>
            ) : filteredUniversities.length === 0 ? (
                <div className="p-6 sm:p-12 text-center border-2 border-dashed border-[var(--notion-border-default)] rounded-sm text-body">
                    <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <h3 className="text-lg font-semibold mb-1">No Universities Found</h3>
                    <p className="text-sm max-w-sm mx-auto">Add a new university to start tracking agreements and business orders.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredUniversities.map((uni) => (
                        <div key={uni.id} className="card-jira p-5 bg-[var(--notion-bg-primary)] border border-[var(--notion-border-default)] rounded-sm shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden flex flex-col">
                            <div className={`absolute top-0 left-0 w-1 h-full ${uni.status === 'PARTNER' ? 'bg-green-500' :
                                uni.status === 'PROSPECT' ? 'bg-blue-500' :
                                    'bg-zinc-300'
                                }`} />

                            <div className="flex justify-between items-start mb-3 pl-2">
                                <div className="p-2 bg-blue-500/10 rounded-sm">
                                    <GraduationCap className="w-6 h-6 text-[#3B82F6]" />
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    {['DIRECTOR', 'MANAGER'].includes(userRole) ? (
                                        <select
                                            value={uni.status}
                                            onChange={(e) => handleUpdateStatus(uni.id, e.target.value)}
                                            className={`px-2 py-0.5 rounded-sm text-[11px] font-semibold  tracking-wide border cursor-pointer outline-none focus:ring-1 focus:ring-[#3B82F6] ${uni.status === 'PARTNER' ? 'bg-green-500/15 text-green-300 border-green-400/25' :
                                                uni.status === 'PROSPECT' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                                                    'bg-white/[0.03] text-fg-muted border-line'
                                                }`}
                                        >
                                            <option value="PROSPECT">PROSPECT</option>
                                            <option value="PARTNER">PARTNER</option>
                                            <option value="INACTIVE">INACTIVE</option>
                                        </select>
                                    ) : (
                                        <span className={`px-2 py-0.5 rounded-sm text-[11px] font-semibold  tracking-wide border ${uni.status === 'PARTNER' ? 'bg-green-500/15 text-green-300 border-green-400/25' :
                                            uni.status === 'PROSPECT' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                                                'bg-white/[0.03] text-fg-muted border-line'
                                            }`}>
                                            {uni.status}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <h3 className="text-lg font-semibold text-heading mb-1 pl-2 truncate" title={uni.name}>
                                {uni.name}
                            </h3>
                            <div className="flex items-center justify-between pr-2 pl-2 mb-4">
                                <div className="flex items-center gap-1.5 text-xs text-body">
                                    <MapPin className="w-3.5 h-3.5" />
                                    <span className="truncate">{uni.location || 'Location not set'}</span>
                                </div>
                                {((uni as any).milestones || []).some((m: any) => m.owner === userId) ? (
                                    <span className="flex items-center gap-1 text-[11px] font-semibold text-[#3B82F6] bg-blue-500/10 px-1.5 py-0.5 rounded-sm border border-blue-500/20">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#1F1F23] animate-pulse" />
                                        My Active
                                    </span>
                                ) : ((uni as any).milestones || []).length > 0 && (
                                    <span className="flex items-center gap-1 text-[11px] font-semibold text-[#34D399] bg-green-500/10 px-1.5 py-0.5 rounded-sm border border-green-400/25">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#1F1F23]" />
                                        Team Active
                                    </span>
                                )}
                            </div>

                            <div className="mt-auto pl-2 space-y-3 pt-3 border-t border-[#FFFFFF0F]">
                                <div className="grid grid-cols-2 gap-2 text-center">
                                    <button
                                        onClick={() => router.push(`/milestones?universityId=${uni.id}`)}
                                        className="p-2 bg-[var(--notion-bg-secondary)] hover:bg-[var(--notion-bg-tertiary)] rounded-sm transition-colors border border-transparent hover:border-[var(--notion-border-default)]"
                                    >
                                        <div className="text-lg font-semibold text-[#3B82F6]">{uni._count.milestones}</div>
                                        <div className="text-[11px] font-semibold text-body">Agreements</div>
                                    </button>
                                    <button
                                        onClick={() => router.push(`/projects?universityId=${uni.id}`)}
                                        className="p-2 bg-[var(--notion-bg-secondary)] hover:bg-[var(--notion-bg-tertiary)] rounded-sm transition-colors border border-transparent hover:border-[var(--notion-border-default)]"
                                    >
                                        <div className="text-lg font-semibold text-heading">{uni._count.businessOrders}</div>
                                        <div className="text-[11px] font-semibold text-body">Orders</div>
                                    </button>
                                </div>

                                {/* Milestone Progress Bar */}
                                {uni.milestones.length > 0 && (
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-[11px] font-semibold text-body">
                                            <span>Milestone Progress</span>
                                            <span>
                                                {Math.round(uni.milestones.reduce((acc, m) => acc + (m.progress || 0), 0) / uni.milestones.length)}%
                                            </span>
                                        </div>
                                        <div className="w-full h-1.5 bg-[var(--notion-bg-tertiary)] rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-[#1F1F23] transition-all duration-500"
                                                style={{ width: `${Math.round(uni.milestones.reduce((acc, m) => acc + (m.progress || 0), 0) / uni.milestones.length)}%` }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Revenue Indicator */}
                                {uni.businessOrders.length > 0 && (
                                    <div className="flex items-center justify-between p-2 bg-green-500/10/50 border border-green-400/25 rounded-sm">
                                        <span className="text-[11px] font-semibold text-green-300">Revenue Generated</span>
                                        <span className="text-xs font-semibold text-green-300">
                                            ₹{uni.businessOrders.reduce((acc, o) => acc + Number(o.amount), 0).toLocaleString()}
                                        </span>
                                    </div>
                                )}

                                {uni.contactPerson && (
                                    <div className="text-xs text-body">
                                        <span className="font-semibold">Contact:</span> {uni.contactPerson}
                                    </div>
                                )}

                                <button
                                    onClick={() => handleOpenOrderModal(uni)}
                                    className="w-full mt-2 py-1.5 text-xs font-medium text-[#3B82F6] bg-blue-500/10 hover:bg-blue-500/20 rounded-sm transition-colors flex items-center justify-center gap-1"
                                >
                                    <Plus className="w-3 h-3" />
                                    Add Business Order
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create University Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-6 bg-black/70 animate-in fade-in duration-200">
                    <div className="bg-[#111113] border border-white/[0.08] rounded-2xl w-full max-w-lg animate-in zoom-in-95 duration-300 h-[80vh] flex flex-col max-h-[92vh] overflow-y-auto rounded-b-none sm:rounded-b-3xl">
                        <div className="p-6 border-b border-[var(--notion-border-default)] flex items-center justify-between bg-[var(--notion-bg-secondary)] shrink-0">
                            <h3 className="text-lg font-semibold text-heading">Add University</h3>
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="p-1 hover:bg-[var(--notion-bg-tertiary)] rounded-sm text-body"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            <form id="create-uni-form" onSubmit={handleCreate} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-body">University Name</label>
                                    <input
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-3 py-2 bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] rounded-sm text-sm focus:border-[#3B82F6] outline-none"
                                        placeholder="e.g. Stanford University"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-body">Location</label>
                                        <input
                                            value={formData.location}
                                            onChange={e => setFormData({ ...formData, location: e.target.value })}
                                            className="w-full px-3 py-2 bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] rounded-sm text-sm focus:border-[#3B82F6] outline-none"
                                            placeholder="City, Country"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-body">Status</label>
                                        <select
                                            value={formData.status}
                                            onChange={e => setFormData({ ...formData, status: e.target.value })}
                                            disabled={!['DIRECTOR', 'MANAGER', 'TEAM_LEADER'].includes((session?.user as any)?.role || '')}
                                            className="w-full px-3 py-2 bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] rounded-sm text-sm focus:border-[#3B82F6] outline-none disabled:bg-white/[0.03] disabled:text-zinc-400"
                                        >
                                            <option value="PROSPECT">Prospect</option>
                                            <option value="PARTNER">Partner</option>
                                            <option value="INACTIVE">Inactive</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-body">Contact Person</label>
                                    <input
                                        value={formData.contactPerson}
                                        onChange={e => setFormData({ ...formData, contactPerson: e.target.value })}
                                        className="w-full px-3 py-2 bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] rounded-sm text-sm focus:border-[#3B82F6] outline-none"
                                        placeholder="Name of key contact"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-body">Email</label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full px-3 py-2 bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] rounded-sm text-sm focus:border-[#3B82F6] outline-none"
                                            placeholder="contact@university.edu"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-body">Phone</label>
                                        <input
                                            value={formData.phone}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full px-3 py-2 bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] rounded-sm text-sm focus:border-[#3B82F6] outline-none"
                                            placeholder="+1 234 567 890"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-body">Website</label>
                                    <input
                                        value={formData.website}
                                        onChange={e => setFormData({ ...formData, website: e.target.value })}
                                        className="w-full px-3 py-2 bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] rounded-sm text-sm focus:border-[#3B82F6] outline-none"
                                        placeholder="https://..."
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-body">Description</label>
                                    <textarea
                                        rows={3}
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-3 py-2 bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] rounded-sm text-sm focus:border-[#3B82F6] outline-none resize-none"
                                        placeholder="Notes about this university..."
                                    />
                                </div>
                            </form>
                        </div>

                        <div className="p-4 border-t border-[var(--notion-border-default)] bg-[var(--notion-bg-secondary)] flex justify-end gap-2 shrink-0">
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="px-4 py-2 hover:bg-[var(--notion-bg-tertiary)] rounded-sm text-subheading font-medium text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="create-uni-form"
                                className="btn-eusai-create flex items-center gap-2 px-4 py-2"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                Save University
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Order Modal */}
            {isOrderModalOpen && selectedUniversityForOrder && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-6 bg-black/70 animate-in fade-in duration-200">
                    <div className="bg-[#111113] border border-white/[0.08] rounded-2xl w-full max-w-lg animate-in zoom-in-95 duration-300 flex flex-col max-h-[92vh] overflow-y-auto rounded-b-none sm:rounded-b-3xl">
                        <div className="p-6 border-b border-[var(--notion-border-default)] flex items-center justify-between bg-[var(--notion-bg-secondary)] shrink-0">
                            <div>
                                <h3 className="text-lg font-semibold text-heading">New Business Order</h3>
                                <p className="text-xs text-body">For {selectedUniversityForOrder.name}</p>
                            </div>
                            <button
                                onClick={() => setIsOrderModalOpen(false)}
                                className="p-1 hover:bg-[var(--notion-bg-tertiary)] rounded-sm text-body"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6">
                            <form id="create-order-form" onSubmit={handleCreateOrder} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-body">Order Title</label>
                                    <input
                                        required
                                        value={orderFormData.title}
                                        onChange={e => setOrderFormData({ ...orderFormData, title: e.target.value })}
                                        className="w-full px-3 py-2 bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] rounded-sm text-sm focus:border-[#3B82F6] outline-none"
                                        placeholder="e.g. Merchandise Batch #1"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-body">Amount (INR)</label>
                                        <input
                                            type="number"
                                            required
                                            value={orderFormData.amount}
                                            onChange={e => setOrderFormData({ ...orderFormData, amount: e.target.value })}
                                            className="w-full px-3 py-2 bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] rounded-sm text-sm focus:border-[#3B82F6] outline-none"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-body">Date</label>
                                        <input
                                            type="date"
                                            required
                                            value={orderFormData.date}
                                            onChange={e => setOrderFormData({ ...orderFormData, date: e.target.value })}
                                            className="w-full px-3 py-2 bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] rounded-sm text-sm focus:border-[#3B82F6] outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-body">Link to MOU (Optional)</label>
                                    <select
                                        value={orderFormData.milestoneId}
                                        onChange={e => setOrderFormData({ ...orderFormData, milestoneId: e.target.value })}
                                        className="w-full px-3 py-2 bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] rounded-sm text-sm focus:border-[#3B82F6] outline-none"
                                    >
                                        <option value="">No specific MOU</option>
                                        {availableMOUs.map(mou => (
                                            <option key={mou.id} value={mou.id}>{mou.title} ({mou.mouType})</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-body">Status</label>
                                    <select
                                        value={orderFormData.status}
                                        onChange={e => setOrderFormData({ ...orderFormData, status: e.target.value })}
                                        className="w-full px-3 py-2 bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] rounded-sm text-sm focus:border-[#3B82F6] outline-none"
                                    >
                                        <option value="PENDING">Pending</option>
                                        <option value="PAID">Paid</option>
                                        <option value="CANCELLED">Cancelled</option>
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-body">Description</label>
                                    <textarea
                                        rows={2}
                                        value={orderFormData.description}
                                        onChange={e => setOrderFormData({ ...orderFormData, description: e.target.value })}
                                        className="w-full px-3 py-2 bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] rounded-sm text-sm focus:border-[#3B82F6] outline-none resize-none"
                                        placeholder="Order details..."
                                    />
                                </div>
                            </form>
                        </div>

                        <div className="p-4 border-t border-[var(--notion-border-default)] bg-[var(--notion-bg-secondary)] flex justify-end gap-2 shrink-0">
                            <button
                                onClick={() => setIsOrderModalOpen(false)}
                                className="px-4 py-2 hover:bg-[var(--notion-bg-tertiary)] rounded-sm text-subheading font-medium text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="create-order-form"
                                className="btn-eusai-create flex items-center gap-2 px-4 py-2"
                            >
                                <TrendingUp className="w-4 h-4" />
                                Create Order
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
