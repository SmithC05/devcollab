// src/pages/OnboardingPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, UserPlus } from "lucide-react";
import { useAuthStore } from "../../stores/authStore";
import { workspaceApi } from "../../api/workspaceApi";
import ThemeToggle from "../auth/ThemeToggle";
import { useTheme } from "../../hooks/useTheme";
import CreateWorkspaceModal from "../workspace/CreateWorkspaceModal";
import JoinWorkspaceModal from "../workspace/JoinWorkspaceModal";

const LogoMark = () => (
  <div className="w-[48px] h-[48px] rounded-[14px] bg-[var(--surface-hover)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0 mb-6 mx-auto">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M13 2L3 14H12L11 22L21 10H12L13 2Z"
        fill="white"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </div>
);

export default function OnboardingPage() {
  useTheme();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);

  const { user } = useAuthStore();
  const navigate = useNavigate();

  const handleCreate = async (name, slug) => {
    try {
      await workspaceApi.createWorkspace(name, slug);
      await useAuthStore.getState().refreshWorkspaces();
      navigate("/select-workspace");
    } catch (err) {
      alert(err.message);
    }
  };

  const handleJoin = async (inviteCode) => {
    await workspaceApi.joinWorkspace(inviteCode, user?.id);
    await useAuthStore.getState().refreshWorkspaces();
    navigate("/select-workspace");
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg)] "
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      <ThemeToggle />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="w-full flex items-center justify-center"
      >
        <div
          className="w-full text-center"
          style={{
            maxWidth: 520,
            padding: "52px",
            background: "#0A0A0A",
            borderRadius: 28,
            border: "1px solid #242424",
            boxShadow: "0 20px 80px rgba(0,0,0,0.45)",
          }}
        >
          <LogoMark />

          <h1 className="text-[30px] font-bold tracking-tight text-[var(--text-primary)] mb-4">
            Welcome to DevCollab
          </h1>

          <p className="text-[14px] md:text-[15px] leading-[1.6] text-[var(--text-secondary)] mb-10 px-4">
            You don't belong to any workspaces yet. Get started by creating a
            new workspace for your team or joining an existing one.
          </p>

          <div className="flex flex-col gap-[16px]">
            <button
              onClick={() => setIsCreateOpen(true)}
              className="
 w-full h-[60px] rounded-[16px]
 flex items-center justify-center gap-2.5
 bg-white text-black
 text-[15px] font-semibold
 hover:opacity-90 active:translate-y-[1px]
 transition-all duration-150 shadow-sm
 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40
 "
            >
              <Plus size={20} strokeWidth={2.5} />
              Create a Workspace
            </button>

            <button
              onClick={() => setIsJoinOpen(true)}
              className="
 w-full h-[60px] rounded-[16px]
 flex items-center justify-center gap-2.5
 bg-transparent border border-[var(--border-subtle)]
 text-[var(--text-primary)] text-[15px] font-semibold
 hover:bg-[var(--surface-hover)] active:translate-y-[1px]
 transition-all duration-150
 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20
 "
            >
              <UserPlus size={20} />
              Join a Workspace
            </button>
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={async () => {
                await useAuthStore.getState().logout();
                navigate("/login");
              }}
              className="text-[var(--text-muted)] text-[14px] hover:text-[var(--text-primary)] transition-colors"
            >
              Sign out and use a different account
            </button>
          </div>
        </div>
      </motion.div>

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
