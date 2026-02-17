"use client";

import React, { useState, useEffect } from 'react';
import {
    Users,
    HardHat,
    Cpu,
    Plus,
    Search,
    Filter,
    MoreVertical,
    Briefcase,
    DollarSign,
    PieChart as PieChartIcon,
    Loader2,
    X,
    CheckCircle2,
    Lock,
    Zap,
    Layout,
    Box,
    Globe,
    TrendingUp,
    TrendingDown,
    Layers,
    Cpu as CpuIcon
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { useSession } from 'next-auth/react';

interface Resource {
    id: string;
    name: string;
    type: 'PERSONNEL' | 'TOOL' | 'MATERIAL' | 'COMPUTE';
    role?: string;
    status: 'AVAILABLE' | 'ALLOCATED' | 'OFFLINE';
    hourlyRate: number;
    utilization: number;
    projects: { id: string, name: string }[];
}

interface ResourceMeta {
    totalResources: number;
    totalAllocated: number;
    totalAvailable: number;
    typeCounts: Record<string, number>;
    avgUtilization: number;
    totalDailyBurn: number;
    highUtilizationCount: number;
}

interface Project {
    id: string;
    name: string;
}

export default function ResourceManagementPage() {
    const { data: session } = useSession();
    const userRole = (session?.user as any)?.role || 'EMPLOYEE';
    const isExecutive = ['DIRECTOR', 'MANAGER'].includes(userRole);

    const [resources, setResources] = useState<Resource[]>([]);
    const [meta, setMeta] = useState<ResourceMeta | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'ALL' | 'PERSONNEL' | 'TOOL' | 'MATERIAL' | 'COMPUTE'>('ALL');
    const { showToast } = useToast();

    // Form State
    const [newResource, setNewResource] = useState({
        name: '',
        type: 'PERSONNEL' as const,
        role: '',
        hourlyRate: '',
        projectIds: [] as string[]
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setIsLoading(true);
        try {
            const [resRes, projRes] = await Promise.all([
                fetch('/api/resources'),
                fetch('/api/projects')
            ]);
            const resData = await resRes.json();
            const projData = await projRes.json();

            if (resData.resources) {
                setResources(resData.resources);
                setMeta(resData.meta);
            } else {
                setResources(Array.isArray(resData) ? resData : []);
            }
            setProjects(Array.isArray(projData) ? projData : []);
        } catch (error) {
            showToast('Failed to load resource inventory', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddResource = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/resources', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newResource)
            });

            if (response.ok) {
                showToast('Resource entry synthesized', 'success');
                setIsModalOpen(false);
                fetchInitialData();
                setNewResource({ name: '', type: 'PERSONNEL', role: '', hourlyRate: '', projectIds: [] });
            } else {
                showToast('Transmission failed', 'error');
            }
        } catch (error) {
            showToast('Network error during provisioning', 'error');
        }
    };

    const filteredResources = resources.filter(res => {
        const matchesSearch = res.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (res.role?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
        const matchesTab = activeTab === 'ALL' || res.type === activeTab;
        return matchesSearch && matchesTab;
    });

    return (
        <div className="space-y-6 md:space-y-8 p-4 md:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-heading mb-1 md:mb-2 font-display">Resource Inventory</h1>
                    <p className="text-body text-sm md:text-base">Strategic asset management for personnel and mission materials.</p>
                </div>
                {isExecutive && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="btn-eusai-create flex items-center justify-center gap-2 px-6 py-2.5 w-full sm:w-auto"
                    >
                        <Plus className="w-5 h-5" />
                        Provision Resource
                    </button>
                )}
            </div>

            {/* Executive Dashboard */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <div className="card-jira p-5 rounded-sm border border-[var(--notion-border-default)] bg-[var(--notion-bg-primary)] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#DEEBFF] -mr-8 -mt-8 rounded-full opacity-50 group-hover:scale-110 transition-transform" />
                    <div className="relative">
                        <div className="flex items-center gap-2 text-[#0052CC] mb-3">
                            <Box className="w-4 h-4" />
                            <span className="text-[10px] font-bold uppercase tracking-widest italic">Inventory Strength</span>
                        </div>
                        <p className="text-3xl font-bold text-heading mb-1">{meta?.totalResources || resources.length}</p>
                        <div className="flex items-center gap-2 text-[10px] font-bold">
                            <span className="text-[#36B37E] bg-[#E3FCEF] px-1.5 py-0.5 rounded-sm">{meta?.totalAvailable || 0} Available</span>
                            <span className="text-body">Across {Object.keys(meta?.typeCounts || {}).length} types</span>
                        </div>
                    </div>
                </div>

                <div className="card-jira p-5 rounded-sm border border-[var(--notion-border-default)] bg-[var(--notion-bg-primary)] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#E3FCEF] -mr-8 -mt-8 rounded-full opacity-50 group-hover:scale-110 transition-transform" />
                    <div className="relative">
                        <div className="flex items-center gap-2 text-[#36B37E] mb-3">
                            <Zap className="w-4 h-4" />
                            <span className="text-[10px] font-bold uppercase tracking-widest italic">Optimization Index</span>
                        </div>
                        <p className="text-3xl font-bold text-heading mb-1">{meta?.avgUtilization || 0}%</p>
                        <div className="w-full h-1 bg-[var(--notion-bg-tertiary)] rounded-full mt-2 overflow-hidden">
                            <div className="h-full bg-[#36B37E]" style={{ width: `${meta?.avgUtilization || 0}%` }} />
                        </div>
                        <p className="text-[9px] text-body font-bold mt-2 font-mono">{meta?.highUtilizationCount || 0} Assets at Peak Load</p>
                    </div>
                </div>

                <div className="card-jira p-5 rounded-sm border border-[var(--notion-border-default)] bg-[var(--notion-bg-primary)] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#FFFAE6] -mr-8 -mt-8 rounded-full opacity-50 group-hover:scale-110 transition-transform" />
                    <div className="relative">
                        <div className="flex items-center gap-2 text-[#FFAB00] mb-3">
                            <Globe className="w-4 h-4" />
                            <span className="text-[10px] font-bold uppercase tracking-widest italic">Project Saturation</span>
                        </div>
                        <p className="text-3xl font-bold text-heading mb-1">{meta?.totalAllocated || 0}</p>
                        <p className="text-[10px] text-body font-bold mb-1">Active Deployments</p>
                        <div className="flex -space-x-1.5 mt-2">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="w-6 h-6 rounded-full border border-white bg-[var(--notion-bg-tertiary)] flex items-center justify-center text-[8px] font-bold text-subheading">
                                    {String.fromCharCode(64 + i)}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="card-jira p-5 rounded-sm border border-[var(--notion-border-default)] bg-[var(--notion-bg-primary)] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#FFEBE6] -mr-8 -mt-8 rounded-full opacity-50 group-hover:scale-110 transition-transform" />
                    <div className="relative">
                        <div className="flex items-center gap-2 text-[#FF5630] mb-3">
                            <DollarSign className="w-4 h-4" />
                            <span className="text-[10px] font-bold uppercase tracking-widest italic">Capital Velocity</span>
                        </div>
                        <p className="text-3xl font-bold text-heading mb-1">₹{meta?.totalDailyBurn?.toLocaleString() || 0}</p>
                        <p className="text-[10px] text-body font-bold mb-1">Projected Daily Burn</p>
                        <div className="mt-2 text-[9px] font-bold text-[#FF5630] flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            <span>8.4% above last cycle</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card-jira p-0 bg-[var(--notion-bg-primary)] border border-[var(--notion-border-default)] rounded-sm overflow-hidden">
                <div className="p-4 md:p-6 border-b border-[var(--notion-border-default)] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-2 bg-[#F4F5F7] p-1 rounded-sm w-full lg:w-fit overflow-x-auto no-scrollbar">
                        {(['ALL', 'PERSONNEL', 'TOOL', 'MATERIAL', 'COMPUTE'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-sm transition-all whitespace-nowrap ${activeTab === tab
                                    ? 'bg-[var(--notion-bg-primary)] text-[#0052CC] shadow-sm'
                                    : 'text-body hover:text-heading'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className="relative w-full lg:max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-body" />
                        <input
                            placeholder="Identify assets or roles..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] rounded-sm py-2 pl-10 pr-4 text-sm text-heading focus:outline-none focus:ring-1 focus:ring-[#0052CC] transition-all"
                        />
                    </div>
                </div>

                {isLoading ? (
                    <div className="p-12 flex flex-col items-center justify-center gap-3 text-body">
                        <Loader2 className="w-8 h-8 animate-spin text-[#0052CC]" />
                        <p className="text-sm font-bold uppercase tracking-tighter">Auditing global inventory...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[1000px]">
                            <thead className="bg-[var(--notion-bg-secondary)] border-b border-[var(--notion-border-default)]">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-bold text-body uppercase tracking-widest">Resource Identity</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-body uppercase tracking-widest">Type / Specification</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-body uppercase tracking-widest">Deployment Status</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-body uppercase tracking-widest">Project Alignment</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-body uppercase tracking-widest">Utilization Pulse</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-body uppercase tracking-widest">Rate</th>
                                    <th className="px-6 py-4"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#DFE1E6]">
                                {filteredResources.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-body">
                                            <div className="flex flex-col items-center gap-2">
                                                <Layers className="w-8 h-8 opacity-20" />
                                                <p className="text-sm italic">No assets found matching your current filters.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredResources.map((res) => (
                                        <tr key={res.id} className="hover:bg-[var(--notion-bg-secondary)] transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-sm ${res.type === 'PERSONNEL' ? 'bg-[#E3FCEF] text-[#006644]' :
                                                        res.type === 'COMPUTE' ? 'bg-[#EAE6FF] text-[#403294]' :
                                                            res.type === 'TOOL' ? 'bg-[#DEEBFF] text-[#0747A6]' :
                                                                'bg-[#FFFAE6] text-[#FF8B00]'
                                                        }`}>
                                                        {res.type === 'PERSONNEL' ? <Users className="w-4 h-4" /> :
                                                            res.type === 'COMPUTE' ? <CpuIcon className="w-4 h-4" /> :
                                                                res.type === 'TOOL' ? <HardHat className="w-4 h-4" /> :
                                                                    <Box className="w-4 h-4" />}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-heading text-sm">{res.name}</p>
                                                        <p className="text-[10px] text-body font-mono leading-none">{res.id.slice(0, 8)}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] font-bold text-subheading uppercase tracking-tight">{res.type}</span>
                                                    <span className="text-[10px] text-body font-medium italic">{res.role || 'Unspecified'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-sm text-[9px] font-bold uppercase tracking-tight ${res.status === 'AVAILABLE' ? 'bg-[#E3FCEF] text-[#006644]' :
                                                    res.status === 'ALLOCATED' ? 'bg-[#DEEBFF] text-[#0747A6]' :
                                                        'bg-[#FFEBE6] text-[#BF2600]'
                                                    }`}>
                                                    {res.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1 max-w-[200px]">
                                                    {res.projects.length > 0 ? (
                                                        res.projects.map(p => (
                                                            <span key={p.id} className="px-1.5 py-0.5 bg-[#F4F5F7] text-subheading text-[8px] font-bold rounded-sm border border-[var(--notion-border-default)] truncate max-w-[80px]">
                                                                {p.name}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-[9px] text-body italic">Unassigned</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-1 h-1.5 min-w-[60px] bg-[var(--notion-bg-tertiary)] rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full transition-all duration-1000 ${res.utilization > 80 ? 'bg-[#FF5630]' :
                                                                res.utilization > 50 ? 'bg-[#FFAB00]' :
                                                                    'bg-[#36B37E]'
                                                                }`}
                                                            style={{ width: `${res.utilization}%` }}
                                                        />
                                                    </div>
                                                    <span className={`text-[10px] font-bold ${res.utilization > 80 ? 'text-[#FF5630]' : 'text-body'
                                                        }`}>{res.utilization}%</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-heading">₹{res.hourlyRate}</span>
                                                    <span className="text-[9px] text-body font-bold uppercase">per hour</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {isExecutive && (
                                                    <button className="p-2 rounded-sm hover:bg-[var(--notion-bg-tertiary)] text-body group-hover:text-heading transition-all">
                                                        <MoreVertical className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Resource Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#091E42]/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <form onSubmit={handleAddResource} className="card-eusai w-full max-w-xl rounded-sm border-[var(--notion-border-default)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 bg-[var(--notion-bg-primary)]">
                        <div className="p-6 border-b border-[var(--notion-border-default)] flex items-center justify-between bg-[var(--notion-bg-secondary)]">
                            <div className="flex items-center gap-3">
                                <div className="p-2bg-[#DEEBFF] rounded-sm text-[#0052CC]">
                                    <Box className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-heading">Synthetic Asset Provisioning</h3>
                                    <p className="text-[10px] text-body font-bold uppercase tracking-widest">Global Inventory Management</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 hover:bg-[var(--notion-bg-tertiary)] rounded-sm transition-colors text-body hover:text-heading"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="col-span-2 space-y-2">
                                    <label className="text-[10px] font-bold text-body uppercase tracking-widest">Resource Identity</label>
                                    <input
                                        required
                                        value={newResource.name}
                                        onChange={e => setNewResource({ ...newResource, name: e.target.value })}
                                        className="w-full bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] rounded-sm px-4 py-3 text-heading font-bold placeholder:font-normal focus:border-[#0052CC] focus:bg-[var(--notion-bg-primary)] transition-all outline-none"
                                        placeholder="e.g. Senior Mission Engineer, H100 Cluster..."
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-body uppercase tracking-widest">Category</label>
                                    <select
                                        required
                                        value={newResource.type}
                                        onChange={e => setNewResource({ ...newResource, type: e.target.value as any })}
                                        className="w-full bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] rounded-sm px-4 py-3 text-heading font-bold focus:border-[#0052CC] focus:bg-[var(--notion-bg-primary)] transition-all outline-none cursor-pointer"
                                    >
                                        <option value="PERSONNEL">PERSONNEL</option>
                                        <option value="TOOL">TOOL</option>
                                        <option value="MATERIAL">MATERIAL</option>
                                        <option value="COMPUTE">COMPUTE</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-body uppercase tracking-widest">Valuation (₹/hr)</label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-body font-bold">₹</div>
                                        <input
                                            type="number"
                                            required
                                            value={newResource.hourlyRate}
                                            onChange={e => setNewResource({ ...newResource, hourlyRate: e.target.value })}
                                            className="w-full bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] rounded-sm pl-8 pr-4 py-3 text-heading font-bold focus:border-[#0052CC] focus:bg-[var(--notion-bg-primary)] transition-all outline-none"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                <div className="col-span-2 space-y-2">
                                    <label className="text-[10px] font-bold text-body uppercase tracking-widest">Operational Role / Specification</label>
                                    <input
                                        value={newResource.role}
                                        onChange={e => setNewResource({ ...newResource, role: e.target.value })}
                                        className="w-full bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] rounded-sm px-4 py-3 text-heading font-medium focus:border-[#0052CC] focus:bg-[var(--notion-bg-primary)] transition-all outline-none"
                                        placeholder="Detailed technical specification or mission role"
                                    />
                                </div>

                                <div className="col-span-2 space-y-3">
                                    <label className="text-[10px] font-bold text-body uppercase tracking-widest">Strategic Project Alignment</label>
                                    <div className="grid grid-cols-2 gap-2 p-4 bg-[#F4F5F7] rounded-sm border border-[var(--notion-border-default)] max-h-40 overflow-y-auto">
                                        {projects.map(p => (
                                            <label key={p.id} className="flex items-center gap-3 p-2 bg-[var(--notion-bg-primary)] border border-[var(--notion-border-default)] rounded-sm cursor-pointer hover:border-[#0052CC] transition-all group">
                                                <input
                                                    type="checkbox"
                                                    checked={newResource.projectIds.includes(p.id)}
                                                    onChange={e => {
                                                        const ids = e.target.checked
                                                            ? [...newResource.projectIds, p.id]
                                                            : newResource.projectIds.filter(id => id !== p.id);
                                                        setNewResource({ ...newResource, projectIds: ids });
                                                    }}
                                                    className="w-4 h-4 rounded-sm border-[var(--notion-border-default)] text-[#0052CC] focus:ring-[#0052CC]"
                                                />
                                                <span className="text-[10px] font-bold text-subheading group-hover:text-heading truncate">{p.name}</span>
                                            </label>
                                        ))}
                                        {projects.length === 0 && (
                                            <p className="col-span-2 text-[10px] text-body italic text-center py-2">No active projects available for assignment.</p>
                                        )}
                                    </div>
                                    <p className="text-[9px] text-body italic">Assets can be shared across multiple strategic initiatives.</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 pt-0">
                            <button
                                type="submit"
                                className="w-full py-4 bg-[#0052CC] text-white rounded-sm font-bold hover:bg-[#0747A6] transition-all shadow-xl shadow-blue-500/10 flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
                            >
                                <Zap className="w-4 h-4" /> Finalize Asset Provisioning
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
