// src/pages/SelectWorkspacePage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Users, FolderOpen, LogOut, Link, Sparkles, ChevronRight } from 'lucide-react';
import { useAuthStore } from "../../stores/authStore";
import { workspaceApi } from "../../api/workspaceApi";
import ThemeToggle from "../auth/ThemeToggle";
import { useTheme } from "../../hooks/useTheme";
import CreateWorkspaceModal from "../workspace/CreateWorkspaceModal";
import JoinWorkspaceModal from "../workspace/JoinWorkspaceModal";

function getInitials(name) {
  if (!name) return 'WS';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function SelectWorkspacePage() {
  useTheme();
  const navigate = useNavigate();
  const { user, workspaces, refreshWorkspaces, setActiveWorkspace, logout } = useAuthStore();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [hoveredId, setHoveredId] = useState(null);

  useEffect(() => {
    refreshWorkspaces();
  }, [refreshWorkspaces]);

  const handleSelectWorkspace = (workspaceId) => {
    setActiveWorkspace(workspaceId);
    navigate('/dashboard');
  };

  const handleCreate = async (name, slug, description) => {
    await workspaceApi.createWorkspace(name, slug, user?.id);
    await refreshWorkspaces();
    setIsCreateOpen(false);
  };

  const handleJoin = async (inviteCode) => {
    await workspaceApi.joinWorkspace(inviteCode, user?.id);
    await refreshWorkspaces();
    setIsJoinOpen(false);
  };

  return (
    <div
      className="relative min-h-screen bg-[#050505] p-4 md:p-12 w-full overflow-hidden flex flex-col items-center justify-center"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      <ThemeToggle />

      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[120px]" />
        <div className="absolute bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-violet-600/10 blur-[100px]" />
        
        {/* Subtle grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]" 
          style={{ 
            backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`, 
            backgroundSize: '40px 40px' 
          }} 
        />
      </div>

      <div className="w-full mx-auto relative z-10" style={{ maxWidth: 1000 }}>
        
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 w-full"
        >
          <div className="max-w-2xl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/70 text-xs font-semibold uppercase tracking-widest mb-6 backdrop-blur-md"
            >
              <Sparkles size={14} className="text-indigo-400" />
              Welcome back, {user?.name?.split(' ')[0] || 'User'}
            </motion.div>
            
            <h1 className="text-[40px] md:text-[52px] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-white/90 to-white/60 tracking-tight mb-4 leading-tight">
              Select your workspace
            </h1>
            <p className="text-[17px] text-white/50 leading-relaxed font-light">
              Choose an existing workspace to continue collaborating, or create a new environment for your next big idea.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => logout()}
              className="
                group h-12 px-5 rounded-2xl
                flex items-center justify-center gap-2
                bg-white/5 border border-white/5
                text-white/70 text-sm font-medium
                hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 
                transition-all duration-300
              "
            >
              <LogOut size={16} className="group-hover:-translate-x-0.5 transition-transform" />
              Logout
            </button>
            <button
              onClick={() => setIsJoinOpen(true)}
              className="
                h-12 px-5 rounded-2xl
                flex items-center justify-center gap-2
                bg-white/5 border border-white/10
                text-white text-sm font-medium
                hover:bg-white/10 hover:border-white/20 transition-all duration-300
              "
            >
              <Link size={16} />
              Join
            </button>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="
                group h-12 px-6 rounded-2xl
                flex items-center justify-center gap-2
                bg-white text-black
                text-sm font-bold shadow-[0_0_20px_rgba(255,255,255,0.1)]
                hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:scale-[1.02] 
                transition-all duration-300
              "
            >
              <Plus size={18} strokeWidth={2.5} className="group-hover:rotate-90 transition-transform duration-300" />
              Create New
            </button>
          </div>
        </motion.div>

        {/* Workspaces Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {workspaces.map((ws, i) => {
            const role = ws.members?.find(m => m.userId === user?.id)?.role?.toUpperCase() || 'MEMBER';
            const isHovered = hoveredId === ws.id;
            
            return (
              <motion.div
                key={ws.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 * i, ease: [0.16, 1, 0.3, 1] }}
                onMouseEnter={() => setHoveredId(ws.id)}
                onMouseLeave={() => setHoveredId(null)}
                className="relative group h-full"
              >
                {/* Glow effect behind the card */}
                <div 
                  className={`
                    absolute inset-0 rounded-[24px] bg-gradient-to-br from-indigo-500/20 to-purple-500/20 blur-xl transition-opacity duration-500
                    ${isHovered ? 'opacity-100' : 'opacity-0'}
                  `}
                />
                
                <button
                  onClick={() => handleSelectWorkspace(ws.id)}
                  className={`
                    relative w-full h-full text-left bg-white/[0.02] backdrop-blur-xl border border-white/[0.08] rounded-[24px]
                    flex flex-col overflow-hidden transition-all duration-500
                    hover:bg-white/[0.04] hover:border-white/[0.15] hover:-translate-y-1
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50
                  `}
                >
                  <div className="p-7 pb-6 flex-1 relative z-10">
                    <div className="flex justify-between items-start mb-8">
                      {/* Avatar with glowing ring */}
                      <div className="relative">
                        <div className={`absolute inset-0 rounded-2xl bg-indigo-500/20 blur-md transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`} />
                        <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center border border-white/10 shadow-inner">
                          <span className="text-white text-lg font-bold tracking-wider">
                            {getInitials(ws.name)}
                          </span>
                        </div>
                      </div>
                      
                      {/* Plan Badge */}
                      <div className="px-3 py-1.5 rounded-full bg-black/40 border border-white/5 text-[10px] font-bold text-white/60 tracking-widest backdrop-blur-md">
                        {ws.plan?.toUpperCase() || 'FREE'}
                      </div>
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2 truncate group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-white/70 transition-all">
                      {ws.name}
                    </h3>
                    
                    <div className="flex items-center gap-2 text-xs font-semibold text-white/40 tracking-widest">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                      {role}
                    </div>
                  </div>

                  <div className="px-7 py-5 bg-black/20 border-t border-white/[0.04] flex items-center justify-between">
                    <div className="flex items-center gap-5">
                      <div className="flex items-center gap-2 text-white/40 group-hover:text-white/60 transition-colors">
                        <Users size={15} />
                        <span className="text-sm font-medium">{ws.members?.length || 1}</span>
                      </div>
                      <div className="flex items-center gap-2 text-white/40 group-hover:text-white/60 transition-colors">
                        <FolderOpen size={15} />
                        <span className="text-sm font-medium">{ws.projectsCount || 0}</span>
                      </div>
                    </div>
                    
                    <div className={`
                      w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/50
                      transition-all duration-300 border border-transparent
                      ${isHovered ? 'translate-x-1 bg-white/10 text-white border-white/10' : ''}
                    `}>
                      <ChevronRight size={16} />
                    </div>
                  </div>
                </button>
              </motion.div>
            );
          })}
        </motion.div>

        {workspaces.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col items-center justify-center py-32 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/10">
              <FolderOpen size={32} className="text-white/30" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No workspaces found</h3>
            <p className="text-[15px] text-white/40 max-w-sm">
              You don't belong to any workspaces yet. Create a new one or join an existing team to get started.
            </p>
          </motion.div>
        )}
      </div>

      {/* Modals */}
      <CreateWorkspaceModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreate={handleCreate}
      />
      <JoinWorkspaceModal
        isOpen={isJoinOpen}
        onClose={() => setIsJoinOpen(false)}
        onJoin={handleJoin}
      />
    </div>
  );
}
