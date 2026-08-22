import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, Bell, Navigation } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

import { useMemberStore } from '../../stores/memberStore';

const PRIORITY_OPTIONS = ['P0 Urgent', 'P1 High', 'P2 Normal'];
const DUE_OPTIONS      = ['Today', 'Tomorrow', 'This week', 'Next week', 'No date'];

function TopHeader({ projectName }) {
  return (
    <div style={{
      height: '48px', borderBottom: '1px solid #1a1a1e',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px', flexShrink: 0, background: '#0e0e10',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
        <span style={{ color: '#555', fontWeight: 500 }}>MNB</span>
        <span style={{ color: '#333' }}>/</span>
        <span style={{ color: '#e5e5e5', fontWeight: 600 }}>{projectName}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '5px 12px', borderRadius: '999px',
          border: '1px solid #2a2a2e', background: '#141416',
          color: '#888', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
        }}>
          <Search size={12} /><span>⌘K</span>
        </button>
        <button style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', color: '#888', display: 'flex', alignItems: 'center' }}>
          <Bell size={15} />
          <span style={{ position: 'absolute', top: '-2px', right: '-2px', width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444', border: '1px solid #0e0e10' }} />
        </button>
      </div>
    </div>
  );
}

function WorkDispatcher() {
  const { members } = useMemberStore();
  const MEMBER_OPTIONS = members.length > 0 ? members.map(m => `${m.name} (${(m.role || 'MEMBER').toUpperCase()})`) : ['Unassigned'];

  const [priority, setPriority] = useState('P1 High');
  const [assignee, setAssignee] = useState(MEMBER_OPTIONS[0]);
  const [due, setDue] = useState('Tomorrow');
  const [taskTitle, setTaskTitle] = useState('');

  return (
    <div style={{
      background: '#141416', border: '1px solid #1f1f24', borderRadius: '10px',
      padding: '24px 28px', maxWidth: '760px', position: 'relative', marginTop: '36px'
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '18px' }}>
        <div>
          <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#555', margin: '0 0 5px 0' }}>WORK DISPATCHER</p>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#f5f5f5', margin: 0, letterSpacing: '-0.01em' }}>Task Assignment Center</h2>
        </div>
        <span style={{
          display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 11px', borderRadius: '6px',
          border: '1px solid #2a2a2e', background: '#1a1a1e', fontSize: '12px', fontWeight: 600, color: '#aaa', flexShrink: 0, marginTop: '4px',
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80', flexShrink: 0 }} />
          Live
        </span>
      </div>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '18px' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', color: '#555' }}>TITLE</label>
          <input value={taskTitle} onChange={e => setTaskTitle(e.target.value)} placeholder="Task title..." style={{ background: '#0e0e10', border: '1px solid #242428', borderRadius: '7px', padding: '9px 13px', fontSize: '14px', color: '#e5e5e5', outline: 'none', width: '100%' }} />
        </div>
        <div style={{ minWidth: '140px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', color: '#555' }}>ASSIGNEE</label>
          <select value={assignee} onChange={e => setAssignee(e.target.value)} style={{ background: '#0e0e10', border: '1px solid #242428', borderRadius: '7px', padding: '9px 10px', fontSize: '14px', color: '#e5e5e5', outline: 'none', cursor: 'pointer' }}>
            {MEMBER_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div style={{ minWidth: '120px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', color: '#555' }}>DUE</label>
          <select value={due} onChange={e => setDue(e.target.value)} style={{ background: '#0e0e10', border: '1px solid #242428', borderRadius: '7px', padding: '9px 10px', fontSize: '14px', color: '#e5e5e5', outline: 'none', cursor: 'pointer' }}>
            {DUE_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: '#555', fontWeight: 600 }}>PRIORITY:</span>
          {PRIORITY_OPTIONS.map(p => (
            <button key={p} onClick={() => setPriority(p)} style={{ padding: '5px 13px', borderRadius: '999px', fontSize: '12px', fontWeight: 500, border: priority === p ? '1px solid #555' : '1px solid #2a2a2e', background: priority === p ? '#2a2a2e' : 'transparent', color: priority === p ? '#f5f5f5' : '#666', cursor: 'pointer' }}>
              {p}
            </button>
          ))}
        </div>
        <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 22px', borderRadius: '8px', background: '#f5f5f5', color: '#0e0e10', fontSize: '14px', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
          <Navigation size={14} strokeWidth={2.5} /> Dispatch
        </button>
      </div>
    </div>
  );
}

function StatRow({ stats }) {
  return (
    <div style={{ display: 'flex', gap: '60px', marginBottom: '36px' }}>
      {stats.map(({ value, label }) => (
        <div key={label}>
          <div style={{ fontSize: '30px', fontWeight: 700, color: '#f5f5f5', letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</div>
          <div style={{ fontSize: '13px', color: '#666', marginTop: '6px', fontWeight: 500 }}>{label}</div>
        </div>
      ))}
    </div>
  );
}

function PageHeader({ title, subtitle, navigate, projectId, showManageTeam }) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
        <h1 style={{ fontSize: '42px', fontWeight: 700, color: '#f5f5f5', lineHeight: 1, letterSpacing: '-0.02em', margin: 0 }}>{title}</h1>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', paddingTop: '4px' }}>
          <button onClick={() => navigate(`/projects/${projectId}/board`)} style={{ padding: '8px 18px', borderRadius: '7px', fontSize: '13px', fontWeight: 600, border: '1px solid #2a2a2e', background: 'transparent', color: '#e5e5e5', cursor: 'pointer' }}>Open Board</button>
          {showManageTeam && (
            <button onClick={() => navigate(`/projects/${projectId}/members`)} style={{ padding: '8px 18px', borderRadius: '7px', fontSize: '13px', fontWeight: 600, border: '1px solid #2a2a2e', background: 'transparent', color: '#e5e5e5', cursor: 'pointer' }}>Manage Team</button>
          )}
        </div>
      </div>
      <p style={{ fontSize: '14px', color: '#666', marginBottom: '32px', lineHeight: 1.6, maxWidth: '580px' }}>{subtitle}</p>
      <div style={{ borderTop: '1px solid #1a1a1e', marginBottom: '28px' }} />
    </>
  );
}

function OwnerOverview({ projectId }) {
  const navigate = useNavigate();
  const columns = useTaskStore(state => state.columns);
  const tasks = Object.values(columns).flat();
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.columnId === 'done').length;
  const health = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) + '%' : '100%';
  const activeTasks = tasks.filter(t => t.columnId === 'inprogress' || t.columnId === 'inreview').length;
  const blockedTasks = tasks.filter(t => t.labels && (t.labels.includes('blocked') || t.labels.includes('bug'))).length;

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '32px 36px' }}>
      <p style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.12em', color: '#555', marginBottom: '10px' }}>OWNER VIEW</p>
      <PageHeader title={projectId} subtitle="Strategic project health and ownership metrics." navigate={navigate} projectId={projectId} showManageTeam={true} />
      <StatRow stats={[ { value: health, label: 'Project Health' }, { value: activeTasks.toString(), label: 'Active Tasks' }, { value: blockedTasks.toString(), label: 'Critical Blockers' } ]} />
    </div>
  );
}

