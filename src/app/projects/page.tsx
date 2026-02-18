"use client";

import React, { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    Filter,
    MoreVertical,
    Calendar,
    DollarSign,
    Briefcase,
    ChevronRight,
    Loader2,
    Trash2,
    TrendingUp,
    AlertCircle,
    CheckCircle2,
    PieChart,
    Settings,
    Layout
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useToast } from '@/context/ToastContext';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import ProjectEditModal from '@/components/projects/ProjectEditModal';
import SpaceBreakdown from '@/components/projects/SpaceBreakdown';

interface ProjectCardProps {
    project: any;
    userRole: string;
    onDelete: (id: string, e: React.MouseEvent) => void;
    onClick: () => void;
}

function ProjectCard({ project, userRole, onDelete, onClick }: ProjectCardProps) {
    return (
        <div
            className="group bg-white border border-[#DFE1E6] hover:border-[#0052CC] rounded-sm p-6 hover:shadow-xl transition-all duration-300 flex flex-col h-full cursor-pointer relative overflow-hidden"
            onClick={onClick}
        >
            {/* Status Indicator Bar */}
            <div className={`absolute top-0 left-0 w-full h-1 ${project.status === 'EXECUTION' ? 'bg-emerald-500' :
                project.status === 'PLANNING' ? 'bg-blue-500' :
                    project.status === 'MONITORING' ? 'bg-orange-500' :
                        'bg-[#DFE1E6]'
                }`} />

            <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-sm bg-gradient-to-br from-[#0052CC] to-[#2684FF] flex items-center justify-center text-white font-bold text-xl shadow-sm">
                    {project.name.charAt(0)}
                </div>
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    {['DIRECTOR', 'MANAGER'].includes(userRole) && (
                        <button
                            className="p-1.5 hover:bg-gray-100 rounded-sm text-[#6B778C] transition-colors"
                            title="Edit Project"
                        >
                            <Settings className="w-4 h-4" />
                        </button>
                    )}
                    {['DIRECTOR'].includes(userRole) && (
                        <button
                            onClick={(e) => onDelete(project.id, e)}
                            className="p-1.5 hover:bg-red-50 rounded-sm text-[#6B778C] hover:text-[#FF5630] transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-1 mb-6">
                <h3 className="text-xl font-bold text-[#172B4D] mb-2 group-hover:text-[#0052CC] transition-colors font-display">{project.name}</h3>
                <p className="text-sm text-[#6B778C] line-clamp-2 leading-relaxed h-10">
                    {project.description || 'Focusing on strategic growth and EUSAI mission excellence.'}
                </p>
            </div>

            <div className="space-y-4 pt-4 border-t border-[#EBECF0]">
                <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-[#6B778C] font-medium">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Target: {new Date(project.endDate).toLocaleDateString()}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider ${project.status === 'EXECUTION' ? 'bg-emerald-50 text-emerald-700' :
                        project.status === 'PLANNING' ? 'bg-blue-50 text-blue-700' :
                            'bg-[#F4F5F7] text-[#42526E]'
                        }`}>
                        {project.status}
                    </span>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-[11px] font-bold text-[#6B778C] uppercase tracking-wider">
                        <span>Completion</span>
                        <span>{project.stats?.progress || 0}%</span>
                    </div>
                    <div className="h-1.5 bg-[#F4F5F7] rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[#0052CC] transition-all duration-1000"
                            style={{ width: `${project.stats?.progress || 0}%` }}
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-4">
                        {project.stats?.tasks?.overdue > 0 && (
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase text-red-500 font-bold mb-0.5">Attention</span>
                                <div className="flex items-center gap-1 font-bold text-red-600 text-sm">
                                    <AlertCircle className="w-3 h-3" />
                                    <span>{project.stats.tasks.overdue} Overdue</span>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="w-8 h-8 rounded-full bg-[#F4F5F7] flex items-center justify-center group-hover:bg-[#0052CC] group-hover:text-white transition-all">
                        <ChevronRight className="w-4 h-4" />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ProjectsPage() {
    const [projects, setProjects] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [editingProject, setEditingProject] = useState<any | null>(null);
    const router = useRouter();
    const { showToast } = useToast();
    const { data: session } = useSession();
    const userRole = (session?.user as any)?.role || 'EMPLOYEE';

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/projects');
            if (response.ok) {
                const data = await response.json();
                setProjects(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            showToast('Failed to load projects', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to decommission this project?')) return;

        try {
            const response = await fetch(`/api/projects?id=${id}`, { method: 'DELETE' });
            if (response.ok) {
                showToast('Project decommissioned successfully', 'success');
                fetchProjects();
            } else {
                showToast('Failed to decommission project', 'error');
            }
        } catch (error) {
            showToast('Network error during decommissioning', 'error');
        }
    };

    const filteredProjects = projects.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Calculate Portfolio Metrics
    const activeProjects = projects.filter(p => p.status !== 'CLOSED').length;
    const totalBudget = projects.reduce((sum, p) => sum + (p.stats?.financial?.budget || 0), 0);
    const totalSpent = projects.reduce((sum, p) => sum + (p.stats?.financial?.spent || 0), 0);
    const totalOverdue = projects.reduce((sum, p) => sum + (p.stats?.tasks?.overdue || 0), 0);

    return (
        <div className="space-y-8 p-8 bg-[#F4F5F7] min-h-screen">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-[#172B4D] mb-2 font-display">Project Portfolio</h1>
                    <p className="text-[#6B778C] text-lg">Inventory of all active and historical initiatives across the EUSAI ecosystem.</p>
                </div>
                {['DIRECTOR', 'MANAGER', 'TEAM_LEADER'].includes(userRole) && (
                    <Button
                        onClick={() => router.push('/projects/new')}
                        leftIcon={<Plus className="w-5 h-5" />}
                        size="lg"
                        className="bg-[#0052CC] hover:bg-[#0747A6] shadow-sm"
                    >
                        Initiate Project
                    </Button>
                )}
            </div>

            {/* Manager Dashboard Section */}
            {['DIRECTOR', 'MANAGER', 'TEAM_LEADER'].includes(userRole) && projects.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white p-5 rounded-sm border border-[#DFE1E6] shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-50 rounded-sm">
                                <Briefcase className="w-4 h-4 text-[#0052CC]" />
                            </div>
                            <span className="text-xs font-bold text-[#6B778C] uppercase tracking-wider">Active Missions</span>
                        </div>
                        <div className="text-2xl font-bold text-[#172B4D]">{activeProjects}</div>
                        <div className="text-xs text-[#6B778C] mt-1">Across all departments</div>
                    </div>
                    <div className="bg-white p-5 rounded-sm border border-[#DFE1E6] shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-emerald-50 rounded-sm">
                                <DollarSign className="w-4 h-4 text-emerald-600" />
                            </div>
                            <span className="text-xs font-bold text-[#6B778C] uppercase tracking-wider">Budget Health</span>
                        </div>
                        <div className="text-2xl font-bold text-[#172B4D]">
                            ₹{Math.round(totalSpent / 100000)}L / ₹{Math.round(totalBudget / 100000)}L
                        </div>
                        <div className="h-1.5 w-full bg-gray-100 rounded-full mt-2 overflow-hidden">
                            <div
                                className={`h-full ${totalSpent / totalBudget > 0.9 ? 'bg-red-500' : 'bg-emerald-500'}`}
                                style={{ width: `${Math.min(100, (totalSpent / totalBudget) * 100)}%` }}
                            />
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-sm border border-[#DFE1E6] shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-orange-50 rounded-sm">
                                <AlertCircle className="w-4 h-4 text-orange-600" />
                            </div>
                            <span className="text-xs font-bold text-[#6B778C] uppercase tracking-wider">Overdue Items</span>
                        </div>
                        <div className="text-2xl font-bold text-orange-600">{totalOverdue}</div>
                        <div className="text-xs text-[#6B778C] mt-1">Requires immediate attention</div>
                    </div>
                    <div className="bg-white p-5 rounded-sm border border-[#DFE1E6] shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-purple-50 rounded-sm">
                                <TrendingUp className="w-4 h-4 text-purple-600" />
                            </div>
                            <span className="text-xs font-bold text-[#6B778C] uppercase tracking-wider">Avg. Velocity</span>
                        </div>
                        <div className="text-2xl font-bold text-[#172B4D]">78%</div>
                        <div className="text-xs text-[#6B778C] mt-1">Completion rate this quarter</div>
                    </div>
                </div>
            )}

            {/* Director Portfolio Overview */}
            {userRole === 'DIRECTOR' && projects.length > 0 && (
                <section className="animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="flex items-center gap-2 mb-4 px-1">
                        <PieChart className="w-4 h-4 text-[#0052CC]" />
                        <h2 className="text-xs font-bold text-[#6B778C] uppercase tracking-[0.2em]">Portfolio Breakdown</h2>
                    </div>
                    <SpaceBreakdown projects={projects} />
                </section>
            )}

            <div className="flex flex-col md:flex-row gap-4 items-center">
                <Input
                    type="text"
                    placeholder="Search initiatives, managers, or descriptions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    leftIcon={<Search className="w-5 h-5 text-[#6B778C]" />}
                    containerClassName="flex-1"
                    className="h-12 border-[#DFE1E6]"
                />
                <div className="flex gap-2">
                    <Button
                        variant="secondary"
                        leftIcon={<Filter className="w-4 h-4" />}
                        className="bg-white border-[#DFE1E6] text-[#42526E]"
                    >
                        Filters
                    </Button>
                    <div className="flex bg-white border border-[#DFE1E6] rounded-sm p-1">
                        <button className="p-2 bg-[#F4F5F7] rounded-sm shadow-inner"><PieChart className="w-4 h-4 text-[#0052CC]" /></button>
                        <button className="p-2 hover:bg-gray-50 rounded-sm transition-colors"><MoreVertical className="w-4 h-4 text-[#6B778C]" /></button>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-12 h-12 text-[#0052CC] animate-spin mb-4" />
                    <p className="text-[#6B778C] font-medium tracking-wide">Synchronizing Portfolio Data...</p>
                </div>
            ) : filteredProjects.length === 0 ? (
                <div className="bg-white border border-[#DFE1E6] p-20 rounded-sm text-center space-y-4 shadow-sm">
                    <div className="w-16 h-16 bg-[#F4F5F7] rounded-full flex items-center justify-center mx-auto text-[#6B778C]">
                        <Briefcase className="w-8 h-8" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-[#172B4D]">No Initiatives Found</h3>
                        <p className="text-[#6B778C] max-w-sm mx-auto mt-2 text-sm">
                            {['DIRECTOR', 'MANAGER', 'TEAM_LEADER'].includes(userRole)
                                ? "The project log is currently empty. Start by initiating a new mission-critical project."
                                : "You are not currently assigned to any active projects."}
                        </p>
                    </div>
                    {['DIRECTOR', 'MANAGER', 'TEAM_LEADER'].includes(userRole) && (
                        <Button
                            onClick={() => router.push('/projects/new')}
                            className="bg-[#0052CC] hover:bg-[#0747A6]"
                        >
                            Create Project
                        </Button>
                    )}
                </div>
            ) : userRole === 'DIRECTOR' && searchQuery === '' ? (
                <div className="space-y-12">
                    {Array.from(new Set(filteredProjects.map(p => p.space?.name || 'Unassigned'))).map(spaceName => {
                        const spaceProjects = filteredProjects.filter(p => (p.space?.name || 'Unassigned') === spaceName);
                        const spaceColor = spaceProjects[0]?.space?.color || '#6B778C';

                        return (
                            <div key={spaceName} className="space-y-4">
                                <div className="flex items-center gap-3 px-1 border-b border-[#DFE1E6] pb-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: spaceColor }} />
                                    <h2 className="text-sm font-bold text-[#172B4D] uppercase tracking-wider">{spaceName}</h2>
                                    <span className="text-[10px] font-bold text-[#6B778C] bg-white border border-[#DFE1E6] px-2 py-0.5 rounded-full">
                                        {spaceProjects.length} Projects
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                                    {spaceProjects.map((project) => (
                                        <ProjectCard
                                            key={project.id}
                                            project={project}
                                            userRole={userRole}
                                            onDelete={handleDelete}
                                            onClick={() => router.push(`/projects/${project.id}`)}
                                        />
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {filteredProjects.map((project) => (
                        <ProjectCard
                            key={project.id}
                            project={project}
                            userRole={userRole}
                            onDelete={handleDelete}
                            onClick={() => router.push(`/projects/${project.id}`)}
                        />
                    ))}
                </div>
            )}

            {editingProject && (
                <ProjectEditModal
                    project={editingProject}
                    onClose={() => setEditingProject(null)}
                    onSuccess={() => {
                        setEditingProject(null);
                        fetchProjects();
                    }}
                />
            )}
        </div>
    );
}
