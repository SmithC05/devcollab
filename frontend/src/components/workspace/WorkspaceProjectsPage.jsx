import { useState, useEffect } from 'react';
import { Plus, LayoutGrid, List as ListIcon, Search, Clock, Users, FolderOpen, MoreHorizontal, CheckSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import PageContainer from '../layout/PageContainer';
import { apiClient } from '../../api/client';
import { Button, Spinner, EmptyState, Badge, SearchInput, IconButton, Card, Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '../ui/index';
import { useNavigate } from 'react-router-dom';
import CreateProjectModal from '../project/CreateProjectModal';
import LaunchScreen from '../project/LaunchScreen';
// --- Utilities ---
const getStatusVariant = (status) => {
  if (status === 'Active') return 'success';
  if (status === 'Archived') return 'secondary';
  return 'default';
};

const formatRelativeTime = (dateString) => {
  if (!dateString) return 'Updated recently';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'Updated just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays}d ago`;
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `${diffInMonths}mo ago`;
  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears}y ago`;
};

// --- Sub-components ---
const ThinProgress = ({ value }) => (
  <div className="h-[2px] w-full bg-[#2a2a2a] rounded-full overflow-hidden">
    <motion.div
      initial={{ width: 0 }}
      animate={{ width: `${value}%` }}
      transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
      className="h-full bg-white rounded-full"
    />
  </div>
);

function ViewModeButton({ active, label, onClick, icon: Icon }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
        active ? 'bg-white text-black' : 'text-[#777] hover:bg-[#1a1a1a] hover:text-white'
      }`}
    >
      <Icon size={16} />
    </button>
  );
}

