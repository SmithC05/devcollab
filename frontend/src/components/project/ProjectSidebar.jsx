import { NavLink, useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  LayoutDashboard, Columns3, Activity, Users,
  BookOpen, Code2, FileCode2, MessageSquare, Sparkles, ChevronLeft, ChevronRight, Settings,
  BarChart2, ListTodo, PieChart, Clock, ArrowLeft,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../stores/authStore';

const NAV_OWNER = [
  {
    label: 'PROJECT',
    items: [
      { name: 'Project Overview', path: 'overview', icon: LayoutDashboard },
      { name: 'Board',            path: 'board',    icon: Columns3 },
      { name: 'Activity',         path: 'activity', icon: Activity },
      { name: 'Team',             path: 'members',  icon: Users },
    ],
  },
  {
    label: 'KNOWLEDGE',
    items: [
      { name: 'Wiki',     path: 'wiki',     icon: BookOpen },
      { name: 'Snippets', path: 'snippets', icon: Code2 },
    ],
  },
  {
    label: 'DEVELOPMENT',
    items: [
      { name: 'Editor',   path: 'editor',   icon: FileCode2 },
    ],
  },
  {
    label: 'AI',
    items: [
      { name: 'AI Assistant', path: 'ai',   icon: Sparkles },
    ],
  },
  {
    label: 'SETTINGS',
    items: [
      { name: 'Project Settings', path: 'settings', icon: Settings },
    ],
  },
];

const NAV_ADMIN = [
  {
    label: 'PROJECT CONTROL',
    items: [
      { name: 'Executive Overview', path: 'overview', icon: LayoutDashboard },
      { name: 'Sprint Analytics',   path: 'sprint',   icon: BarChart2 },
      { name: 'Board',              path: 'board',    icon: Columns3 },
      { name: 'Activity',           path: 'activity', icon: Activity },
      { name: 'Workload',           path: 'workload', icon: PieChart },
      { name: 'Members',            path: 'members',  icon: Users },
    ],
  },
  {
    label: 'KNOWLEDGE & DEV',
    items: [
      { name: 'Wiki',     path: 'wiki',     icon: BookOpen },
      { name: 'Snippets', path: 'snippets', icon: Code2 },
      { name: 'Editor',   path: 'editor',   icon: FileCode2 },
    ],
  },
  {
    label: 'TEAM',
    items: [
      { name: 'Chat',         path: 'chat', icon: MessageSquare },
      { name: 'AI Assistant', path: 'ai',   icon: Sparkles },
    ],
  },
  {
    label: 'MANAGEMENT',
    items: [
      { name: 'Project Settings', path: 'settings', icon: Settings },
    ],
  },
];

const NAV_LEAD = [
  {
    label: 'TEAM OVERVIEW',
    items: [
      { name: 'My Team',  path: 'myteam',   icon: Users },
      { name: 'Board',    path: 'board',    icon: Columns3 },
      { name: 'Sprint',   path: 'sprint',   icon: Clock },
      { name: 'Activity', path: 'activity', icon: Activity },
      { name: 'Workload', path: 'workload', icon: PieChart },
    ],
  },
  {
    label: 'DEVELOPMENT',
    items: [
      { name: 'Wiki',     path: 'wiki',     icon: BookOpen },
      { name: 'Snippets', path: 'snippets', icon: Code2 },
      { name: 'Editor',   path: 'editor',   icon: FileCode2 },
    ],
  },
  {
    label: 'COLLABORATION',
    items: [
      { name: 'Chat',         path: 'chat', icon: MessageSquare },
      { name: 'AI Assistant', path: 'ai',   icon: Sparkles },
    ],
  },
];

const NAV_DEV = [
  {
    label: 'MY WORK',
    items: [
      { name: 'My Dashboard', path: 'overview', icon: LayoutDashboard },
      { name: 'My Tasks',     path: 'mytasks',  icon: ListTodo },
      { name: 'Board',        path: 'board',    icon: Columns3 },
      { name: 'Activity',     path: 'activity', icon: Activity },
    ],
  },
  {
    label: 'DEVELOPMENT',
    items: [
      { name: 'Editor',   path: 'editor',   icon: FileCode2 },
      { name: 'Snippets', path: 'snippets', icon: Code2 },
      { name: 'Wiki',     path: 'wiki',     icon: BookOpen },
    ],
  },
  {
    label: 'COLLABORATION',
    items: [
      { name: 'Chat',         path: 'chat', icon: MessageSquare },
      { name: 'AI Assistant', path: 'ai',   icon: Sparkles },
    ],
  },
];

export default function ProjectSidebar({ project: passedProject }) {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { role, setRole, user } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  const project = passedProject || { id: projectId || 'P1', name: projectId || 'P1', avatar: 'DC' };

  const safeRole = activeWorkspace?.role || 'DEVELOPER';
  let navConfig = NAV_DEV;
  if (safeRole === 'OWNER') navConfig = NAV_OWNER;
  if (safeRole === 'ADMIN') navConfig = NAV_ADMIN;
  if (safeRole === 'LEAD')  navConfig = NAV_LEAD;
  if (safeRole === 'DEVELOPER') navConfig = NAV_DEV;

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 290, minWidth: collapsed ? 72 : 290, maxWidth: collapsed ? 72 : 290 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      style={{
        flexShrink: 0,
        height: '100vh', display: 'flex', flexDirection: 'column',
        background: 'var(--bg)', borderRight: '1px solid var(--border-subtle)',
        overflowY: 'auto', overflowX: 'hidden', userSelect: 'none',
      }}
    >
      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: collapsed ? '14px 0 12px' : '14px 12px 12px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        borderBottom: '1px solid var(--surface-hover)',
        flexShrink: 0, position: 'relative',
      }}>
        {/* DC Logo — always visible */}
        <div className="w-[32px] h-[32px] rounded-[8px] bg-[var(--text-primary)] text-[var(--bg)] flex items-center justify-center text-[13px] font-bold shrink-0">
          DC
        </div>

        {!collapsed && (
          <>
            <span style={{
              color: 'var(--text-primary)', fontWeight: 600, fontSize: '15px',
              flex: 1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
            }}>
              {project.name}
            </span>

            <span style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '3px 9px', borderRadius: '999px',
              border: '1px solid var(--border-strong)', background: 'var(--surface-hover)',
              fontSize: '11px', fontWeight: 600, color: '#aaa',
              whiteSpace: 'nowrap', flexShrink: 0,
            }}>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#4ade80' }} />
              Active
            </span>
          </>
        )}

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', color: 'var(--focus-ring)',
            display: 'flex', alignItems: 'center', padding: '3px', borderRadius: '5px', flexShrink: 0,
            ...(collapsed ? {
              position: 'absolute', right: '-12px',
              background: 'var(--surface-raised)', border: '1px solid var(--border-strong)',
              borderRadius: '50%', width: '24px', height: '24px',
              justifyContent: 'center', padding: 0, zIndex: 10,
            } : {}),
          }}
        >
          {collapsed ? <ChevronRight size={14} strokeWidth={2.5} /> : <ChevronLeft size={14} strokeWidth={2.5} />}
        </button>
      </div>

      {/* ── Back to Workspace — always present, all roles ──────── */}
      <div style={{ padding: collapsed ? '10px 0 4px' : '10px 10px 4px' }}>
        <button
          id="sidebar-back-to-workspace"
          onClick={() => navigate('/dashboard/projects')}
          title="Back to Projects"
          style={{
            width: '100%', display: 'flex', alignItems: 'center',
            gap: '9px', height: '34px',
            padding: collapsed ? '0' : '0 10px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            background: 'none', border: 'none', cursor: 'pointer',
            borderRadius: '8px',
            color: 'var(--text-muted)', fontSize: '12px', fontWeight: 500,
            transition: 'background 120ms, color 120ms',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-item)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          <ArrowLeft size={14} strokeWidth={2} style={{ flexShrink: 0 }} />
          {!collapsed && <span>Back to Projects</span>}
        </button>
      </div>

      {/* ── Nav ────────────────────────────────────────────────── */}
      <div style={{ flex: 1, padding: '6px 10px 14px', display: 'flex', flexDirection: 'column', gap: '22px', overflowY: 'auto' }}>
        {navConfig.map((section, sectionIdx) => (
          <div key={section.label} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {!collapsed && (
              <div className="px-2 mb-2 mt-2">
                <span className="text-[11px] font-semibold text-[var(--text-muted)] tracking-wider uppercase">
                  {section.label}
                </span>
              </div>
            )}
            {collapsed && sectionIdx > 0 && (
              <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '12px 4px' }} />
            )}
            {section.items.map(({ name, path, icon: Icon }) => (
              <NavLink
                key={path}
                to={`/projects/${project.id}/${path}`}
                className={({ isActive }) => `
                  flex items-center h-[36px] rounded-[8px] transition-colors duration-150 relative group outline-none
                  ${collapsed ? 'justify-center w-[36px] mx-auto' : 'px-3 w-full gap-2.5'}
                  ${isActive 
                    ? 'bg-[var(--surface-item)] text-[var(--text-primary)] font-medium shadow-sm border border-[var(--border-subtle)]' 
                    : 'text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] border border-transparent'}
                `}
                title={collapsed ? name : undefined}
              >
                <span className="flex items-center justify-center shrink-0">
                  <Icon size={16} strokeWidth={1.75} />
                </span>
                {!collapsed && <span className="text-[13px] truncate">{name}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </div>

      {/* ── Footer / Role Switcher ─────────────────────────────── */}
      <div style={{
        borderTop: '1px solid var(--surface-hover)',
        padding: collapsed ? '14px 0' : '14px',
        display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'flex-start',
        gap: '10px', flexShrink: 0,
      }}>
        <div style={{
          width: '34px', height: '34px', borderRadius: '50%',
          background: 'var(--surface-hover)', border: '1px solid var(--border-strong)', color: 'var(--text-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: '14px', flexShrink: 0,
        }}>
          {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
        </div>
        {!collapsed && (
          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name || 'User'}</span>
            <select
              value={safeRole}
              onChange={(e) => setRole(e.target.value)}
              style={{
                fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px',
                background: 'transparent', border: '1px solid var(--border-strong)',
                borderRadius: '4px', padding: '2px', outline: 'none', cursor: 'pointer', width: '100%',
              }}
            >
              {ROLES.map(r => (
                <option key={r} value={r} style={{ background: 'var(--surface-raised)', color: 'var(--text-primary)' }}>
                  Role: {r}
                </option>
              ))}
            </select>
          </div>
        </button>
      </div>
    </motion.aside>
  );
}
