import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Folder,
  Activity,
  Users,
  CreditCard,
  Settings,
  Sparkles,
  Crown,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../stores/authStore';
import { IconButton } from '../ui';

function SideNavLink({ to, end, onClick, icon: Icon, children, collapsed }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className="relative flex items-center h-[36px] text-[13px] font-medium outline-none transition-colors mb-[4px] select-none group"
      style={{ padding: collapsed ? '0' : '0 12px', justifyContent: collapsed ? 'center' : 'flex-start' }}
    >
      {({ isActive }) => (
        <>
          {/* Active left border indicator */}
          {isActive && !collapsed && (
            <motion.div
              layoutId="sidebar-active-border"
              className="absolute left-0 top-0 bottom-0 w-[2px] bg-[var(--text-primary)] rounded-r-md"
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            />
          )}

          <div className="relative flex items-center z-10 w-full" style={{ gap: '12px', justifyContent: collapsed ? 'center' : 'flex-start' }}>
            <Icon 
              size={17} 
              className="shrink-0 transition-colors" 
              style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-muted)' }}
            />
            {!collapsed && (
              <span className="truncate transition-colors" style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                {children}
              </span>
            )}
          </div>
        </>
      )}
    </NavLink>
  );
}

export default function Sidebar({ workspaceName, isOpen, onClose }) {
  const navigate = useNavigate();
  const { user, activeWorkspace, workspacePlan } = useAuthStore();
  
  const [collapsed, setCollapsed] = useState(false);

  const userName = user?.first_name
    ? `${user.first_name} ${user.last_name}`.trim()
    : user?.username || 'User';
  const initial = userName.charAt(0).toLowerCase();
  const isPro = workspacePlan === 'PRO';

  const navGroups = [
    {
      title: 'WORKSPACE',
      items: [
        { to: '/dashboard', end: true, icon: LayoutDashboard, label: 'Overview' },
        { to: '/dashboard/projects', icon: Folder, label: 'Projects' },
        { to: '/dashboard/activity', icon: Activity, label: 'Activity' },
        { to: '/dashboard/members', icon: Users, label: 'Members' },
        { to: '/dashboard/billing', icon: CreditCard, label: 'Billing' },
        { to: '/dashboard/settings', icon: Settings, label: 'Settings' },
      ]
    },
    {
      title: 'INTELLIGENCE',
      items: [
        { to: '/dashboard/ai', icon: Sparkles, label: 'AI Assistant' },
      ]
    }
  ];

  const sidebarContent = (isMobile) => {
    const isCollapsed = !isMobile && collapsed;

    return (
      <motion.aside
        animate={{ width: isCollapsed ? 72 : 240 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="flex flex-col h-full shrink-0 bg-[var(--sidebar-bg)] border-r border-[var(--border-subtle)] overflow-visible relative z-30"
      >
        {/* Desktop collapse toggle - Placed on the border exactly like the image */}
        {!isMobile && (
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="absolute -right-3 top-[18px] w-6 h-6 bg-[var(--surface-raised)] border border-[var(--border-strong)] rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--focus-ring)] cursor-pointer shadow-sm transition-colors z-40"
          >
            {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
          </button>
        )}

        {/* ── Brand ──────────────────────────────────────────── */}
        <div className="h-[56px] flex items-center shrink-0 border-b border-[var(--border-subtle)]" style={{ justifyContent: isCollapsed ? 'center' : 'space-between', paddingLeft: isCollapsed ? '0' : '16px', paddingRight: '16px' }}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-[28px] h-[28px] rounded-full bg-[var(--text-primary)] text-[var(--bg)] flex items-center justify-center text-[12px] font-bold shrink-0">
              DC
            </div>
            {!isCollapsed && (
              <motion.span 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="text-[15px] font-bold text-[var(--text-primary)] tracking-tight whitespace-nowrap"
              >
                DevCollab
              </motion.span>
            )}
          </div>
          {!isCollapsed && isMobile && (
            <IconButton icon={X} onClick={onClose} size={16} className="md:hidden" />
          )}
        </div>

        {/* ── Navigation ────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto pt-6 pb-4 flex flex-col gap-8">
          {navGroups.map((group, groupIdx) => (
            <div key={group.title}>
              {!isCollapsed && (
                <div className="mb-3 flex flex-col gap-1.5" style={{ paddingLeft: '16px', paddingRight: '16px' }}>
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                    {group.title}
                  </span>
                  {groupIdx === 0 && (
                    <span className="text-[14px] font-semibold text-[var(--text-primary)] mb-2 truncate">
                      {workspaceName || activeWorkspace?.name || 'Team Thunder'}
                    </span>
                  )}
                </div>
              )}
              {isCollapsed && groupIdx > 0 && (
                <div className="h-px bg-[var(--border-subtle)] my-3 mx-4" />
              )}
              <nav className="flex flex-col relative px-3">
                {group.items.map((item, idx) => (
                  <motion.div
                    key={item.to}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (groupIdx * 0.1) + (idx * 0.03), duration: 0.2 }}
                  >
                    <SideNavLink to={item.to} end={item.end} onClick={isMobile ? onClose : undefined} icon={item.icon} collapsed={isCollapsed}>
                      {item.label}
                    </SideNavLink>
                  </motion.div>
                ))}
              </nav>
            </div>
          ))}
        </div>

        {/* ── User Footer ──────────────────────────────────── */}
        <div className="shrink-0 flex items-center justify-between mt-auto" style={{ paddingLeft: isCollapsed ? '0' : '16px', paddingRight: '16px', paddingBottom: '16px', paddingTop: '16px' }}>
          <button
            onClick={() => navigate('/dashboard/settings')}
            className="flex items-center gap-3 min-w-0 bg-transparent border-none outline-none cursor-pointer w-full group"
            style={{ justifyContent: isCollapsed ? 'center' : 'flex-start' }}
          >
            <div className={`relative w-[30px] h-[30px] rounded-full flex items-center justify-center text-[13px] font-semibold shrink-0 ${
              isPro ? 'bg-[#D4AF37] text-black border border-[#F5D76E]' : 'bg-[#8B6B5D] text-white'
            }`}>
              {isPro && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#FFE08A] border border-[#B88900] flex items-center justify-center">
                  <Crown size={9} strokeWidth={2.4} />
                </span>
              )}
              {initial}
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex items-center gap-2">
                <span className="text-[13px] font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] truncate transition-colors">
                  {userName.toLowerCase()}
                </span>
                {isPro && (
                  <span className="shrink-0 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#D4AF37]">
                    Pro
                  </span>
                )}
              </div>
            )}
          </button>
        </div>
      </motion.aside>
    );
  };

  return (
    <>
      <div className="hidden md:flex h-screen sticky top-0 z-30">
        {sidebarContent(false)}
      </div>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
              onClick={onClose}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 h-full z-50 md:hidden flex"
            >
              {sidebarContent(true)}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
