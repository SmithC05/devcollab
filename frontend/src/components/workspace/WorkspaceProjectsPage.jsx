import { useState, useEffect } from 'react';
import { Plus, FolderOpen, MoreHorizontal, Users, CheckSquare, LayoutGrid, List as ListIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PageContainer from '../layout/PageContainer';
import { Button, Spinner, EmptyState, Badge, SearchInput, IconButton, Card, Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '../ui/index';
import { useNavigate } from 'react-router-dom';
import CreateProjectModal from '../project/CreateProjectModal';
import LaunchScreen from '../project/LaunchScreen';
import { useAuthStore } from '../../stores/authStore';
import { workspaceApi } from '../../api/workspaceApi';

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

const getStatusVariant = (status) => {
  if (!status) return 'default';
  const s = status.toLowerCase();
  if (s === 'active') return 'green';
  if (s === 'archived') return 'default';
  if (s === 'completed') return 'blue';
  return 'default';
};

// --- Sub-components ---
const AnimatedProgress = ({ value }) => (
  <div className="h-[6px] w-full bg-[var(--surface-item)] rounded-full overflow-hidden">
    <motion.div
      initial={{ width: 0 }}
      animate={{ width: `${value}%` }}
      transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
      className="h-full bg-blue-500 rounded-full"
    />
  </div>
);

const MetricBlock = ({ label, value }) => (
  <div className="flex flex-col gap-1">
    <span className="text-[28px] md:text-[32px] font-semibold text-[var(--fg)] leading-none">{value}</span>
    <span className="text-[11px] md:text-[12px] text-[var(--text-secondary)] font-medium uppercase tracking-wider">{label}</span>
  </div>
);

// --- Main Page Component ---
export default function WorkspaceProjectsPage() {
  const { activeWorkspace } = useAuthStore();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [launchingProject, setLaunchingProject] = useState(null);

  const handleCreateProject = async (name) => {
    try {
      // BUG-18 FIX: Use workspaceApi.createProject with workspace_id
      const newProject = await workspaceApi.createProject(activeWorkspace?.id, name);
      setProjects(prev => [newProject, ...prev]);
      setIsCreateModalOpen(false);
    } catch (err) {
      throw new Error(err.message || 'Failed to create project.');
    }
  };

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        // BUG-18 FIX: Use workspaceApi.getProjects with workspace_id
        const data = await workspaceApi.getProjects(activeWorkspace?.id);
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

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

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
          <Button variant="secondary" onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* 1. Page Header (Margin bottom ~32px via mb-8) */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
        <div>
          <span className="text-[10px] md:text-[11px] font-bold tracking-widest text-[var(--text-muted)] uppercase mb-2 block">
            Workspace / Projects
          </span>
          <h1 className="text-[36px] md:text-[40px] font-semibold text-[var(--fg)] tracking-tight leading-tight mb-2">
            Projects
          </h1>
          <p className="text-[14px] text-[var(--text-secondary)]">
            Manage and organize your team's projects.
          </p>
        </div>
        <div className="shrink-0 pt-1">
          <Button variant="primary" icon={Plus} iconSize={15} onClick={() => setIsCreateModalOpen(true)}>New Project</Button>
        </div>
      </div>

      {/* 2. Project Summary Metrics (Margin bottom ~28px via mb-7) */}
      {projects.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mb-7 pb-7 border-b border-[var(--border-subtle)]">
          <MetricBlock label="Projects" value={totalProjects} />
          <MetricBlock label="Active" value={activeProjects} />
          <MetricBlock label="Tasks" value={totalTasks} />
          <MetricBlock label="Progress" value={`${avgProgress}%`} />
        </div>
      )}

      {/* 3. Toolbar (Margin bottom ~24px via mb-6) */}
      {projects.length > 0 && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          {/* Left: Search */}
          <div className="w-full md:w-[320px] relative">
            <SearchInput 
              placeholder="Search projects..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="h-[38px]"
            />
          </div>

          {/* Right: Tabs & View Toggle */}
          <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto">
            {/* Elegant Tabs */}
            <div className="flex items-center gap-1 bg-[var(--surface-item)] p-1 rounded-lg border border-[var(--border-subtle)] overflow-x-auto">
              {['All', 'Active', 'Archived'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`relative px-4 py-1.5 text-[12px] font-medium rounded-md transition-colors whitespace-nowrap ${
                    filter === f ? 'text-[var(--fg)]' : 'text-[var(--text-secondary)] hover:text-[var(--fg)]'
                  }`}
                >
                  {filter === f && (
                    <motion.div
                      layoutId="active-filter"
                      className="absolute inset-0 bg-[var(--surface-card)] border border-[var(--border-strong)] rounded-md shadow-sm"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      style={{ zIndex: 0 }}
                    />
                  )}
                  <span className="relative z-10">{f}</span>
                </button>
              ))}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-[var(--surface-item)] p-1 rounded-lg border border-[var(--border-subtle)] hidden sm:flex">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-[var(--surface-card)] border border-[var(--border-strong)] text-[var(--fg)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--fg)]'}`}
              >
                <LayoutGrid size={15} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-[var(--surface-card)] border border-[var(--border-strong)] text-[var(--fg)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--fg)]'}`}
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
          action={<Button variant="primary" icon={Plus} iconSize={15} onClick={() => setIsCreateModalOpen(true)}>New Project</Button>}
        />
      ) : filteredProjects.length === 0 ? (
        <div className="py-24 flex flex-col items-center justify-center text-center">
          <FolderOpen size={28} className="text-[var(--text-muted)] mb-3" />
          <p className="text-[14px] font-medium text-[var(--fg)] mb-1">No matches found</p>
          <p className="text-[13px] text-[var(--text-secondary)]">Try adjusting your search or filters.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6"
        >
          {filteredProjects.map(project => (
            <Card
              as={motion.div}
              variants={itemVariants}
              key={project.id}
              onClick={() => setLaunchingProject(project)}
              className="p-6 flex flex-col min-h-[300px] hover:border-[var(--border-focus)] transition-all duration-200 group relative bg-[var(--surface-card)] shadow-sm hover:shadow-md cursor-pointer"
              style={{ '--tw-translate-y': '0px' }}
              whileHover={{ y: -2 }}
            >
              {/* Header: Icon, Name, Menu */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-strong)] flex items-center justify-center text-[var(--text-secondary)] font-semibold text-[15px] group-hover:text-blue-400 group-hover:bg-blue-500/5 group-hover:border-blue-500/20 transition-colors shrink-0">
                    {project.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()}
                  </div>
                  <h3 className="text-[15px] md:text-[16px] font-semibold text-[var(--fg)] leading-tight group-hover:text-blue-400 transition-colors">
                    {project.name}
                  </h3>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <IconButton icon={MoreHorizontal} size={16} />
                </div>
              </div>

              {/* Status */}
              <div className="mb-3">
                <Badge variant={getStatusVariant(project.status)}>
                  <span className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${project.status === 'Active' ? 'bg-green-500' : 'bg-[var(--text-muted)]'}`} />
                    {project.status}
                  </span>
                </Badge>
              </div>

              {/* Description */}
              <p className="text-[13px] text-[var(--text-secondary)] leading-[1.6] line-clamp-2">
                {project.description || 'No description provided for this project.'}
              </p>

              {/* Flexible Space */}
              <div className="flex-1" />

              {/* Metadata */}
              <div className="mt-4 mb-4 flex items-center gap-3 text-[12px] text-[var(--text-muted)] font-medium">
                <span className="flex items-center gap-1.5">
                  <Users size={13} className="text-[var(--text-muted)]" />
                  {project.members_count} member{project.members_count !== 1 ? 's' : ''}
                </span>
                <span>·</span>
                <span className="flex items-center gap-1.5">
                  <CheckSquare size={13} className="text-[var(--text-muted)]" />
                  {project.tasks_count} task{project.tasks_count !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Progress */}
              <div className="mb-3 space-y-2">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-[var(--text-secondary)] font-medium">Progress</span>
                  <span className="text-[var(--fg)] font-semibold">{project.progress}%</span>
                </div>
                <AnimatedProgress value={project.progress} />
              </div>

              {/* Updated Date */}
              <div className="text-[11px] text-[var(--text-muted)]">
                {formatRelativeTime(project.updated_at)}
              </div>
            </Card>
          ))}
        </motion.div>
      ) : (
        /* List View */
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="bg-[var(--surface-card)] border border-[var(--border-strong)] rounded-xl overflow-hidden"
        >
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
                <TableRow key={project.id} className="group cursor-pointer" onClick={() => setLaunchingProject(project)}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-strong)] flex items-center justify-center text-[var(--text-secondary)] font-semibold text-[12px] group-hover:text-blue-400 group-hover:bg-blue-500/5 group-hover:border-blue-500/20 transition-colors shrink-0">
                        {project.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()}
                      </div>
                      <span className="text-[14px] font-medium text-[var(--fg)]">{project.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(project.status)}>
                      <span className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${project.status === 'Active' ? 'bg-green-500' : 'bg-[var(--text-muted)]'}`} />
                        {project.status}
                      </span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] text-[var(--text-secondary)] w-8">{project.progress}%</span>
                      <div className="w-20"><AnimatedProgress value={project.progress} /></div>
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
                    <IconButton icon={MoreHorizontal} className="opacity-0 group-hover:opacity-100" size={15} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </motion.div>
      )}

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