function AdminOverview({ projectId }) {
  const navigate = useNavigate();
  const columns = useTaskStore(state => state.columns);
  const tasks = Object.values(columns).flat();
  const members = useMemberStore(state => state.members);

  const totalPoints = tasks.length * 5; // Simplified velocity approximation
  const overdueTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.columnId !== 'done').length;
  const activeMembers = new Set(tasks.map(t => t.assignee).filter(Boolean)).size;
  const util = members.length > 0 ? Math.round((activeMembers / members.length) * 100) + '%' : '0%';

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '32px 36px' }}>
      <p style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.12em', color: '#555', marginBottom: '10px' }}>ADMIN OPERATIONS</p>
      <PageHeader title="Executive Overview" subtitle="Deep operational management, velocity tracking, and team capacity." navigate={navigate} projectId={projectId} showManageTeam={true} />
      <StatRow stats={[ { value: totalPoints.toString(), label: 'Velocity Points' }, { value: overdueTasks.toString(), label: 'Overdue Tasks' }, { value: util, label: 'Team Utilization' } ]} />
      <div style={{ borderTop: '1px solid #1a1a1e', marginBottom: '28px' }} />
      <WorkDispatcher />
    </div>
  );
}

function LeadOverview({ projectId }) {
  const navigate = useNavigate();
  const columns = useTaskStore(state => state.columns);
  const tasks = Object.values(columns).flat();
  const members = useMemberStore(state => state.members);

  const teamMembers = members.length;
  const remainingTasks = tasks.filter(t => t.columnId !== 'done').length;
  const blockedItems = tasks.filter(t => t.labels && (t.labels.includes('blocked') || t.labels.includes('bug'))).length;

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '32px 36px' }}>
      <p style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.12em', color: '#555', marginBottom: '10px' }}>TEAM LEAD</p>
      <PageHeader title="Team Coordination" subtitle="Manage your team's sprint progress and clear blockers." navigate={navigate} projectId={projectId} showManageTeam={false} />
      <StatRow stats={[ { value: teamMembers.toString(), label: 'Team Members' }, { value: remainingTasks.toString(), label: 'Sprint Tasks Remaining' }, { value: blockedItems.toString(), label: 'Blocked Items' } ]} />
      <div style={{ borderTop: '1px solid #1a1a1e', marginBottom: '28px' }} />
      <WorkDispatcher />
    </div>
  );
}

