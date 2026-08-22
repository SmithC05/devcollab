import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Search, Bell, Navigation } from 'lucide-react';

const PRIORITY_OPTIONS = ['P0 Urgent', 'P1 High', 'P2 Normal'];
const MEMBER_OPTIONS   = ['adhi (MEMBER)', 'libin (ADMIN)', 'priya (MEMBER)', 'rahul (MEMBER)'];
const DUE_OPTIONS      = ['Today', 'Tomorrow', 'This week', 'Next week', 'No date'];

export default function ProjectOverviewPage() {
  const { projectId } = useParams();
  const [priority,  setPriority]  = useState('P1 High');
  const [assignee,  setAssignee]  = useState('adhi (MEMBER)');
  const [due,       setDue]       = useState('Tomorrow');
  const [taskTitle, setTaskTitle] = useState('');

  const projectName = projectId || 'P1';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0e0e10', color: '#f5f5f5', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ── Top Header Bar ── */}
      <div style={{
        height: '48px', borderBottom: '1px solid #1a1a1e',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', flexShrink: 0, background: '#0e0e10',
      }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
          <span style={{ color: '#555', fontWeight: 500 }}>MNB</span>
          <span style={{ color: '#333' }}>/</span>
          <span style={{ color: '#e5e5e5', fontWeight: 600 }}>{projectName}</span>
        </div>

        {/* Right actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '5px 12px', borderRadius: '999px',
            border: '1px solid #2a2a2e', background: '#141416',
            color: '#888', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
          }}>
            <Search size={12} />
            <span>⌘K</span>
          </button>
          <button style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', color: '#888', display: 'flex', alignItems: 'center' }}>
            <Bell size={15} />
            <span style={{
              position: 'absolute', top: '-2px', right: '-2px',
              width: '6px', height: '6px', borderRadius: '50%',
              background: '#ef4444', border: '1px solid #0e0e10',
            }} />
          </button>
        </div>
      </div>

      {/* ── Scrollable Content ── */}
      <div style={{ flex: 1, overflow: 'auto', padding: '32px 36px' }}>

        {/* Project Space Label */}
        <p style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#555', marginBottom: '10px' }}>
          PROJECT SPACE · ADMIN WORKSPACE
        </p>

        {/* Project Name + Action Buttons Row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
          <h1 style={{ fontSize: '42px', fontWeight: 700, color: '#f5f5f5', lineHeight: 1, letterSpacing: '-0.02em', margin: 0 }}>
            {projectName}
          </h1>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', paddingTop: '4px', flexShrink: 0 }}>
            <button style={{
              padding: '8px 18px', borderRadius: '7px', fontSize: '13px', fontWeight: 600,
              border: '1px solid #2a2a2e', background: 'transparent', color: '#e5e5e5', cursor: 'pointer',
            }}
              className="hover:bg-[#1a1a1e]"
            >
              Open Board
            </button>
            <button style={{
              padding: '8px 18px', borderRadius: '7px', fontSize: '13px', fontWeight: 600,
              border: '1px solid #2a2a2e', background: 'transparent', color: '#e5e5e5', cursor: 'pointer',
            }}
              className="hover:bg-[#1a1a1e]"
            >
              Manage Team
            </button>
          </div>
        </div>

        {/* Description */}
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '32px', lineHeight: 1.6, maxWidth: '580px' }}>
          Monitor project health, track velocity metrics, balance team workloads, and dispatch critical tasks.
        </p>

        {/* Divider */}
        <div style={{ borderTop: '1px solid #1a1a1e', marginBottom: '28px' }} />

        {/* Stats Row */}
        <div style={{ display: 'flex', gap: '60px', marginBottom: '36px' }}>
          {[
            { value: '0%',  label: 'Sprint Completion Rate' },
            { value: '2',   label: 'Active Contributors' },
            { value: '1',   label: 'Total Project Tasks' },
          ].map(({ value, label }) => (
            <div key={label}>
              <div style={{ fontSize: '30px', fontWeight: 700, color: '#f5f5f5', letterSpacing: '-0.02em', lineHeight: 1 }}>
                {value}
              </div>
              <div style={{ fontSize: '13px', color: '#666', marginTop: '6px', fontWeight: 500 }}>
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid #1a1a1e', marginBottom: '28px' }} />

        {/* Work Dispatcher Card */}
        <div style={{
          background: '#141416', border: '1px solid #1f1f24', borderRadius: '10px',
          padding: '24px 28px', maxWidth: '760px', position: 'relative',
        }}>
          {/* Card Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div>
              <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#555', marginBottom: '6px', margin: '0 0 5px 0' }}>
                WORK DISPATCHER
              </p>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#f5f5f5', margin: 0, letterSpacing: '-0.01em' }}>
                Task Assignment Center
              </h2>
              <p style={{ fontSize: '13px', color: '#666', marginTop: '6px', lineHeight: 1.5 }}>
                Create new tasks, assign them directly to project members, set priorities and due dates, and dispatch work instantly.
              </p>
            </div>
            {/* Live badge */}
            <span style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '5px 11px', borderRadius: '6px',
              border: '1px solid #2a2a2e', background: '#1a1a1e',
              fontSize: '12px', fontWeight: 600, color: '#aaa', flexShrink: 0,
              marginTop: '4px',
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80', flexShrink: 0 }} />
              Live Dispatcher Ready
            </span>
          </div>

          {/* Form Row */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '18px' }}>
            {/* Task Title */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#555' }}>
                TASK TITLE / DESCRIPTION *
              </label>
              <input
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="e.g., Implement OAuth2 authentication flow..."
                style={{
                  background: '#0e0e10', border: '1px solid #242428', borderRadius: '7px',
                  padding: '9px 13px', fontSize: '14px', color: '#e5e5e5',
                  outline: 'none', width: '100%', boxSizing: 'border-box',
                  fontFamily: 'inherit',
                }}
                className="task-input"
              />
            </div>

            {/* Assign to Member */}
            <div style={{ minWidth: '140px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#555' }}>
                ASSIGN TO MEMBER
              </label>
              <select
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                style={{
                  background: '#0e0e10', border: '1px solid #242428', borderRadius: '7px',
                  padding: '9px 10px', fontSize: '14px', color: '#e5e5e5',
                  outline: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  appearance: 'auto',
                }}
              >
                {MEMBER_OPTIONS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            {/* Due Date */}
            <div style={{ minWidth: '120px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#555' }}>
                DUE DATE TARGET
              </label>
              <select
                value={due}
                onChange={(e) => setDue(e.target.value)}
                style={{
                  background: '#0e0e10', border: '1px solid #242428', borderRadius: '7px',
                  padding: '9px 10px', fontSize: '14px', color: '#e5e5e5',
                  outline: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  appearance: 'auto',
                }}
              >
                {DUE_OPTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          {/* Priority + Dispatch Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Priority Pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', color: '#555', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                PRIORITY:
              </span>
              {PRIORITY_OPTIONS.map((p) => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  style={{
                    padding: '5px 13px', borderRadius: '999px', fontSize: '12px', fontWeight: 500,
                    border: priority === p ? '1px solid #555' : '1px solid #2a2a2e',
                    background: priority === p ? '#2a2a2e' : 'transparent',
                    color: priority === p ? '#f5f5f5' : '#666',
                    cursor: 'pointer', transition: 'all 120ms',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Dispatch Button */}
            <button style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 22px', borderRadius: '8px',
              background: '#f5f5f5', color: '#0e0e10',
              fontSize: '14px', fontWeight: 700,
              border: 'none', cursor: 'pointer', letterSpacing: '-0.01em',
            }}
              className="hover:bg-[#ddd]"
            >
              <Navigation size={14} strokeWidth={2.5} />
              Assign & Dispatch Task
            </button>
          </div>
        </div>
      </div>

      {/* Floating + Button */}
      <button style={{
        position: 'fixed', bottom: '24px', right: '28px',
        width: '44px', height: '44px', borderRadius: '50%',
        background: '#f5f5f5', color: '#0e0e10',
        border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '22px', fontWeight: 300, lineHeight: 1,
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
      }}>
        +
      </button>
    </div>
  );
}
