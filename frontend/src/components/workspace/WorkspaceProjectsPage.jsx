import { useState, useEffect } from 'react';
<<<<<<< HEAD
import { Plus, FolderOpen, MoreHorizontal, Users, CheckSquare, LayoutGrid, List as ListIcon, Search, ArrowRight, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
=======
import { apiClient } from '../../api/client';
import { Plus, FolderOpen, MoreHorizontal, Users, CheckSquare, LayoutGrid, List as ListIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
>>>>>>> 10b098ef335a82765d2f08f3c4029b6683a67f69
import PageContainer from '../layout/PageContainer';
import { Spinner, EmptyState, Badge, IconButton, Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '../ui/index';
import { useNavigate } from 'react-router-dom';
import CreateProjectModal from '../project/CreateProjectModal';
import LaunchScreen from '../project/LaunchScreen';
<<<<<<< HEAD
import { apiClient } from '../../api/client';
=======
import { useAuthStore } from '../../stores/authStore';
import { workspaceApi } from '../../api/workspaceApi';
>>>>>>> 10b098ef335a82765d2f08f3c4029b6683a67f69

// --- Utilities ---
const formatRelativeTime = (dateString) => {
  if (!dateString) return 'Updated recently';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return 'Updated just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `Updated ${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `Updated ${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `Updated ${diffInDays}d ago`;
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `Updated ${diffInMonths}mo ago`;
  const diffInYears = Math.floor(diffInDays / 365);
  return `Updated ${diffInYears}y ago`;
};

// --- Sub-components ---
const MetricBlock = ({ label, value }) => {
  const formattedValue = typeof value === 'number' && value < 10 && value >= 0 ? `0${value}` : value;
  return (
    <div className="flex flex-col gap-1.5 border-l border-[var(--border-subtle)] pl-5 md:pl-8 first:border-l-0 first:pl-0 min-w-[120px]">
      <span className="text-[32px] md:text-[40px] font-medium text-[var(--fg)] leading-none tracking-tight">{formattedValue}</span>
      <span className="text-[10px] md:text-[11px] text-[var(--text-muted)] font-bold uppercase tracking-[0.15em]">{label}</span>
    </div>
  );
};

// --- Main Page Component ---
export default function WorkspaceProjectsPage() {
  const { activeWorkspace } = useAuthStore();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [viewMode, setViewMode] = useState('grid');
  
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [launchingProject, setLaunchingProject] = useState(null);

  const handleCreateProject = async (name) => {
    try {
<<<<<<< HEAD
      const newProject = await apiClient('/workspace/projects/', {
        method: 'POST',
        body: JSON.stringify({ name })
      });
=======
      // BUG-18 FIX: Use workspaceApi.createProject with workspace_id
      const newProject = await workspaceApi.createProject(activeWorkspace?.id, name);
>>>>>>> 10b098ef335a82765d2f08f3c4029b6683a67f69
      setProjects(prev => [newProject, ...prev]);
      setIsCreateModalOpen(false);
    } catch (err) {
      throw new Error(err.message || 'Failed to create project.');
    }
  };

  useEffect(() => {
    const fetchProjects = async () => {
      try {
<<<<<<< HEAD
        const data = await apiClient('/workspace/projects/');
=======
        // BUG-18 FIX: Use workspaceApi.getProjects with workspace_id
        const data = await workspaceApi.getProjects(activeWorkspace?.id);
>>>>>>> 10b098ef335a82765d2f08f3c4029b6683a67f69
        setProjects(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, [activeWorkspace?.id]);

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'All' || p.status === filter;
    return matchesSearch && matchesFilter;
  });

  // Calculate Metrics
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status === 'Active').length;
  const totalTasks = projects.reduce((acc, p) => acc + (p.tasks_count || 0), 0);
  const avgProgress = totalProjects > 0 
    ? Math.round(projects.reduce((acc, p) => acc + (p.progress || 0), 0) / totalProjects) 
    : 0;

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center py-32"><Spinner size={24} /></div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center py-32">
          <p className="text-red-400 text-[14px] mb-4">{error}</p>
          <button 
            className="h-[36px] px-4 rounded-[6px] border border-[var(--border-strong)] text-[var(--text-primary)] text-[13px] font-medium hover:bg-[var(--surface-hover)] transition-colors"
            onClick={() => window.location.reload()}
          >
            Try Again →
          </button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="max-w-[1400px] mx-auto w-full px-4 md:px-8 py-6 md:py-10">
        
        {/* 1. Page Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-12">
          <div>
            <span className="text-[11px] font-bold tracking-[0.15em] text-[var(--text-muted)] uppercase mb-3 block">
              Workspace / Projects
            </span>
            <h1 className="text-[32px] md:text-[42px] font-semibold text-[var(--fg)] tracking-tight leading-none mb-3">
              Projects
            </h1>
            <p className="text-[14px] md:text-[15px] text-[var(--text-secondary)]">
              Manage and organize your team's projects.
            </p>
          </div>
          <div className="shrink-0 pt-1">
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 h-[40px] px-[20px] rounded-[8px] bg-[var(--text-primary)] text-[var(--bg)] font-semibold text-[13px] hover:bg-white transition-colors duration-150 border border-transparent shadow-sm"
            >
              <Plus size={16} strokeWidth={2.5} />
              New Project →
            </button>
          </div>
        </div>

        {/* 2. Project Summary Metrics */}
        {projects.length > 0 && (
          <div className="flex flex-row gap-5 mb-12 pb-12 border-b border-[var(--border-subtle)] overflow-x-auto w-full">
            <MetricBlock label="Projects" value={totalProjects} />
            <MetricBlock label="Active" value={activeProjects} />
            <MetricBlock label="Tasks" value={totalTasks} />
            <MetricBlock label="Progress" value={`${avgProgress}%`} />
          </div>
        )}

        {/* 3. Toolbar */}
        {projects.length > 0 && (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            {/* Left: Search */}
            <div className="w-full md:w-[280px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={14} />
              <input 
                type="text" 
                placeholder="Search projects..." 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                className="w-full h-[36px] bg-[var(--surface-raised)] border border-[var(--border-subtle)] rounded-[6px] pl-[34px] pr-4 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-focus)] transition-colors duration-150 shadow-sm"
              />
            </div>

            {/* Right: Tabs & View Toggle */}
            <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto">
              <div className="flex items-center gap-1 bg-transparent overflow-x-auto">
                {['All', 'Active', 'Archived'].map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 text-[12px] font-medium rounded-[6px] transition-colors duration-150 whitespace-nowrap ${
                      filter === f ? 'bg-[var(--surface-item)] border border-[var(--border-strong)] text-[var(--fg)]' : 'bg-transparent border border-transparent text-[var(--text-secondary)] hover:text-[var(--fg)] hover:bg-[var(--surface-hover)]'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <div className="w-px h-4 bg-[var(--border-subtle)] hidden sm:block mx-1" />

              <div className="flex items-center gap-1 hidden sm:flex">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-[6px] transition-colors duration-150 border ${viewMode === 'grid' ? 'bg-[var(--surface-item)] border-[var(--border-strong)] text-[var(--fg)]' : 'bg-transparent border-transparent text-[var(--text-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-hover)]'}`}
                >
                  <LayoutGrid size={15} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-[6px] transition-colors duration-150 border ${viewMode === 'list' ? 'bg-[var(--surface-item)] border-[var(--border-strong)] text-[var(--fg)]' : 'bg-transparent border-transparent text-[var(--text-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-hover)]'}`}
                >
                  <ListIcon size={15} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 4. Content Area */}
        {projects.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="No projects yet"
            description="Create your first project to start organizing your team's work."
            action={<button className="h-[36px] px-4 rounded-[6px] bg-[var(--text-primary)] text-[var(--bg)] font-medium text-[13px]" onClick={() => setIsCreateModalOpen(true)}>Create Project</button>}
          />
        ) : filteredProjects.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center text-center">
            <p className="text-[14px] font-medium text-[var(--fg)] mb-1">No matches found</p>
            <p className="text-[13px] text-[var(--text-secondary)]">Try adjusting your search or filters.</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-16">
            
            {/* Create Project Dashed Card */}
            {filter === 'All' && !search && (
              <div 
                onClick={() => setIsCreateModalOpen(true)}
                className="flex flex-col items-center justify-center min-h-[260px] rounded-[10px] border border-dashed border-[var(--border-strong)] bg-transparent hover:bg-[var(--surface-hover)] hover:border-[var(--text-secondary)] transition-colors duration-200 cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-full bg-[var(--surface-item)] border border-[var(--border-strong)] flex items-center justify-center text-[var(--text-muted)] group-hover:text-[var(--fg)] group-hover:bg-[var(--surface-raised)] transition-all duration-200 mb-4">
                  <Plus size={18} strokeWidth={2.5} />
                </div>
                <span className="text-[14px] font-medium text-[var(--fg)] mb-1">Create New Project</span>
                <span className="text-[13px] text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors duration-200">Start building something amazing</span>
              </div>
            )}

            {filteredProjects.map(project => (
              <div
                key={project.id}
                onClick={() => setLaunchingProject(project)}
                className="flex flex-col min-h-[260px] rounded-[10px] border border-[var(--border-subtle)] bg-[var(--surface-raised)] hover:border-[var(--border-focus)] transition-all duration-200 p-6 cursor-pointer group"
                style={{ transform: 'translateY(0)' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-[8px] bg-[var(--surface-item)] border border-[var(--border-strong)] flex items-center justify-center text-[var(--text-secondary)] font-semibold text-[13px] shrink-0 group-hover:bg-[var(--bg)] transition-colors">
                      {project.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <h3 className="text-[15px] font-medium text-[var(--fg)] leading-tight mb-1">{project.name}</h3>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${project.status === 'Active' ? 'bg-[var(--status-success)]' : 'bg-[var(--text-muted)]'}`} />
                        <span className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider">{project.status}</span>
                      </div>
                    </div>
                  </div>
                  <button className="text-[var(--text-muted)] hover:text-[var(--fg)] transition-colors">
                    <MoreHorizontal size={16} />
                  </button>
                </div>

                {/* Description */}
                <p className="text-[13px] text-[var(--text-secondary)] leading-[1.6] line-clamp-2 mb-6">
                  {project.description || 'No description provided for this project. Add one to help your team understand the goal.'}
                </p>

                <div className="flex-1" />

                {/* Meta details */}
                <div className="flex items-center gap-3 text-[12px] text-[var(--text-muted)] font-medium mb-5">
                  <span>{project.members_count} member{project.members_count !== 1 ? 's' : ''}</span>
                  <span>·</span>
                  <span>{project.tasks_count} task{project.tasks_count !== 1 ? 's' : ''}</span>
                  <span>·</span>
                  <span>{formatRelativeTime(project.updated_at)}</span>
                </div>

                {/* Progress */}
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-medium text-[var(--text-secondary)] uppercase tracking-wider w-[64px]">Progress</span>
                  <div className="flex-1 h-[4px] bg-[var(--surface-item)] rounded-full overflow-hidden">
                    <div className="h-full bg-[var(--text-primary)] rounded-full" style={{ width: `${project.progress}%` }} />
                  </div>
                  <span className="text-[12px] font-medium text-[var(--fg)] w-8 text-right">{project.progress}%</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[var(--surface-raised)] border border-[var(--border-subtle)] rounded-[10px] overflow-hidden mb-16">
            <Table>
              <TableHeader>
                <TableHead>Project</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Tasks</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead></TableHead>
              </TableHeader>
              <TableBody>
                {filteredProjects.map(project => (
                  <TableRow key={project.id} className="group cursor-pointer border-b border-[var(--border-subtle)] hover:bg-[var(--surface-hover)]" onClick={() => setLaunchingProject(project)}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-[6px] bg-[var(--surface-item)] border border-[var(--border-strong)] flex items-center justify-center text-[var(--text-secondary)] font-semibold text-[12px] shrink-0">
                          {project.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                        <span className="text-[13px] font-medium text-[var(--fg)]">{project.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${project.status === 'Active' ? 'bg-[var(--status-success)]' : 'bg-[var(--text-muted)]'}`} />
                        <span className="text-[12px] font-medium text-[var(--text-secondary)]">{project.status}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] text-[var(--text-secondary)] w-8">{project.progress}%</span>
                        <div className="w-20 h-[4px] bg-[var(--surface-item)] rounded-full overflow-hidden">
                          <div className="h-full bg-[var(--text-primary)] rounded-full" style={{ width: `${project.progress}%` }} />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-[13px] text-[var(--text-secondary)]">{project.tasks_count}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-[13px] text-[var(--text-secondary)]">{project.members_count}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-[12px] text-[var(--text-muted)]">{formatRelativeTime(project.updated_at)}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <IconButton icon={MoreHorizontal} className="opacity-0 group-hover:opacity-100 text-[var(--text-muted)] hover:text-[var(--text-primary)]" size={15} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* 5. Analytics Section */}
        {projects.length > 0 && (
          <div className="mb-16">
            <h2 className="text-[18px] md:text-[20px] font-medium text-[var(--fg)] mb-6">Workspace Analytics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Workspace Activity */}
              <div className="flex flex-col p-6 rounded-[10px] border border-[var(--border-subtle)] bg-[var(--surface-raised)] min-h-[220px]">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-[13px] font-medium text-[var(--text-primary)]">Workspace Activity</span>
                  <button className="text-[12px] text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center transition-colors">
                    View all <ArrowRight size={12} className="ml-1" />
                  </button>
                </div>
                <div className="flex-1 flex flex-col justify-end border-b border-l border-[var(--border-strong)] relative mt-2 pt-4 px-2 pb-1">
                   <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                     <path d="M 0 35 L 20 25 L 40 28 L 60 15 L 80 20 L 100 5" fill="none" stroke="var(--text-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                     <circle cx="100" cy="5" r="2.5" fill="var(--bg)" stroke="var(--text-primary)" strokeWidth="2" />
                   </svg>
                   <div className="flex justify-between mt-3 text-[10px] text-[var(--text-muted)] font-medium uppercase tracking-wider">
                     <span>Mon</span><span>Wed</span><span>Fri</span><span>Sun</span>
                   </div>
                </div>
              </div>

              {/* Project Health */}
              <div className="flex flex-col p-6 rounded-[10px] border border-[var(--border-subtle)] bg-[var(--surface-raised)] min-h-[220px]">
                 <span className="text-[13px] font-medium text-[var(--text-primary)] mb-4">Project Health</span>
                 <div className="flex items-end gap-2 mb-6">
                   <span className="text-[36px] font-medium text-[var(--fg)] leading-none tracking-tight">92%</span>
                   <span className="text-[12px] text-[var(--status-success)] font-medium mb-[4px] flex items-center gap-1">
                     <CheckCircle2 size={12} /> Healthy
                   </span>
                 </div>
                 <div className="flex flex-col gap-3.5">
                   <div className="flex items-center gap-3 text-[12px]">
                     <span className="w-16 text-[var(--text-secondary)]">On Track</span>
                     <div className="flex-1 h-[4px] bg-[var(--surface-item)] rounded-full overflow-hidden">
                       <div className="h-full bg-[var(--status-success)] rounded-full w-[92%]" />
                     </div>
                     <span className="w-8 text-right text-[var(--fg)] font-medium">92%</span>
                   </div>
                   <div className="flex items-center gap-3 text-[12px]">
                     <span className="w-16 text-[var(--text-secondary)]">At Risk</span>
                     <div className="flex-1 h-[4px] bg-[var(--surface-item)] rounded-full overflow-hidden">
                       <div className="h-full bg-[var(--text-muted)] rounded-full w-[6%]" />
                     </div>
                     <span className="w-8 text-right text-[var(--fg)] font-medium">6%</span>
                   </div>
                   <div className="flex items-center gap-3 text-[12px]">
                     <span className="w-16 text-[var(--text-secondary)]">Blocked</span>
                     <div className="flex-1 h-[4px] bg-[var(--surface-item)] rounded-full overflow-hidden">
                       <div className="h-full bg-[var(--text-muted)] rounded-full w-[2%]" />
                     </div>
                     <span className="w-8 text-right text-[var(--fg)] font-medium">2%</span>
                   </div>
                 </div>
              </div>

              {/* Team Load */}
              <div className="flex flex-col p-6 rounded-[10px] border border-[var(--border-subtle)] bg-[var(--surface-raised)] min-h-[220px]">
                 <span className="text-[13px] font-medium text-[var(--text-primary)] mb-6">Team Load</span>
                 <div className="flex flex-col gap-5 justify-center flex-1">
                   <div className="flex items-center gap-3 text-[12px]">
                     <span className="w-14 text-[var(--text-secondary)] font-medium">High</span>
                     <div className="flex-1 h-[22px] bg-[var(--surface-item)] border border-[var(--border-strong)] rounded flex relative overflow-hidden">
                       <div className="h-full bg-[var(--text-primary)] opacity-[0.9] w-[35%]" />
                     </div>
                   </div>
                   <div className="flex items-center gap-3 text-[12px]">
                     <span className="w-14 text-[var(--text-secondary)] font-medium">Medium</span>
                     <div className="flex-1 h-[22px] bg-[var(--surface-item)] border border-[var(--border-strong)] rounded flex relative overflow-hidden">
                       <div className="h-full bg-[var(--text-secondary)] opacity-[0.9] w-[45%]" />
                     </div>
                   </div>
                   <div className="flex items-center gap-3 text-[12px]">
                     <span className="w-14 text-[var(--text-secondary)] font-medium">Low</span>
                     <div className="flex-1 h-[22px] bg-[var(--surface-item)] border border-[var(--border-strong)] rounded flex relative overflow-hidden">
                       <div className="h-full bg-[var(--text-muted)] opacity-[0.9] w-[20%]" />
                     </div>
                   </div>
                 </div>
              </div>
            </div>
          </div>
        )}

        {/* 6. Recent Activity */}
        {projects.length > 0 && (
          <div className="mb-8">
            <div className="flex items-end justify-between border-b border-[var(--border-subtle)] pb-4 mb-4 mt-8">
              <div>
                <h2 className="text-[18px] md:text-[20px] font-medium text-[var(--fg)] mb-1">Recent Activity</h2>
                <p className="text-[13px] text-[var(--text-secondary)]">Latest updates from your workspace</p>
              </div>
              <button className="text-[12px] font-medium text-[var(--text-primary)] hover:text-[var(--text-muted)] transition-colors flex items-center mb-1">
                View all <ArrowRight size={14} className="ml-1" />
              </button>
            </div>
            
            <div className="flex flex-col">
              {[
                { id: 1, icon: FolderOpen, title: 'Project created', desc: 'You created the project Backend Overhaul', time: '2h ago' },
                { id: 2, icon: CheckCircle2, title: 'Task completed', desc: 'Smith closed "Fix authentication bug"', time: '5h ago' },
                { id: 3, icon: Users, title: 'Member joined', desc: 'Alice joined the workspace', time: '1d ago' },
                { id: 4, icon: CheckCircle2, title: 'Task completed', desc: 'You closed "Update API documentation"', time: '2d ago' },
              ].map((activity, idx) => (
                <div key={activity.id} className={`flex items-center gap-4 py-4 ${idx !== 3 ? 'border-b border-[var(--border-subtle)]' : ''} hover:bg-[var(--surface-hover)] px-2 -mx-2 rounded-[8px] transition-colors cursor-default`}>
                   <div className="w-[32px] h-[32px] rounded-full bg-[var(--surface-item)] border border-[var(--border-strong)] flex items-center justify-center text-[var(--text-secondary)] shrink-0">
                     <activity.icon size={14} />
                   </div>
                   <div className="flex flex-col flex-1 min-w-0">
                     <span className="text-[13.5px] font-medium text-[var(--fg)] leading-tight mb-1">{activity.title}</span>
                     <span className="text-[12.5px] text-[var(--text-secondary)] leading-tight">{activity.desc}</span>
                   </div>
                   <span className="text-[12px] text-[var(--text-muted)] font-medium shrink-0">{activity.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Modals & Overlays */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateProject}
      />
      
      {launchingProject && (
        <LaunchScreen
          project={launchingProject}
          onComplete={() => {
            setLaunchingProject(null);
            navigate(`/projects/${launchingProject.id}/overview`);
          }}
        />
      )}
    </PageContainer>
  );
}