function DevOverview({ projectId }) {
  const navigate = useNavigate();
  const columns = useTaskStore(state => state.columns);
  const tasks = Object.values(columns).flat();
  
  // Simulating the Dev user as "Arjun"
  const myTasks = tasks.filter(t => t.assignee === 'Arjun');
  const myActive = myTasks.filter(t => t.columnId !== 'done').length;
  const todayStr = new Date().toDateString();
  const myDueToday = myTasks.filter(t => t.dueDate && new Date(t.dueDate).toDateString() === todayStr && t.columnId !== 'done').length;
  const myBlockers = myTasks.filter(t => t.labels && (t.labels.includes('blocked') || t.labels.includes('bug'))).length;

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '32px 36px' }}>
      <p style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.12em', color: '#555', marginBottom: '10px' }}>DEVELOPER SPACE</p>
      <PageHeader title="My Dashboard" subtitle="Your active assignments, upcoming deadlines, and personal blockers." navigate={navigate} projectId={projectId} showManageTeam={false} />
      <StatRow stats={[ { value: myActive.toString(), label: 'My Active Tasks' }, { value: myDueToday.toString(), label: 'Due Today' }, { value: myBlockers.toString(), label: 'My Blockers' } ]} />
      <div style={{ borderTop: '1px solid #1a1a1e', marginBottom: '28px' }} />
      <div style={{ background: '#141416', border: '1px solid #1f1f24', borderRadius: '10px', padding: '32px', textAlign: 'center' }}>
        <p style={{ color: '#888', fontSize: '14px' }}>Review your personalized task list in the "My Tasks" section to start working.</p>
      </div>
    </div>
  );
}

// Viewer overview has been removed

export default function ProjectOverviewPage() {
  const { projectId } = useParams();
  const { role } = useAuthStore();
  const safeRole = role || 'Dev';
  const projectName = projectId || 'P1';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0e0e10', color: '#f5f5f5', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <TopHeader projectName={projectName} />
      {safeRole === 'Owner' && <OwnerOverview projectId={projectName} />}
      {safeRole === 'Admin' && <AdminOverview projectId={projectName} />}
      {safeRole === 'Lead' && <LeadOverview projectId={projectName} />}
      {safeRole === 'Dev' && <DevOverview projectId={projectName} />}
    </div>
  );
}
