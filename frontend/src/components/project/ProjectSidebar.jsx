import { NavLink, useParams } from 'react-router-dom';
import {
  LayoutDashboard, Columns3, Activity, Users,
  BookOpen, Code2, FileCode2, MessageSquare, Sparkles, ChevronLeft, Settings,
  BarChart2, ListTodo, Presentation, Clock, PieChart
} from 'lucide-react';
import { useAuthStore, ROLES } from '../../store/authStore';

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

// Viewer role has been removed

export default function ProjectSidebar() {
  const { projectId } = useParams();
  const { role, setRole, can } = useAuthStore();
  const project = { id: projectId || 'P1', name: projectId || 'P1', avatar: (projectId || 'P')[0].toUpperCase() };

  const safeRole = role || 'Dev';
  let navConfig = NAV_DEV;
  if (safeRole === 'Owner') navConfig = NAV_OWNER;
  if (safeRole === 'Admin') navConfig = NAV_ADMIN;
  if (safeRole === 'Lead')  navConfig = NAV_LEAD;
  if (safeRole === 'Dev')   navConfig = NAV_DEV;

  return (
    <aside style={{
      width: '290px', minWidth: '290px', maxWidth: '290px', flexShrink: 0,
      height: '100vh', display: 'flex', flexDirection: 'column',
      background: '#0e0e0e', borderRight: '1px solid #1e1e1e',
      overflowY: 'auto', overflowX: 'hidden', userSelect: 'none',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '16px 14px 14px', borderBottom: '1px solid #1a1a1a', flexShrink: 0 }}>
        <div style={{
          width: '34px', height: '34px', borderRadius: '50%',
          background: '#1e1e1e', border: '1px solid #2a2a2e', color: '#f5f5f5',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: '14px', flexShrink: 0,
        }}>
          {project.avatar}
        </div>

        <span style={{ color: '#f5f5f5', fontWeight: 600, fontSize: '15px', flex: 1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
          {project.name}
        </span>

        <span style={{
          display: 'flex', alignItems: 'center', gap: '5px',
          padding: '3px 9px', borderRadius: '999px',
          border: '1px solid #333', background: '#1a1a1a',
          fontSize: '11px', fontWeight: 600, color: '#aaa',
          whiteSpace: 'nowrap', flexShrink: 0,
        }}>
          <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#ccc' }} />
          Active
        </span>

        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#444', display: 'flex', alignItems: 'center', padding: '3px', borderRadius: '5px', flexShrink: 0 }}>
          <ChevronLeft size={14} strokeWidth={2.5} />
        </button>
      </div>

      {/* Nav */}
      <div style={{ flex: 1, padding: '14px 10px', display: 'flex', flexDirection: 'column', gap: '22px', overflowY: 'auto' }}>
        {navConfig.map((section) => (
          <div key={section.label} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: '#3a3a3a', margin: '0 0 6px 6px' }}>
              {section.label}
            </p>
            {section.items.map(({ name, path, icon: Icon }) => (
              <NavLink
                key={path}
                to={`/projects/${project.id}/${path}`}
                style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: '11px',
                  height: '38px', padding: '0 10px', borderRadius: '8px',
                  fontSize: '14px', fontWeight: isActive ? 500 : 400,
                  color: isActive ? '#f5f5f5' : '#666',
                  background: isActive ? '#1c1c1c' : 'transparent',
                  textDecoration: 'none', transition: 'background 120ms, color 120ms',
                  overflow: 'hidden', whiteSpace: 'nowrap',
                })}
                className="sidebar-navitem"
              >
                <span style={{ width: '18px', minWidth: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={16} strokeWidth={1.75} />
                </span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </div>

      {/* Footer / Role Switcher */}
      <div style={{ borderTop: '1px solid #1a1a1a', padding: '14px', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        <div style={{
          width: '34px', height: '34px', borderRadius: '50%',
          background: '#1e1e1e', border: '1px solid #2a2a2a', color: '#f5f5f5',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: '14px', flexShrink: 0,
        }}>
          D
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#e5e5e5', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Demo User</span>
          <select 
            value={safeRole}
            onChange={(e) => setRole(e.target.value)}
            style={{ 
              fontSize: '11px', color: '#888', marginTop: '2px', background: 'transparent', 
              border: '1px solid #333', borderRadius: '4px', padding: '2px', outline: 'none',
              cursor: 'pointer', width: '100%'
            }}
          >
            {ROLES.map(r => (
              <option key={r} value={r} style={{ background: '#111', color: '#fff' }}>Role: {r}</option>
            ))}
          </select>
        </div>
      </div>
    </aside>
  );
}
