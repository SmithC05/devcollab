// src/pages/DashboardPlaceholder.jsx
// Temporary placeholder. The actual dashboard will be built in a separate phase.

import { useAuthStore } from "../../stores/authStore";
import ThemeToggle from "../auth/ThemeToggle';
import { LogOut } from 'lucide-react";
import { useTheme } from "../../hooks/useTheme";

export default function DashboardPlaceholder() {
  useTheme();
  const { user, workspace, role, logout } = useAuthStore();

  return (
    <div
      className="min-h-screen bg-[var(--bg)]  text-[var(--text-primary)]"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      <ThemeToggle />

      {/* Header */}
      <header className="border-b border-[var(--border-subtle)] bg-[var(--surface)]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="black" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="font-bold text-[15px]">DevCollab</span>
            {workspace && (
              <span className="px-2.5 py-1 text-[11px] font-semibold bg-[var(--surface-hover)] text-[var(--text-muted)] rounded-lg border border-[var(--border-subtle)]">
                {workspace.name}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-[13px] font-semibold">{user?.name}</div>
              <div className="text-[11px] text-[var(--text-muted)] uppercase tracking-wide">{role}</div>
            </div>
            <button
              id="dashboard-logout"
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-focus)] text-[12px] transition-colors"
              title="Logout"
            >
              <LogOut size={14} />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center py-24 border-2 border-dashed border-[var(--border-strong)] rounded-[22px] bg-[var(--surface)]">
          <div className="w-12 h-12 rounded-full bg-[var(--surface-hover)] border border-[var(--border-subtle)] flex items-center justify-center mx-auto mb-4">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="none" stroke="#737373" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 className="text-[20px] font-bold text-[var(--text-primary)] mb-2">Dashboard</h2>
          <p className="text-[var(--text-muted)] text-[13px] max-w-sm mx-auto">
            This is a placeholder. The full dashboard will be built in the next development phase.
          </p>
          {workspace && (
            <div className="mt-6 inline-flex flex-col items-center gap-1 px-5 py-3 rounded-xl bg-[var(--surface-item)] border border-[var(--border-subtle)]">
              <span className="text-[11px] text-[var(--text-muted)] uppercase tracking-widest font-semibold">Active workspace</span>
              <span className="text-[var(--text-primary)] text-[14px] font-bold">{workspace.name}</span>
              <span className="text-[var(--text-muted)] text-[11px] font-mono">{workspace.slug}</span>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
