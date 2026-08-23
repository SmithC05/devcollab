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
  const [createError, setCreateError] = useState('');

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

  const handleCreate = async (name, slug) => {
    setCreateError('');
    try {
      await workspaceApi.createWorkspace(name, slug);
      await refreshWorkspaces();
      setIsCreateOpen(false);
    } catch (err) {
      setCreateError(err.message);
      // Re-throw so modal can also show the error if needed
      throw err;
    }
  };

  const handleJoin = async (inviteCode) => {
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
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-primary)] w-full flex flex-col font-sans">

      {/* Header */}
      <header className="w-full flex items-center justify-between px-8 py-6 h-[72px] border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2 text-[var(--text-primary)] font-bold text-xl">
          DevCollab
        </div>
        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="text-[#A1A1AA] hover:text-[var(--text-primary)] transition-colors text-sm flex items-center gap-2 font-medium"
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
            <h1 className="text-[44px] font-bold mb-2 tracking-tight text-[var(--text-primary)] leading-tight">
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
                className="px-5 py-2.5 rounded-full border border-[var(--border-strong)] bg-transparent hover:bg-[var(--border-strong)]/50 transition-colors text-[14px] font-medium text-[var(--text-primary)] whitespace-nowrap shrink-0"
              >
                Join Workspace
              </button>

              {/* Create — disabled with message for FREE users at limit */}
              <button
                onClick={handleCreateClick}
                className={`px-5 py-2.5 rounded-full text-[14px] font-medium flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors ${
                  isFreePlanLimitReached
                    ? 'bg-[var(--surface-hover)] border border-[var(--border-strong)] text-[var(--text-muted)] cursor-not-allowed'
                    : 'bg-white hover:bg-gray-200 text-black'
                }`}
              >
                {isFreePlanLimitReached ? <Lock size={14} /> : <Plus size={16} strokeWidth={2.5} />}
                Create Workspace
              </button>
            </div>

            {/* FREE plan limit notice */}
            {isFreePlanLimitReached && (
              <p className="text-[12px] text-[var(--text-muted)] text-right">
                Free plan: 1 workspace creation limit.{' '}
                <button className="text-[var(--text-primary)] underline hover:no-underline" onClick={() => navigate('/dashboard/billing')}>
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
                  className="group relative w-full text-left bg-[var(--surface-card)] border border-[var(--border-strong)] rounded-2xl p-6 hover:border-[var(--border-strong)] hover:bg-[var(--surface-item)] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 min-h-[220px] flex flex-col"
                >
                  {/* Top row: Avatar + Plan badge */}
                  <div className="flex justify-between items-start mb-5">
                    <div className="w-11 h-11 rounded-xl bg-[var(--surface-hover)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0">
                      <span className="text-[var(--text-primary)] text-[15px] font-bold tracking-wide">
                        {getInitials(ws.name)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {ws.created_by_me && (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--surface-hover)] border border-[var(--border-subtle)]">
                          <Crown size={10} className="text-[#f59e0b]" />
                          <span className="text-[10px] font-semibold text-[#f59e0b] tracking-wide">CREATED</span>
                        </div>
                      )}
                      <div className="px-2.5 py-0.5 rounded-full bg-[var(--surface-hover)] border border-[var(--border-subtle)] text-[10px] font-semibold text-[var(--text-muted)] tracking-wide">
                        {ws.plan?.toUpperCase() || 'FREE'}
                      </div>
                    </div>
                  </div>

                  {/* Workspace name + role */}
                  <div className="mb-auto">
                    <h3 className="text-[18px] font-semibold text-[var(--text-primary)] mb-1.5 truncate">
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

                  {/* Stats footer */}
                  <div className="mt-6 pt-4 border-t border-[var(--border-strong)] flex items-center gap-5 text-[var(--text-muted)]">
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
          <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-[var(--border-strong)] rounded-2xl mt-4">
            <FolderOpen size={32} className="text-[#52525B] mb-4" />
            <h3 className="text-[17px] font-semibold text-[var(--text-primary)] mb-2">No workspaces yet</h3>
            <p className="text-[14px] text-[#A1A1AA] max-w-sm">
              Create a new workspace for your team or join one using an invite code.
            </p>
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
