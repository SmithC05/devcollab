import { useState, useEffect } from 'react';
import { Menu, Search, Bell, Command, Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';
import { IconButton } from '../ui';
import { useAuthStore } from '../../stores/authStore';

// BUG-15 FIX: workspaceName prop removed; read from store directly
export default function Topbar({ onMenuClick }) {
  const { activeWorkspace } = useAuthStore();
  const workspaceName = activeWorkspace?.name || 'Workspace';
  const [isFocused, setIsFocused] = useState(false);
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { user, activeWorkspace } = useAuthStore();
  
  const userName = user?.first_name
    ? `${user.first_name} ${user.last_name}`.trim()
    : user?.username || 'User';
  const initial = userName.charAt(0).toUpperCase();

  // Simple breadcrumb logic based on route
  const getPageName = () => {
    const path = location.pathname;
    if (path.includes('/projects')) return 'Projects';
    if (path.includes('/activity')) return 'Activity';
    if (path.includes('/members')) return 'Members';
    if (path.includes('/billing')) return 'Billing';
    if (path.includes('/settings')) return 'Settings';
    if (path.includes('/ai')) return 'AI Assistant';
    return 'Overview';
  };

  const wsName = workspaceName || activeWorkspace?.name || 'Workspace';
  const pageName = getPageName();

  // Global command K listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('global-search')?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <motion.header
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="sticky top-0 z-20 shrink-0 flex items-center justify-center h-[56px] bg-[var(--bg)] border-b border-[var(--border-subtle)] w-full"
    >
      <div 
        className="flex items-center w-full px-4 md:px-8 h-full box-border gap-4"
      >
        {/* ── Left: Menu & Breadcrumb ────────────────────────────────────── */}
        <div className="flex items-center flex-1 min-w-0 shrink-0">
          <div className="md:hidden mr-3 shrink-0">
            <IconButton icon={Menu} onClick={onMenuClick} size={16} />
          </div>
          
          <div className="hidden sm:flex items-center gap-2 overflow-hidden select-none">
            <span className="text-[12px] font-semibold tracking-wide text-[var(--text-muted)] truncate max-w-[120px] uppercase">
              {wsName.charAt(0)}
            </span>
            <span className="text-[12px] text-[var(--text-muted)]">/</span>
            <span className="text-[12px] font-semibold tracking-wide text-[var(--text-primary)] truncate max-w-[150px] uppercase">
              {pageName}
            </span>
          </div>
        </div>

        {/* ── Center: Global Command Search ──────────────────────────────── */}
        <div className="flex-[2] flex justify-center max-w-xl shrink min-w-[200px]">
          <motion.div
            animate={{
              borderColor: isFocused ? 'var(--border-focus)' : 'var(--border-subtle)',
              backgroundColor: isFocused ? 'var(--surface-item)' : 'var(--surface-raised)'
            }}
            transition={{ duration: 0.15 }}
            className="relative flex items-center h-[32px] rounded-[8px] border w-full max-w-full overflow-hidden group cursor-text transition-shadow shadow-sm"
            style={{ boxShadow: isFocused ? '0 0 0 1px var(--border-focus)' : 'none' }}
            onClick={() => document.getElementById('global-search')?.focus()}
          >
            <Search 
              size={13} 
              className="absolute left-3 transition-colors duration-150" 
              style={{ color: isFocused ? 'var(--text-primary)' : 'var(--text-muted)' }}
            />
            <input
              id="global-search"
              type="text"
              placeholder="Search or jump to..."
              className="w-full h-full bg-transparent border-none outline-none pl-9 pr-14 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
            <div className="absolute right-2 flex items-center gap-1">
              <span className="flex items-center justify-center h-[20px] px-1.5 rounded-[4px] border border-[var(--border-strong)] bg-[var(--surface-hover)] text-[10px] font-medium text-[var(--text-muted)] select-none">
                <Command size={10} className="mr-[2px]" /> K
              </span>
            </div>
          </motion.div>
        </div>

        {/* ── Right: Actions ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-end flex-1 min-w-0 gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-1 mr-1">
            <IconButton 
              icon={theme === 'dark' ? Moon : Sun} 
              size={15} 
              onClick={toggleTheme} 
              className="w-8 h-8 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
              title="Switch theme"
            />
            <div className="relative">
              <IconButton 
                icon={Bell} 
                size={15} 
                className="w-8 h-8 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
                title="Notifications"
              />
              {/* Notification Badge */}
              <div className="absolute top-[6px] right-[6px] w-[6px] h-[6px] rounded-full bg-green-500 pointer-events-none shadow-[0_0_0_2px_var(--bg)]" />
            </div>
          </div>

          {/* User Avatar */}
          <button 
            className="w-[28px] h-[28px] rounded-full bg-[var(--surface-item)] border border-[var(--border-strong)] flex items-center justify-center text-[11px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-focus)] transition-all cursor-pointer outline-none shrink-0 overflow-hidden select-none"
          >
            {initial}
          </button>
        </div>
      </div>
    </motion.header>
  );
}
