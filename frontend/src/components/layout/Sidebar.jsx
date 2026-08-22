import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Folder,
  Activity,
  Users,
  CreditCard,
  Settings,
  Sparkles
} from 'lucide-react';
import clsx from 'clsx';

export default function Sidebar({ workspaceName }) {
  const navItemClass = ({ isActive }) =>
    clsx(
      'flex items-center gap-[10px] h-[36px] px-[10px] rounded-[6px] text-[13px] leading-[1.4] transition-colors mb-0.5',
      isActive
        ? 'text-white bg-[#1A1A1A] font-semibold'
        : 'text-[#888888] hover:text-gray-200 hover:bg-[#151515] font-medium'
    );

  return (
    <aside
      className="fixed top-0 left-0 bottom-0 flex flex-col z-30
                 border-r border-[#1F1F1F]
                 bg-[#0D0D0D]"
      style={{ width: '220px', minWidth: '220px', maxWidth: '220px' }}
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
            <NavLink to="/" end className={navItemClass}>
              <LayoutDashboard size={17} />
              Overview
            </NavLink>
            <NavLink to="/projects" className={navItemClass}>
              <Folder size={17} />
              Projects
            </NavLink>
            <NavLink to="/activity" className={navItemClass}>
              <Activity size={17} />
              Activity
            </NavLink>
            <NavLink to="/members" className={navItemClass}>
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
            <NavLink to="/billing" className={navItemClass}>
              <CreditCard size={17} />
              Billing
            </NavLink>
            <NavLink to="/settings" className={navItemClass}>
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
            <NavLink to="/ai" className={navItemClass}>
              <Sparkles size={17} />
              AI Assistant
            </NavLink>
          </nav>
        </div>
      </div>

      {/* User Area (Pinned to bottom) */}
      <div className="mt-auto h-[52px] px-4 flex items-center gap-3 border-t border-[#1F1F1F] shrink-0 hover:bg-[#151515] transition-colors cursor-pointer">
        <div className="w-[28px] h-[28px] rounded-full bg-[#2A2A2A] text-[#888888] flex items-center justify-center font-medium text-[12px] shrink-0">
          d
        </div>
        <span className="text-[13px] font-medium text-[#999999] truncate">
          dev collab
        </span>
      </div>
    </aside>
  );
}