function ProjectCard({ project, variants }) {
  return (
    <Card
      as={motion.div}
      variants={variants}
      className="flex min-h-[250px] min-w-0 flex-col rounded-lg border-[#2b2b2b] bg-[#111] p-6 shadow-none transition-all duration-300 hover:border-[#444]"
    >
      <div className="flex items-start justify-between gap-5">
        <div className="min-w-0">
          <h3 className="truncate text-[20px] font-semibold leading-7 text-white">
            {project.name}
          </h3>
          <p className="mt-1.5 line-clamp-2 text-[14px] leading-6 text-[#999]">
            {project.description || 'No description provided.'}
          </p>
        </div>
        <div className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-full ${project.status === 'Active' ? 'bg-green-500' : 'bg-[#666]'}`} />
      </div>

      <div className="mt-4 flex flex-1 items-center justify-center rounded-md border border-dashed border-[#2b2b2b] bg-[#111] hover:bg-[#151515] hover:border-[#444] transition-colors cursor-pointer p-4 text-[13px] text-[#666]">
        + Add project notes...
      </div>

      <div className="mt-6 pt-4">
        <div className="mb-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-5">
          <div className="min-w-0 flex-1">
            <ThinProgress value={project.progress || 0} />
          </div>
          <div className="shrink-0 rounded-md bg-[#222] px-2.5 py-1 text-[11px] font-bold leading-none tracking-wider text-[#999]">
            {project.tasks_count || 0} TASKS
          </div>
        </div>

        <div className="mb-4 border-t border-[#232323] pt-3">
          <button
            type="button"
            className="flex w-fit items-center gap-2 text-[14px] font-medium leading-5 text-[#777] transition-colors hover:text-white"
          >
            <Plus size={15} /> Add Task
          </button>
        </div>

        <div className="flex items-center justify-between gap-5 border-t border-[#232323] pt-4">
          <div className="flex -space-x-1.5">
            {[1, 2, 3].map((_, i) => (
              <div key={i} className="flex h-6 w-6 items-center justify-center rounded-full border border-[#111] bg-[#222]">
                <Users size={10} className="text-[#777]" />
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 whitespace-nowrap text-[12px] leading-5 text-[#777]">
            <Clock size={13} className="shrink-0" />
            Last edited {formatRelativeTime(project.updated_at)}
          </div>
        </div>
      </div>
    </Card>
  );
}

function ProjectListHeader() {
  return (
    <div className="hidden grid-cols-[minmax(280px,1.4fr)_minmax(240px,0.9fr)_120px_140px] gap-8 border-b border-[#242424] px-8 py-4 text-[11px] font-bold uppercase tracking-wider text-[#666] lg:grid">
      <span>Project</span>
      <span>Progress</span>
      <span>Tasks</span>
      <span>Updated</span>
    </div>
  );
}

function ProjectListRow({ project, variants }) {
  return (
    <Card
      as={motion.div}
      variants={variants}
      className="grid min-h-[116px] grid-cols-1 items-center gap-7 rounded-none border-0 border-b border-[#242424] bg-transparent px-6 py-6 shadow-none transition-colors duration-200 first:rounded-t-lg last:rounded-b-lg last:border-b-0 hover:bg-[#151515] md:px-8 lg:grid-cols-[minmax(280px,1.4fr)_minmax(240px,0.9fr)_120px_140px]"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-4">
          <div className={`h-2.5 w-2.5 shrink-0 rounded-full ${project.status === 'Active' ? 'bg-green-500' : 'bg-[#666]'}`} />
          <h3 className="truncate text-[20px] font-semibold leading-tight text-white">
            {project.name}
          </h3>
        </div>
        <p className="mt-3 line-clamp-2 pl-6 text-[15px] leading-6 text-[#999]">
          {project.description || 'No description provided.'}
        </p>
      </div>

      <div className="flex min-w-0 flex-col justify-center gap-3">
        <div className="flex items-center justify-between gap-5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#666]">Progress</span>
          <span className="text-[12px] font-bold tracking-wider text-[#999]">{project.progress || 0}%</span>
        </div>
        <ThinProgress value={project.progress || 0} />
      </div>

      <div className="w-fit rounded-md bg-[#222] px-3 py-1.5 text-[11px] font-bold tracking-wider text-[#999]">
        {project.tasks_count || 0} TASKS
      </div>

      <div className="flex items-center gap-2 whitespace-nowrap text-[13px] text-[#777]">
        <Clock size={14} />
        {formatRelativeTime(project.updated_at)}
      </div>
    </Card>
  );
}

// --- Main Page Component ---
export default function WorkspaceProjectsPage() {
  const workspaceName = "DevCollab";
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
    const newProject = await apiClient('/workspace/projects/', {
      method: 'POST',
      body: JSON.stringify({ name })
    });
    
    setProjects(prev => [newProject, ...prev]);
    setIsCreateModalOpen(false);
  };

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await apiClient('/workspace/projects/');
        setProjects(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const isPriorityFilter = filter === 'P0' || filter === 'P1' || filter === 'P2';
    // For now, if a priority filter is clicked, show all active (mocking functionality)
    const matchesFilter = filter === 'All' || p.status === filter || (isPriorityFilter && p.status === 'Active');
    return matchesSearch && matchesFilter;
  });

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
    <PageContainer className="w-full max-w-[1360px] overflow-x-hidden px-6 pt-10 sm:px-8 md:px-10 md:pt-12 lg:px-12">
      {/* 1. Header Area */}
      <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <span className="mb-4 block text-[10px] font-bold uppercase tracking-widest text-[#666666] md:text-[11px]">
            {workspaceName} WORKSPACE - FREE PLAN
          </span>
          <h1 className="flex flex-wrap gap-x-3 text-[42px] font-semibold leading-tight tracking-tight md:text-[54px]">
            <span className="text-white">{workspaceName}</span>
            <span className="text-[#666666]">Projects</span>
          </h1>
          <p className="mt-4 max-w-[780px] text-[16px] leading-7 text-[#777]">
            Track project milestones, tasks status, and stream alignments inside a unified workspace.
          </p>
        </div>
        <div className="shrink-0 pt-1">
          <Button variant="primary" icon={Plus} iconSize={15} onClick={() => setIsCreateModalOpen(true)}>New Project</Button>
        </div>
      </div>

      {/* 2. Search and Filters */}
      {projects.length > 0 && (
        <div className="mb-14 space-y-6">
          <div className="relative w-full">
          <Search
            className="pointer-events-none absolute left-6 top-1/2 -translate-y-1/2 text-[#666]"
            size={17}
          />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-[60px] w-full rounded-lg border border-[#262626] bg-[#111] pl-16 pr-24 text-[17px] text-white placeholder-[#777] transition-colors focus:border-[#444] focus:outline-none"
          />
          <div className="absolute right-4 top-1/2 flex -translate-y-1/2 gap-1.5">
            <div className="flex h-5 w-8 items-center justify-center rounded border border-[#333] bg-[#222] text-[10px] font-medium text-[#888]">Ctrl</div>
            <div className="flex h-5 w-5 items-center justify-center rounded border border-[#333] bg-[#222] text-[10px] font-medium text-[#888]">K</div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-4 pb-4">
          {['All', 'Active', 'Archived', 'P0', 'P1', 'P2'].map(f => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`h-12 min-w-[82px] whitespace-nowrap rounded-lg border px-6 text-[14px] font-semibold transition-colors ${
                filter === f
                  ? 'bg-white text-black border-white'
                  : 'bg-transparent text-[#888] border-[#333] hover:border-[#555] hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
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
          className="grid grid-cols-1 gap-8 lg:grid-cols-2 xl:grid-cols-3"
          style={{ marginTop: 12 }}
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
                <ThinProgress value={project.progress} />
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
                      <div className="w-20"><ThinProgress value={project.progress} /></div>
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
