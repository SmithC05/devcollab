// src/pages/SelectWorkspacePage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Users, FolderOpen } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { workspaceApi } from '../api/workspaceApi';
import ThemeToggle from '../components/auth/ThemeToggle';
import { useTheme } from '../hooks/useTheme';
import CreateWorkspaceModal from '../components/workspace/CreateWorkspaceModal';
import JoinWorkspaceModal from '../components/workspace/JoinWorkspaceModal';

function getInitials(name) {
  if (!name) return 'WS';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function SelectWorkspacePage() {
  useTheme();
  const navigate = useNavigate();
  const { user, workspaces, refreshWorkspaces, setActiveWorkspace } = useAuthStore();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);

  // Fallback refresh on mount to ensure we have the latest data
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
      className="min-h-screen bg-black p-4 md:p-12 w-full"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      <ThemeToggle />

      <div className="w-full mx-auto mt-8 md:mt-16" style={{ maxWidth: 1200 }}>
        
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 w-full"
        >
          <div>
            <h1 className="text-[32px] md:text-[36px] font-bold text-white tracking-tight mb-2">
              Select Workspace
            </h1>
            <p className="text-[15px] text-[#A3A3A3]">
              Choose a workspace to enter, or create a new one.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                useAuthStore.getState().logout();
              }}
              className="
                h-12 px-5 rounded-xl
                flex items-center justify-center gap-2
                bg-transparent border border-red-900/30
                text-red-500 text-sm font-semibold
                hover:bg-red-500/10 transition-colors
              "
            >
              Logout
            </button>
            <button
              onClick={() => setIsJoinOpen(true)}
              className="
                h-12 px-5 rounded-xl
                flex items-center justify-center gap-2
                bg-transparent border border-[#292929]
                text-white text-sm font-semibold
                hover:bg-[#151515] transition-colors
              "
            >
              Join Workspace
            </button>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="
                h-12 px-5 rounded-xl
                flex items-center justify-center gap-2
                bg-white text-black
                text-sm font-bold
                hover:bg-[#f0f0f0] transition-colors
              "
            >
              <Plus size={18} strokeWidth={2.5} />
              Create
            </button>
          </div>
        </motion.div>

        {/* Workspaces Grid */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {workspaces.map((ws, i) => {
            const role = ws.members.find(m => m.userId === user?.id)?.role?.toUpperCase() || 'MEMBER';
            return (
              <motion.button
                key={ws.id}
                onClick={() => handleSelectWorkspace(ws.id)}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.05 * i }}
                className="
                  group w-full text-left bg-[#0A0A0A] border border-[#242424] rounded-[18px]
                  flex flex-col overflow-hidden transition-all duration-200
                  hover:border-[#444] hover:-translate-y-[2px]
                  hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)]
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20
                "
              >
                <div className="p-6 pb-5 flex-1">
                  <div className="flex justify-between items-start mb-6">
                    {/* Avatar */}
                    <div className="w-[44px] h-[44px] rounded-[10px] bg-[#1a1a1a] flex items-center justify-center border border-[#333]">
                      <span className="text-white text-[15px] font-bold tracking-wider">
                        {getInitials(ws.name)}
                      </span>
                    </div>
                    {/* Plan Badge */}
                    <div className="px-2.5 py-1 rounded-[6px] bg-[#151515] border border-[#292929] text-[10px] font-bold text-[#888] tracking-widest">
                      {ws.plan?.toUpperCase() || 'FREE'}
                    </div>
                  </div>

                  <h3 className="text-[19px] font-bold text-white mb-1.5 truncate">
                    {ws.name}
                  </h3>
                  
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#737373] tracking-widest">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#555]" />
                    {role}
                  </div>
                </div>

                <div className="px-6 py-4 bg-[#050505] border-t border-[#1a1a1a] flex items-center gap-6">
                  <div className="flex items-center gap-2 text-[#737373]">
                    <Users size={14} />
                    <span className="text-[13px] font-medium">{ws.members?.length || 1}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#737373]">
                    <FolderOpen size={14} />
                    <span className="text-[13px] font-medium">{ws.projectsCount || 0}</span>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </motion.div>

        {workspaces.length === 0 && (
          <div className="text-center py-20 text-[#525252]">
            <p className="text-[15px]">You don't belong to any workspaces yet.</p>
          </div>
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
