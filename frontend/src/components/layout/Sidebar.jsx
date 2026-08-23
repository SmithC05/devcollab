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
  Globe,
  Target,
  PlayCircle,
  Share2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  MoreVertical,
  LogOut
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
      className="relative flex items-center h-[34px] text-[13px] font-medium outline-none transition-all duration-150 mb-[2px] select-none rounded-[6px] group"
      style={{ padding: collapsed ? '0' : '0 10px', justifyContent: collapsed ? 'center' : 'flex-start' }}
    >
      {({ isActive }) => (
        <>
          <div 
            className={`absolute inset-0 rounded-[6px] transition-colors duration-150 ${
              isActive 
                ? 'bg-[var(--surface-item)] border border-[var(--border-strong)]' 
                : 'bg-transparent border border-transparent group-hover:bg-[var(--surface-hover)]'
            }`} 
          />

          <div className="relative flex items-center z-10 w-full" style={{ gap: '10px', justifyContent: collapsed ? 'center' : 'flex-start' }}>
            <Icon 
              size={16} 
              className="shrink-0 transition-colors duration-150" 
              style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-muted)' }}
            />
            {!collapsed && (
              <span className="truncate transition-colors duration-150" style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                {children}
              </span>
            )}
          </div>
        </>
      )}
    </NavLink>
  );
}

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { user, activeWorkspace } = useAuthStore();
  
  const [collapsed, setCollapsed] = useState(false);

  const userName = user?.first_name
    ? `${user.first_name} ${user.last_name}`.trim()
    : user?.username || 'User';
  const initial = userName.charAt(0).toUpperCase();

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
    }
  ];
  
  const isDeveloper = activeWorkspace?.role === 'DEVELOPER' || activeWorkspace?.role === 'MEMBER';

  const intelGroup = {
    title: 'INTELLIGENCE',
    items: isDeveloper ? [
      { to: '/dashboard/intelligence/engineering-profile', icon: Globe, label: 'Engineering Profile' },
    ] : [
      { to: '/dashboard/ai', icon: Sparkles, label: 'AI Assistant' },
      { to: '/dashboard/intelligence/organization', icon: Globe, label: 'Organization' },
      { to: '/dashboard/intelligence/decision/dp1', icon: Target, label: 'Decision Points' },
      { to: '/dashboard/intelligence/simulation/demo/sc1', icon: PlayCircle, label: 'Simulations' },
      { to: '/dashboard/intelligence/knowledge-transfer/kt1', icon: Share2, label: 'Knowledge Transfer' },
    ]
  };

  const handleSignOut = async () => {
    // If there is a confirmation needed, we could add it, but requirement said:
    // "Do not create unnecessary confirmation if the existing application consistently uses immediate logout without confirmation."
    // We will do immediate logout as requested.
    await useAuthStore.getState().logout();
    navigate('/login');
  };

  const sidebarContent = (isMobile) => {
    const isCollapsed = !isMobile && collapsed;

    return (
      <motion.aside
        animate={{ width: isCollapsed ? 64 : 240 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="flex flex-col h-full shrink-0 bg-[var(--bg)] border-r border-[var(--border-subtle)] overflow-visible relative z-30"
      >
        {/* Desktop collapse toggle */}
        {!isMobile && (
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="absolute -right-[13px] top-[24px] w-[26px] h-[26px] bg-[var(--surface)] border border-[var(--border-strong)] rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--focus-ring)] cursor-pointer shadow-sm transition-all z-40"
          >
            {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
          </button>
        )}

        {/* ── Brand ──────────────────────────────────────────── */}
        <div className="h-[64px] px-4 flex items-center shrink-0" style={{ justifyContent: isCollapsed ? 'center' : 'space-between' }}>
          <div className="flex items-center gap-2 overflow-hidden cursor-pointer group">
            <div className="w-[24px] h-[24px] rounded-[6px] bg-[var(--text-primary)] text-[var(--bg)] flex items-center justify-center text-[11px] font-bold shrink-0 transition-transform group-hover:scale-105">
              DC
            </div>
            {!isCollapsed && (
              <span className="text-[14px] font-bold text-[var(--text-primary)] tracking-tight whitespace-nowrap">
                DevCollab
              </span>
            )}
          </div>
          {!isCollapsed && isMobile && (
            <IconButton icon={X} onClick={onClose} size={16} className="md:hidden" />
          )}
        </div>

        {/* ── Workspace Selector ────────────────────────────────────── */}
        {!isCollapsed && (
          <div className="px-3 mb-4">
            <button
              onClick={() => navigate('/select-workspace')}
              className="w-full flex items-center justify-between h-[36px] px-3 rounded-[8px] border border-[var(--border-subtle)] bg-[var(--surface-item)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)] transition-colors duration-150 cursor-pointer"
              title="Switch workspace"
            >
              <span className="text-[13px] font-medium text-[var(--text-primary)] truncate">
                {activeWorkspace?.name || 'Team Workspace'}
              </span>
              <ChevronDown size={14} className="text-[var(--text-muted)] shrink-0 ml-2" />
            </button>
          </div>
        )}
        {isCollapsed && (
          <div className="w-full h-px bg-[var(--border-subtle)] mb-4" />
        )}

        {/* ── Navigation ────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-3 pb-4 flex flex-col">
          {navGroups.map((group, groupIdx) => (
            <div key={group.title} className="mb-6">
              {!isCollapsed && (
                <div className="px-2 mb-2">
                  <span className="text-[11px] font-semibold text-[var(--text-muted)] tracking-wider">
                    {group.title}
                  </span>
                </div>
              )}
              <nav className="flex flex-col relative">
                {group.items.map((item, idx) => (
                  <SideNavLink key={item.to} to={item.to} end={item.end} onClick={isMobile ? onClose : undefined} icon={item.icon} collapsed={isCollapsed}>
                    {item.label}
                  </SideNavLink>
                ))}
              </nav>
            </div>
          ))}
          
          <div className="h-px bg-[var(--border-subtle)] w-full mb-6" />
          
          {/* Intelligence Group */}
          <div>
            {!isCollapsed && (
              <div className="px-2 mb-2">
                <span className="text-[11px] font-semibold text-[var(--text-muted)] tracking-wider">
                  {intelGroup.title}
                </span>
              </div>
            )}
            <nav className="flex flex-col relative">
              {intelGroup.items.map((item, idx) => (
                <SideNavLink key={item.to} to={item.to} end={item.end} onClick={isMobile ? onClose : undefined} icon={item.icon} collapsed={isCollapsed}>
                  {item.label}
                </SideNavLink>
              ))}
            </nav>
          </div>
        </div>

        {/* ── User Footer ──────────────────────────────────── */}
        <div className="shrink-0 p-3 flex flex-col gap-1 border-t border-[var(--border-subtle)] bg-[var(--bg)]">
          <button
            onClick={() => navigate('/dashboard/settings')}
            className={`w-full flex items-center h-[44px] rounded-[8px] bg-transparent hover:bg-[var(--surface-hover)] border border-transparent hover:border-[var(--border-subtle)] transition-colors duration-150 cursor-pointer ${isCollapsed ? 'justify-center px-0' : 'justify-between px-2'}`}
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-[26px] h-[26px] rounded-full bg-[var(--surface-item)] border border-[var(--border-strong)] text-[var(--text-secondary)] flex items-center justify-center text-[11px] font-medium shrink-0 overflow-hidden">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt={initial} className="w-full h-full object-cover" />
                ) : (
                  initial
                )}
              </div>
              {!isCollapsed && (
                <div className="flex flex-col items-start overflow-hidden text-left">
                  <span className="text-[13px] font-medium text-[var(--text-primary)] truncate w-full leading-tight">
                    {userName}
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)] leading-tight mt-[1px]">
                    View profile
                  </span>
                </div>
              )}
            </div>
            {!isCollapsed && <MoreVertical size={14} className="text-[var(--text-muted)] shrink-0" />}
          </button>
          <button
            onClick={handleSignOut}
            className={`w-full flex items-center h-[32px] rounded-[8px] bg-transparent hover:bg-[var(--surface-hover)] border border-transparent hover:border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors duration-150 cursor-pointer ${isCollapsed ? 'justify-center px-0' : 'px-2'}`}
          >
            <LogOut size={14} className={isCollapsed ? "" : "mr-2.5"} />
            {!isCollapsed && <span className="text-[12px] font-medium">Sign out</span>}
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
              className="fixed inset-0 bg-[#000000] bg-opacity-70 backdrop-blur-sm z-40 md:hidden"
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
