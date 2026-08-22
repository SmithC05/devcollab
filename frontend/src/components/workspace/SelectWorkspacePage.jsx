// src/pages/SelectWorkspacePage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, FolderOpen, LogOut } from 'lucide-react';
import { useAuthStore } from "../../stores/authStore";
import { workspaceApi } from "../../api/workspaceApi";
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
    <div className="min-h-screen bg-[#000000] text-white w-full flex flex-col font-sans">
      
      {/* Header */}
      <header className="w-full flex items-center justify-between px-8 py-6 h-[72px]">
        <div className="flex items-center gap-2 text-white font-bold text-xl">
          DevCollab
        </div>
        <button
          onClick={() => logout()}
          className="text-[#A1A1AA] hover:text-white transition-colors text-sm flex items-center gap-2 font-medium"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </header>

      {/* Main Centered Content Container */}
      <main 
        className="w-full mx-auto self-center px-8 pt-[72px] pb-[80px] flex-1 flex flex-col"
        style={{ maxWidth: '1180px' }}
      >
        
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-[44px] font-bold mb-3 tracking-tight text-white leading-tight">Select Workspace</h1>
            <p className="text-[16px] text-[#A1A1AA]">
              Choose a workspace to enter, or create a new one.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsJoinOpen(true)}
              className="px-5 py-2.5 rounded-full border border-[#27272A] bg-transparent hover:bg-[#27272A]/50 transition-colors text-[14px] font-medium text-[#FAFAFA] whitespace-nowrap shrink-0"
            >
              Join Workspace
            </button>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-5 py-2.5 rounded-full bg-white hover:bg-gray-200 transition-colors text-black text-[14px] font-medium flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <Plus size={16} strokeWidth={2.5} /> Create
            </button>
          </div>
        </div>

        {/* Workspaces Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 340px))' }}>
          {workspaces.map((ws) => {
            const role = ws.role?.toUpperCase() || 'MEMBER';
            
            return (
              <button
                key={ws.id}
                onClick={() => handleSelectWorkspace(ws.id)}
                className="group relative w-full text-left bg-[#111111] border border-[#27272A] rounded-2xl p-7 hover:border-[#3F3F46] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 min-h-[250px] flex flex-col"
              >
                {/* Top row: Avatar and Badge */}
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 rounded-xl bg-[#1A1A1A] border border-[#27272A] flex items-center justify-center">
                    <span className="text-[#FAFAFA] text-[16px] font-semibold tracking-wide">
                      {getInitials(ws.name)}
                    </span>
                  </div>
                  
                  <div className="px-3 py-1 rounded-full bg-[#1A1A1A] border border-[#27272A] text-[11px] font-semibold text-[#A1A1AA] tracking-wide">
                    {ws.plan?.toUpperCase() || 'FREE'}
                  </div>
                </div>

                {/* Middle: Title and Role */}
                <div className="mb-auto">
                  <h3 className="text-[20px] font-semibold text-[#FAFAFA] mb-2 truncate">
                    {ws.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-[#60A5FA]">
                    <span className="text-[14px]">◎</span> {role}
                  </div>
                </div>

                {/* Bottom row: Stats with Divider */}
                <div className="mt-8 pt-5 border-t border-[#242424] flex items-center gap-6 text-[#A1A1AA]">
                  <div className="flex items-center gap-2">
                    <Users size={16} />
                    <span className="text-[14px] font-medium">{ws.members?.length || 1}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FolderOpen size={16} />
                    <span className="text-[14px] font-medium">{ws.projectsCount || 0}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {workspaces.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-[#27272A] rounded-2xl mt-4 max-w-[340px]">
            <FolderOpen size={32} className="text-[#52525B] mb-4" />
            <h3 className="text-[17px] font-semibold text-white mb-2">No workspaces found</h3>
            <p className="text-[14px] text-[#A1A1AA] max-w-sm">
              You don't belong to any workspaces yet. Create a new one or join an existing team.
            </p>
          </div>
        )}

      </main>

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
