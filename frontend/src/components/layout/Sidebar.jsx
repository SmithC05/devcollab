import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Folder,
  Activity,
  Users,
  CreditCard,
  Settings,
  Sparkles,
  LogOut,
  Moon,
  Sun
} from 'lucide-react';
import clsx from 'clsx';
import { useAuthStore } from '../../stores/authStore';
import { useTheme } from '../../hooks/useTheme';

export default function Sidebar({ workspaceName }) {
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();
  const { theme, toggleTheme } = useTheme();

  const userName = user?.first_name 
    ? `${user.first_name} ${user.last_name}`.trim() 
    : user?.username || 'dev collab';
  const initial = userName.charAt(0).toUpperCase();
  const navItemClass = ({ isActive }) =>
    clsx(
      'flex items-center gap-[10px] h-[36px] px-[10px] rounded-[6px] text-[13px] leading-[1.4] transition-colors mb-0.5',
      isActive
        ? 'text-white bg-[#1A1A1A] font-semibold'
        : 'text-[#888888] hover:text-gray-200 hover:bg-[#151515] font-medium'
    );

  return (
    <aside
      className="sticky top-0 h-screen flex flex-col z-30 shrink-0
                 border-r border-[#1F1F1F]
                 bg-[#0D0D0D]"
      style={{ width: '240px' }}
    >
      {/* Logo Area */}
      <div className="h-[52px] px-4 flex items-center gap-2 border-b border-[#1F1F1F] shrink-0">
        <div className="w-[30px] h-[30px] rounded-full bg-white text-black flex items-center justify-center text-[12px] font-bold shrink-0">
          DC
        </div>
        <span className="text-[14px] font-semibold tracking-tight text-gray-100">
          DevCollab
        </span>
      </div>

      {/* Nav Content (Scrollable) */}
      <div className="flex-1 flex flex-col overflow-y-auto pt-4 px-4 pb-4">
        
        {/* Workspace section */}
        <div className="mb-1">
          <div className="text-[9px] uppercase tracking-[0.08em] text-[#666666] mb-[8px] font-medium px-[2px]">
            WORKSPACE
          </div>
          <div className="text-[13px] font-semibold text-gray-100 mb-3 px-[2px] truncate">
            {workspaceName || 'Team Thunder'}
          </div>
          <nav className="flex flex-col">
            <NavLink to="/dashboard" end className={navItemClass}>
              <LayoutDashboard size={17} />
              Overview
            </NavLink>
            <NavLink to="/dashboard/projects" className={navItemClass}>
              <Folder size={17} />
              Projects
            </NavLink>
            <NavLink to="/dashboard/activity" className={navItemClass}>
              <Activity size={17} />
              Activity
            </NavLink>
            <NavLink to="/dashboard/members" className={navItemClass}>
              <Users size={17} />
              Members
            </NavLink>
          </nav>
        </div>

        {/* Divider */}
        <div className="h-px bg-[#1F1F1F] my-[10px]" />

        {/* Billing & Settings */}
        <div className="mb-1">
          <nav className="flex flex-col">
            <NavLink to="/dashboard/billing" className={navItemClass}>
              <CreditCard size={17} />
              Billing
            </NavLink>
            <NavLink to="/dashboard/settings" className={navItemClass}>
              <Settings size={17} />
              Settings
            </NavLink>
          </nav>
        </div>

        {/* Divider */}
        <div className="h-px bg-[#1F1F1F] my-[10px]" />

        {/* Intelligence */}
        <div>
          <div className="text-[9px] uppercase tracking-[0.08em] text-[#666666] mb-[8px] font-medium px-[2px]">
            INTELLIGENCE
          </div>
          <nav className="flex flex-col">
            <NavLink to="/dashboard/ai" className={navItemClass}>
              <Sparkles size={17} />
              AI Assistant
            </NavLink>
          </nav>
        </div>
      </div>

      {/* User Area (Pinned to bottom) */}
      <div className="mt-auto px-4 py-3 border-t border-[#1F1F1F] shrink-0 flex flex-col justify-center h-[52px]">
        <div className="flex items-center justify-between">
          <div 
            onClick={() => navigate('/dashboard/settings')}
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
            title="Go to Profile/Settings"
          >
            <div className="w-[28px] h-[28px] rounded-full bg-[#2A2A2A] text-[#888888] flex items-center justify-center font-medium text-[12px] shrink-0">
              {initial}
            </div>
            <span className="text-[13px] font-medium text-[#999999] truncate max-w-[90px]">
              {userName}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="text-[#666666] hover:text-gray-300 transition-colors"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
            </button>
            <button
              onClick={logout}
              className="text-[#666666] hover:text-red-400 transition-colors"
              title="Logout"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
