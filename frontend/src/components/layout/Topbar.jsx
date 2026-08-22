import { useState } from 'react';
import { Menu, Search, Bell, Command, Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';
import { IconButton } from '../ui';
import { useAuthStore } from '../../stores/authStore';

export default function Topbar({ workspaceName, onMenuClick }) {
  const [isFocused, setIsFocused] = useState(false);
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuthStore();
  
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

  return (
    <motion.header
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="sticky top-0 z-20 shrink-0 flex items-center justify-center h-[56px] bg-[var(--topbar-bg)] border-b border-[var(--border-subtle)] w-full"
    >
      <div 
        className="flex items-center w-[92%] md:w-[90%] lg:w-[85%] max-w-[1440px] px-6 md:px-10 h-full box-border"
        style={{ margin: '0 auto' }}
      >
        {/* ── Left: Menu & Breadcrumb ────────────────────────────────────── */}
        <div className="flex items-center flex-1 min-w-0">
          <div className="md:hidden mr-3 shrink-0">
            <IconButton icon={Menu} onClick={onMenuClick} size={16} />
          </div>
          
          <div className="hidden sm:flex items-center gap-2 overflow-hidden select-none">
            <span className="text-[13px] font-medium text-[var(--text-secondary)] truncate max-w-[120px]">
              {workspaceName || 'Workspace'}
            </span>
            <span className="text-[13px] text-[var(--text-muted)]">/</span>
            <span className="text-[13px] font-semibold text-[var(--text-primary)] truncate max-w-[150px]">
              {getPageName()}
            </span>
          </div>
        </div>

        {/* ── Center: Global Command Search ──────────────────────────────── */}
        <div className="flex-1 flex justify-center px-4 max-w-xl shrink-0">
          <motion.div
            animate={{
              width: isFocused ? '440px' : '400px',
              borderColor: isFocused ? 'var(--focus-ring)' : 'var(--border-default)',
              backgroundColor: isFocused ? 'var(--surface-hover)' : 'var(--surface-raised)'
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="relative flex items-center h-[34px] rounded-lg border w-full max-w-full overflow-hidden group cursor-text"
            onClick={() => document.getElementById('global-search')?.focus()}
          >
            <Search 
              size={14} 
              className="absolute left-3 transition-colors" 
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
            <div className="absolute right-2 flex items-center gap-0.5">
              <span className="flex items-center justify-center h-5 px-1.5 rounded bg-[var(--surface)] border border-[var(--border-default)] text-[10px] font-medium text-[var(--text-muted)] opacity-60 group-hover:opacity-100 transition-opacity select-none">
                <Command size={10} className="mr-0.5" /> K
              </span>
            </div>
          </motion.div>
        </div>

        {/* ── Right: Actions ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-end flex-1 min-w-0 gap-2 sm:gap-3">
          <div className="hidden sm:flex items-center gap-1.5 mr-1">
            <IconButton 
              icon={theme === 'dark' ? Moon : Sun} 
              size={15} 
              onClick={toggleTheme} 
              className="w-8 h-8 rounded-full"
              title="Switch theme"
            />
            <div className="relative">
              <IconButton 
                icon={Bell} 
                size={15} 
                className="w-8 h-8 rounded-full"
                title="Notifications"
              />
              {/* Notification Badge */}
              <div className="absolute top-[4px] right-[4px] w-2 h-2 rounded-full bg-blue-500 border border-[var(--topbar-bg)] pointer-events-none" />
            </div>
          </div>

          {/* User Avatar */}
          <motion.button 
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="w-8 h-8 rounded-full bg-[#8B6B5D] flex items-center justify-center text-[12px] font-semibold text-white cursor-pointer outline-none shrink-0 overflow-hidden select-none"
          >
            {initial}
          </motion.button>
        </div>
      </div>
    </motion.header>
  );
}
