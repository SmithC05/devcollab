// src/pages/SelectWorkspacePage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, FolderOpen, LogOut, Crown, Lock } from 'lucide-react';
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

// Role badge colors
const ROLE_STYLES = {
  OWNER:     { dot: '#f59e0b', text: '#f59e0b', label: 'OWNER' },
  ADMIN:     { dot: '#818cf8', text: '#818cf8', label: 'ADMIN' },
  LEAD:      { dot: '#34d399', text: '#34d399', label: 'LEAD' },
  DEVELOPER: { dot: '#60a5fa', text: '#60a5fa', label: 'DEVELOPER' },
  MEMBER:    { dot: '#A1A1AA', text: '#A1A1AA', label: 'MEMBER' },
};

export default function SelectWorkspacePage() {
  useTheme();
  const navigate = useNavigate();
  const { user, workspaces, refreshWorkspaces, setActiveWorkspace, logout } = useAuthStore();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
<<<<<<< HEAD
  const [createError, setCreateError] = useState('');
=======
  const [actionError, setActionError] = useState(null);  // L-05: surface errors to UI
>>>>>>> 10b098ef335a82765d2f08f3c4029b6683a67f69

  // Refresh on mount to ensure latest membership list
  useEffect(() => {
    refreshWorkspaces();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Count workspaces the user CREATED (owner) — this is what FREE plan limits
  const createdWorkspacesCount = workspaces.filter(ws => ws.created_by_me).length;
  const isFreePlanLimitReached = createdWorkspacesCount >= 1; // FREE: max 1 created

  const handleSelectWorkspace = (workspaceId) => {
    setActiveWorkspace(workspaceId);
    navigate('/dashboard');
  };

<<<<<<< HEAD
  const handleCreate = async (name, slug) => {
    setCreateError('');
    try {
=======
  const handleCreate = async (name, slug, description) => {
    setActionError(null);
    try {
      // BUG-09 FIX: Backend now uses request.user — don't pass user.id
>>>>>>> 10b098ef335a82765d2f08f3c4029b6683a67f69
      await workspaceApi.createWorkspace(name, slug);
      await refreshWorkspaces();
      setIsCreateOpen(false);
    } catch (err) {
<<<<<<< HEAD
      setCreateError(err.message);
      // Re-throw so modal can also show the error if needed
      throw err;
=======
      setActionError(err.message || 'Failed to create workspace');
>>>>>>> 10b098ef335a82765d2f08f3c4029b6683a67f69
    }
  };

  const handleJoin = async (inviteCode) => {
<<<<<<< HEAD
    try {
      await workspaceApi.joinWorkspace(inviteCode, user?.id);
      await refreshWorkspaces();
      setIsJoinOpen(false);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateClick = () => {
    if (isFreePlanLimitReached) {
      setCreateError('Free plan allows creating only 1 workspace. Upgrade to Pro to create more.');
      return;
    }
    setCreateError('');
    setIsCreateOpen(true);
=======
    setActionError(null);
    try {
      // BUG-10 FIX: Backend now uses request.user — don't pass user.id
      await workspaceApi.joinWorkspace(inviteCode);
      await refreshWorkspaces();
      setIsJoinOpen(false);
    } catch (err) {
      setActionError(err.message || 'Failed to join workspace');
    }
>>>>>>> 10b098ef335a82765d2f08f3c4029b6683a67f69
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-white w-full flex flex-col font-sans">

      {/* Header */}
      <header className="w-full flex items-center justify-between px-8 py-6 h-[72px] border-b border-[#1a1a1a]">
        <div className="flex items-center gap-2 text-white font-bold text-xl">
          DevCollab
        </div>
        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="text-[#A1A1AA] hover:text-white transition-colors text-sm flex items-center gap-2 font-medium"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </header>

      {/* Main Content */}
      <main
        className="w-full mx-auto self-center px-8 pt-[64px] pb-[80px] flex-1 flex flex-col"
        style={{ maxWidth: '1180px' }}
      >

        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-12">
          <div>
            <h1 className="text-[44px] font-bold mb-2 tracking-tight text-white leading-tight">
              Select Workspace
            </h1>
            <p className="text-[16px] text-[#A1A1AA]">
              {workspaces.length > 0
                ? `You belong to ${workspaces.length} workspace${workspaces.length !== 1 ? 's' : ''}.`
                : 'Create a new workspace or join an existing team.'}
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-3">
              {/* Join — always available */}
              <button
                onClick={() => setIsJoinOpen(true)}
                className="px-5 py-2.5 rounded-full border border-[#27272A] bg-transparent hover:bg-[#27272A]/50 transition-colors text-[14px] font-medium text-[#FAFAFA] whitespace-nowrap shrink-0"
              >
                Join Workspace
              </button>

              {/* Create — disabled with message for FREE users at limit */}
              <button
                onClick={handleCreateClick}
                className={`px-5 py-2.5 rounded-full text-[14px] font-medium flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors ${
                  isFreePlanLimitReached
                    ? 'bg-[#1a1a1a] border border-[#27272A] text-[#737373] cursor-not-allowed'
                    : 'bg-white hover:bg-gray-200 text-black'
                }`}
              >
                {isFreePlanLimitReached ? <Lock size={14} /> : <Plus size={16} strokeWidth={2.5} />}
                Create Workspace
              </button>
            </div>

            {/* FREE plan limit notice */}
            {isFreePlanLimitReached && (
              <p className="text-[12px] text-[#737373] text-right">
                Free plan: 1 workspace creation limit.{' '}
                <button className="text-white underline hover:no-underline" onClick={() => navigate('/dashboard/billing')}>
                  Upgrade to Pro
                </button>
              </p>
            )}
            {createError && !isFreePlanLimitReached && (
              <p className="text-[12px] text-red-400 text-right">{createError}</p>
            )}
          </div>
        </div>

        {/* Workspaces Grid */}
        {workspaces.length > 0 && (
          <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
            {workspaces.map((ws) => {
              const role = ws.role?.toUpperCase() || 'MEMBER';
              const roleStyle = ROLE_STYLES[role] || ROLE_STYLES.MEMBER;

              return (
                <button
                  key={ws.id}
                  onClick={() => handleSelectWorkspace(ws.id)}
                  className="group relative w-full text-left bg-[#0d0d0d] border border-[#1f1f1f] rounded-2xl p-6 hover:border-[#333] hover:bg-[#111] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 min-h-[220px] flex flex-col"
                >
                  {/* Top row: Avatar + Plan badge */}
                  <div className="flex justify-between items-start mb-5">
                    <div className="w-11 h-11 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center shrink-0">
                      <span className="text-[#FAFAFA] text-[15px] font-bold tracking-wide">
                        {getInitials(ws.name)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {ws.created_by_me && (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#1a1a1a] border border-[#2a2a2a]">
                          <Crown size={10} className="text-[#f59e0b]" />
                          <span className="text-[10px] font-semibold text-[#f59e0b] tracking-wide">CREATED</span>
                        </div>
                      )}
                      <div className="px-2.5 py-0.5 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] text-[10px] font-semibold text-[#737373] tracking-wide">
                        {ws.plan?.toUpperCase() || 'FREE'}
                      </div>
                    </div>
                  </div>

<<<<<<< HEAD
                  {/* Workspace name + role */}
                  <div className="mb-auto">
                    <h3 className="text-[18px] font-semibold text-white mb-1.5 truncate">
                      {ws.name}
                    </h3>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: roleStyle.dot }}
                      />
                      <span
                        className="text-[11px] font-semibold tracking-wider"
                        style={{ color: roleStyle.text }}
                      >
                        {roleStyle.label}
                      </span>
                    </div>
                  </div>
=======
                {/* Bottom row: Stats with Divider */}
                <div className="mt-8 pt-5 border-t border-[#242424] flex items-center gap-6 text-[#A1A1AA]">
                  <div className="flex items-center gap-2">
                    <Users size={16} />
                    {/* BUG-12 FIX: Backend returns memberCount, not members.length */}
                    <span className="text-[14px] font-medium">{ws.memberCount ?? 1}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FolderOpen size={16} />
                    {/* BUG-12 FIX: Backend returns projectCount, not projectsCount */}
                    <span className="text-[14px] font-medium">{ws.projectCount ?? 0}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
>>>>>>> 10b098ef335a82765d2f08f3c4029b6683a67f69

                  {/* Stats footer */}
                  <div className="mt-6 pt-4 border-t border-[#1f1f1f] flex items-center gap-5 text-[#737373]">
                    <div className="flex items-center gap-1.5">
                      <Users size={14} />
                      <span className="text-[13px] font-medium">{ws.memberCount ?? 1}</span>
                      <span className="text-[12px]">members</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <FolderOpen size={14} />
                      <span className="text-[13px] font-medium">{ws.projectCount ?? 0}</span>
                      <span className="text-[12px]">projects</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {workspaces.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-[#27272A] rounded-2xl mt-4">
            <FolderOpen size={32} className="text-[#52525B] mb-4" />
            <h3 className="text-[17px] font-semibold text-white mb-2">No workspaces yet</h3>
            <p className="text-[14px] text-[#A1A1AA] max-w-sm">
              Create a new workspace for your team or join one using an invite code.
            </p>
          </div>
        )}

        {/* L-05: Surface action errors */}
        {actionError && (
          <div className="mt-4 px-4 py-3 bg-red-900/30 border border-red-700 rounded-xl text-red-400 text-[13px]">
            {actionError}
          </div>
        )}

      </main>

      {/* Modals */}
      <CreateWorkspaceModal
        isOpen={isCreateOpen}
        onClose={() => { setIsCreateOpen(false); setCreateError(''); }}
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
