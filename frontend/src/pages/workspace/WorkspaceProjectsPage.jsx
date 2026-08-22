import { useState, useEffect } from 'react';
import { Search, Plus, Loader2, FolderOpen, MoreHorizontal, Users, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import PageContainer from '../../components/layout/PageContainer';

export default function WorkspaceProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/workspace/projects/');
        if (!response.ok) throw new Error('Failed to load projects');
        const data = await response.json();
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
    const matchesFilter = filter === 'All' || p.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <PageContainer>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-100 mb-1">Projects</h1>
          <p className="text-[13px] text-[#888888]">Manage and organize your team's projects.</p>
        </div>
        <button className="h-[36px] px-4 bg-white text-black font-medium text-[13px] rounded-md hover:bg-gray-100 transition-colors flex items-center gap-2">
          <Plus size={16} />
          New Project
        </button>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 mb-8">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]" size={14} />
          <input 
            type="text" 
            placeholder="Search projects..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-[36px] bg-[#161616] border border-[#2A2A2A] rounded-md pl-9 pr-4 text-[13px] text-gray-100 focus:outline-none focus:border-[#444] placeholder-[#555]"
          />
        </div>
        <div className="flex items-center bg-[#161616] border border-[#2A2A2A] rounded-md p-1 h-[36px]">
          {['All', 'Active', 'Archived'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded text-[12px] font-medium transition-colors ${
                filter === f ? 'bg-[#2A2A2A] text-gray-100' : 'text-[#777] hover:text-gray-300'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-[#666]">
          <Loader2 className="animate-spin" size={24} />
        </div>
      ) : error ? (
        <div className="text-center py-20">
          <p className="text-red-400 text-sm">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 text-[13px] text-[#888] hover:text-white underline">Try again</button>
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 border border-dashed border-[#2A2A2A] rounded-lg bg-[#161616]/50">
          <div className="w-12 h-12 bg-[#222] rounded-full flex items-center justify-center mb-4">
            <FolderOpen className="text-[#555]" size={24} />
          </div>
          <h3 className="text-gray-200 font-medium mb-2">No projects yet</h3>
          <p className="text-[#777] text-[13px] mb-6">Create your first project to start organizing your team's work.</p>
          <button className="h-[36px] px-4 bg-white text-black font-medium text-[13px] rounded-md hover:bg-gray-100 transition-colors flex items-center gap-2">
            <Plus size={16} />
            New Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredProjects.map(project => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={project.id}
              className="bg-[#161616] border border-[#2A2A2A] rounded-lg p-5 hover:border-[#444] transition-colors cursor-pointer group flex flex-col"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-[#222] border border-[#333] flex items-center justify-center text-gray-400 font-medium group-hover:text-white transition-colors">
                    {project.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-[15px] font-medium text-gray-100 group-hover:text-blue-400 transition-colors">{project.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`w-2 h-2 rounded-full ${project.status === 'Active' ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                      <span className="text-[11px] text-[#777]">{project.status}</span>
                    </div>
                  </div>
                </div>
                <button className="text-[#555] hover:text-white p-1">
                  <MoreHorizontal size={16} />
                </button>
              </div>
              <p className="text-[13px] text-[#888] mb-6 line-clamp-2 leading-relaxed flex-1">
                {project.description}
              </p>
              <div className="mt-auto pt-4 border-t border-[#222] flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-[#777]">
                    <Users size={14} />
                    <span className="text-[12px]">{project.members_count}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#777]">
                    <CheckCircle2 size={14} />
                    <span className="text-[12px]">{project.tasks_count} tasks</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[#777]">{project.progress}%</span>
                  <div className="w-16 h-1.5 bg-[#222] rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${project.progress}%` }}></div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
