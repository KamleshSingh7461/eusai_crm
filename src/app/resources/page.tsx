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
import Modal, { ModalIcon } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

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
            showToast('Could not load resources', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleStatusChange = async (id: string, status: string) => {
        setResources(prev => prev.map(r => (r.id === id ? { ...r, status: status as Resource['status'] } : r)));
        try {
            const response = await fetch('/api/resources', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status })
            });
            if (!response.ok) throw new Error();
            showToast('Resource status updated', 'success');
        } catch {
            showToast('Could not update the resource', 'error');
            fetchInitialData();
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
                showToast('Resource added', 'success');
                setIsModalOpen(false);
                fetchInitialData();
                setNewResource({ name: '', type: 'PERSONNEL', role: '', hourlyRate: '', projectIds: [] });
            } else {
                showToast('Request failed', 'error');
            }
        } catch (error) {
            showToast('Network error. Try again.', 'error');
        }
    };

    const filteredResources = resources.filter(res => {
        const matchesSearch = res.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (res.role?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
        const matchesTab = activeTab === 'ALL' || res.type === activeTab;
        return matchesSearch && matchesTab;
    });

    return (
        <div className="space-y-6 md:space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">Resources</h1>
                    <p className="mt-2 max-w-2xl text-base text-zinc-400">People, tools and materials allocated to projects.</p>
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
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#3B82F61F] -mr-8 -mt-8 rounded-full opacity-50 group-hover:scale-110 transition-transform" />
                    <div className="relative">
                        <div className="flex items-center gap-2 text-[#3B82F6] mb-3">
                            <Box className="w-4 h-4" />
                            <span className="text-[11px] font-semibold italic">Inventory Strength</span>
                        </div>
                        <p className="text-3xl font-semibold text-heading mb-1">{meta?.totalResources || resources.length}</p>
                        <div className="flex items-center gap-2 text-[11px] font-semibold">
                            <span className="text-[#34D399] bg-[#34D3991F] px-1.5 py-0.5 rounded-sm">{meta?.totalAvailable || 0} Available</span>
                            <span className="text-body">Across {Object.keys(meta?.typeCounts || {}).length} types</span>
                        </div>
                    </div>
                </div>

                <div className="card-jira p-5 rounded-sm border border-[var(--notion-border-default)] bg-[var(--notion-bg-primary)] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#34D3991F] -mr-8 -mt-8 rounded-full opacity-50 group-hover:scale-110 transition-transform" />
                    <div className="relative">
                        <div className="flex items-center gap-2 text-[#34D399] mb-3">
                            <Zap className="w-4 h-4" />
                            <span className="text-[11px] font-semibold italic">Optimization Index</span>
                        </div>
                        <p className="text-3xl font-semibold text-heading mb-1">{meta?.avgUtilization || 0}%</p>
                        <div className="w-full h-1 bg-[var(--notion-bg-tertiary)] rounded-full mt-2 overflow-hidden">
                            <div className="h-full bg-[#34D399]" style={{ width: `${meta?.avgUtilization || 0}%` }} />
                        </div>
                        <p className="text-[11px] text-body font-semibold mt-2 font-mono">{meta?.highUtilizationCount || 0} Assets at Peak Load</p>
                    </div>
                </div>

                <div className="card-jira p-5 rounded-sm border border-[var(--notion-border-default)] bg-[var(--notion-bg-primary)] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#FBBF241F] -mr-8 -mt-8 rounded-full opacity-50 group-hover:scale-110 transition-transform" />
                    <div className="relative">
                        <div className="flex items-center gap-2 text-[#FBBF24] mb-3">
                            <Globe className="w-4 h-4" />
                            <span className="text-[11px] font-semibold italic">Project Saturation</span>
                        </div>
                        <p className="text-3xl font-semibold text-heading mb-1">{meta?.totalAllocated || 0}</p>
                        <p className="text-[11px] text-body font-semibold mb-1">Active Deployments</p>
                        <div className="flex -space-x-1.5 mt-2">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="w-6 h-6 rounded-full border border-white bg-[var(--notion-bg-tertiary)] flex items-center justify-center text-[11px] font-semibold text-subheading">
                                    {String.fromCharCode(64 + i)}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="card-jira p-5 rounded-sm border border-[var(--notion-border-default)] bg-[var(--notion-bg-primary)] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#FB71851F] -mr-8 -mt-8 rounded-full opacity-50 group-hover:scale-110 transition-transform" />
                    <div className="relative">
                        <div className="flex items-center gap-2 text-[#FB7185] mb-3">
                            <DollarSign className="w-4 h-4" />
                            <span className="text-[11px] font-semibold italic">Capital Velocity</span>
                        </div>
                        <p className="text-3xl font-semibold text-heading mb-1">₹{meta?.totalDailyBurn?.toLocaleString() || 0}</p>
                        <p className="text-[11px] text-body font-semibold mb-1">Projected Daily Burn</p>
                        <div className="mt-2 text-[11px] font-semibold text-[#FB7185] flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            <span>8.4% above last cycle</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card-jira p-0 bg-[var(--notion-bg-primary)] border border-[var(--notion-border-default)] rounded-sm overflow-hidden">
                <div className="p-4 md:p-6 border-b border-[var(--notion-border-default)] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-2 bg-[#FFFFFF0A] p-1 rounded-sm w-full lg:w-fit overflow-x-auto no-scrollbar">
                        {(['ALL', 'PERSONNEL', 'TOOL', 'MATERIAL', 'COMPUTE'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-1.5 text-[11px] font-semibold   rounded-sm transition-all whitespace-nowrap ${activeTab === tab
                                    ? 'bg-[var(--notion-bg-primary)] text-[#3B82F6] shadow-sm'
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
                            className="w-full bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] rounded-sm py-2 pl-10 pr-4 text-sm text-heading focus:outline-none focus:ring-1 focus:ring-[#3B82F6] transition-all"
                        />
                    </div>
                </div>

                {isLoading ? (
                    <div className="p-6 sm:p-12 flex flex-col items-center justify-center gap-3 text-body">
                        <Loader2 className="w-8 h-8 animate-spin text-[#3B82F6]" />
                        <p className="text-sm font-semibold tracking-tighter">Auditing global inventory...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[1000px]">
                            <thead className="bg-[var(--notion-bg-secondary)] border-b border-[var(--notion-border-default)]">
                                <tr>
                                    <th className="px-6 py-4 text-[11px] font-semibold text-body">Resource</th>
                                    <th className="px-6 py-4 text-[11px] font-semibold text-body">Type / Specification</th>
                                    <th className="px-6 py-4 text-[11px] font-semibold text-body">Deployment Status</th>
                                    <th className="px-6 py-4 text-[11px] font-semibold text-body">Project Alignment</th>
                                    <th className="px-6 py-4 text-[11px] font-semibold text-body">Utilization Pulse</th>
                                    <th className="px-6 py-4 text-[11px] font-semibold text-body">Rate</th>
                                    <th className="px-6 py-4"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#FFFFFF14]">
                                {filteredResources.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-8 sm:py-12 text-center text-body">
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
                                                    <div className={`p-2 rounded-sm ${res.type === 'PERSONNEL' ? 'bg-[#34D3991F] text-[#059669]' :
                                                        res.type === 'COMPUTE' ? 'bg-[#A78BFA1F] text-[#8B5CF6]' :
                                                            res.type === 'TOOL' ? 'bg-[#3B82F61F] text-[#2563EB]' :
                                                                'bg-[#FBBF241F] text-[#F59E0B]'
                                                        }`}>
                                                        {res.type === 'PERSONNEL' ? <Users className="w-4 h-4" /> :
                                                            res.type === 'COMPUTE' ? <CpuIcon className="w-4 h-4" /> :
                                                                res.type === 'TOOL' ? <HardHat className="w-4 h-4" /> :
                                                                    <Box className="w-4 h-4" />}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-heading text-sm">{res.name}</p>
                                                        <p className="text-[11px] text-body font-mono leading-none">{res.id.slice(0, 8)}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] font-semibold text-subheading tracking-tight">{res.type}</span>
                                                    <span className="text-[11px] text-body font-medium italic">{res.role || 'Unspecified'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-sm text-[11px] font-semibold  tracking-tight ${res.status === 'AVAILABLE' ? 'bg-[#34D3991F] text-[#059669]' :
                                                    res.status === 'ALLOCATED' ? 'bg-[#3B82F61F] text-[#2563EB]' :
                                                        'bg-[#FB71851F] text-[#E11D48]'
                                                    }`}>
                                                    {res.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1 max-w-[200px]">
                                                    {res.projects.length > 0 ? (
                                                        res.projects.map(p => (
                                                            <span key={p.id} className="px-1.5 py-0.5 bg-[#FFFFFF0A] text-subheading text-[11px] font-semibold rounded-sm border border-[var(--notion-border-default)] truncate max-w-[80px]">
                                                                {p.name}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-[11px] text-body italic">Unassigned</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-1 h-1.5 min-w-[60px] bg-[var(--notion-bg-tertiary)] rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full transition-all duration-1000 ${res.utilization > 80 ? 'bg-[#FB7185]' :
                                                                res.utilization > 50 ? 'bg-[#FBBF24]' :
                                                                    'bg-[#34D399]'
                                                                }`}
                                                            style={{ width: `${res.utilization}%` }}
                                                        />
                                                    </div>
                                                    <span className={`text-[11px] font-semibold ${res.utilization > 80 ? 'text-[#FB7185]' : 'text-body'
                                                        }`}>{res.utilization}%</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-semibold text-heading">₹{res.hourlyRate}</span>
                                                    <span className="text-[11px] text-body font-semibold">per hour</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {isExecutive && (
                                                    <select
                                                        value={res.status}
                                                        onChange={e => handleStatusChange(res.id, e.target.value)}
                                                        aria-label={`Status of ${res.name}`}
                                                        className="h-9 rounded-xl border border-white/[0.08] bg-white/[0.03] px-2 text-xs font-medium text-zinc-200 hover:border-white/[0.14] focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                                                    >
                                                        <option value="AVAILABLE">Available</option>
                                                        <option value="ALLOCATED">Allocated</option>
                                                        <option value="OFFLINE">Offline</option>
                                                    </select>
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
                <Modal open onClose={() => setIsModalOpen(false)} size="lg" title="Add a resource" description="Register a person, tool, material or compute resource and allocate it to projects." icon={<ModalIcon><Box /></ModalIcon>} onSubmit={handleAddResource} bodyClassName="p-0 sm:p-0" footer={<><Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button><Button type="submit" leftIcon={<Zap className="h-4 w-4" />}>Add resource</Button></>}>

                        <div className="p-5 sm:p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="col-span-2 space-y-2">
                                    <label className="text-[11px] font-semibold text-body">Name</label>
                                    <input
                                        required
                                        value={newResource.name}
                                        onChange={e => setNewResource({ ...newResource, name: e.target.value })}
                                        className="w-full bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] rounded-sm px-4 py-3 text-heading font-semibold placeholder:font-normal focus:border-[#3B82F6] focus:bg-[var(--notion-bg-primary)] transition-all outline-none"
                                        placeholder="e.g. Designer, laptop, meeting room"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[11px] font-semibold text-body">Category</label>
                                    <select
                                        required
                                        value={newResource.type}
                                        onChange={e => setNewResource({ ...newResource, type: e.target.value as any })}
                                        className="w-full bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] rounded-sm px-4 py-3 text-heading font-semibold focus:border-[#3B82F6] focus:bg-[var(--notion-bg-primary)] transition-all outline-none cursor-pointer"
                                    >
                                        <option value="PERSONNEL">PERSONNEL</option>
                                        <option value="TOOL">TOOL</option>
                                        <option value="MATERIAL">MATERIAL</option>
                                        <option value="COMPUTE">COMPUTE</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[11px] font-semibold text-body">Cost per hour (₹)</label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-body font-semibold">₹</div>
                                        <input
                                            type="number"
                                            required
                                            value={newResource.hourlyRate}
                                            onChange={e => setNewResource({ ...newResource, hourlyRate: e.target.value })}
                                            className="w-full bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] rounded-sm pl-8 pr-4 py-3 text-heading font-semibold focus:border-[#3B82F6] focus:bg-[var(--notion-bg-primary)] transition-all outline-none"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                <div className="col-span-2 space-y-2">
                                    <label className="text-[11px] font-semibold text-body">Role or specification</label>
                                    <input
                                        value={newResource.role}
                                        onChange={e => setNewResource({ ...newResource, role: e.target.value })}
                                        className="w-full bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] rounded-sm px-4 py-3 text-heading font-medium focus:border-[#3B82F6] focus:bg-[var(--notion-bg-primary)] transition-all outline-none"
                                        placeholder="What it is or what this person does"
                                    />
                                </div>

                                <div className="col-span-2 space-y-3">
                                    <label className="text-[11px] font-semibold text-body">Projects</label>
                                    <div className="grid grid-cols-2 gap-2 p-4 bg-[#FFFFFF0A] rounded-sm border border-[var(--notion-border-default)] max-h-40 overflow-y-auto">
                                        {projects.map(p => (
                                            <label key={p.id} className="flex items-center gap-3 p-2 bg-[var(--notion-bg-primary)] border border-[var(--notion-border-default)] rounded-sm cursor-pointer hover:border-[#3B82F6] transition-all group">
                                                <input
                                                    type="checkbox"
                                                    checked={newResource.projectIds.includes(p.id)}
                                                    onChange={e => {
                                                        const ids = e.target.checked
                                                            ? [...newResource.projectIds, p.id]
                                                            : newResource.projectIds.filter(id => id !== p.id);
                                                        setNewResource({ ...newResource, projectIds: ids });
                                                    }}
                                                    className="w-4 h-4 rounded-sm border-[var(--notion-border-default)] text-[#3B82F6] focus:ring-[#3B82F6]"
                                                />
                                                <span className="text-[11px] font-semibold text-subheading group-hover:text-heading truncate">{p.name}</span>
                                            </label>
                                        ))}
                                        {projects.length === 0 && (
                                            <p className="col-span-2 text-[11px] text-body italic text-center py-2">No active projects available for assignment.</p>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-body italic">A resource can be allocated to several projects.</p>
                                </div>
                            </div>
                        </div>

                    
                </Modal>
            )}
        </div>
    );
}
