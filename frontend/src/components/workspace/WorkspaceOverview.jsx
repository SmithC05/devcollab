import { useState, useEffect } from 'react';
import { Sparkles, Plus, CheckCircle2, ArrowRight, Circle, Check, Bell } from 'lucide-react';
import { apiClient } from '../../api/client';
import TasksCompletedChart from '../dashboard/TasksCompletedChart';
import StatusDistribution from '../dashboard/StatusDistribution';
import PageContainer from '../layout/PageContainer';
import { useAuthStore } from '../../stores/authStore';
import { workspaceApi } from '../../api/workspaceApi';
import { useNavigate } from 'react-router-dom';

// BUG-15: setWorkspaceName prop removed; workspace name now read from store
export default function WorkspaceOverview() {
  const { activeWorkspace } = useAuthStore();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!activeWorkspace?.id) return;
    const fetchData = async () => {
      try {
        const data = await apiClient('/workspace/overview/');
        setData(data);

      } catch (err) {
        console.error('Error fetching workspace data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeWorkspace?.id]);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center py-32">
        <span className="text-[13px] text-[var(--text-muted)]">Loading workspace...</span>
      </div>
    );
  }

  return (
    <PageContainer>
      <div className="flex flex-col" style={{ gap: '40px' }}>

        {/* ── HEADER ─────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between flex-wrap gap-6">
          <div style={{ minWidth: 0 }}>
            {/* Workspace label */}
            <p style={{
              fontSize: '10px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              color: 'var(--text-muted)',
              marginBottom: '10px'
            }}>
              {data?.workspace_name || 'WORKSPACE'}
            </p>

            {/* Main heading */}
            <h1 style={{
              fontSize: '44px',
              fontWeight: 600,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
              marginBottom: '10px'
            }}>
              {getGreeting()}, {data?.user_name || 'User'}
            </h1>

            {/* Project count */}
            <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
              {data?.total_projects === 1 ? '1 project' : `${data?.total_projects ?? 0} projects`} in this workspace
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 shrink-0" style={{ marginTop: '8px' }}>
            <button 
              onClick={() => navigate('/dashboard/ai')}
              style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              height: '38px', padding: '0 18px',
              border: '1px solid var(--border-strong)', background: 'var(--surface-raised)',
              color: 'var(--text-primary)', borderRadius: '8px',
              fontSize: '13px', fontWeight: 500, cursor: 'pointer',
              transition: 'background 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--surface-raised)'}
            >
              <Sparkles size={14} />
              Ask AI
            </button>
            <button 
              onClick={() => navigate('/dashboard/projects', { state: { openCreateModal: true } })}
              style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              height: '38px', padding: '0 20px',
              background: 'var(--text-primary)', color: 'var(--bg)',
              borderRadius: '8px', border: 'none',
              fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              transition: 'background 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--text-primary)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--text-primary)'}
            >
              <Plus size={15} />
              New Project
            </button>
          </div>
        </div>

        {/* ── STATS ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: '48px' }}>
          {[
            { label: 'Tasks Pending', value: data?.tasks_pending ?? 0 },
            { label: 'Tasks Completed', value: data?.tasks_completed ?? 0 },
            { label: 'Active Projects', value: data?.active_projects_user ?? 0 },
          ].map((stat) => (
            <div key={stat.label}>
              <div style={{
                fontSize: '40px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                lineHeight: 1,
                marginBottom: '10px',
                fontVariantNumeric: 'tabular-nums',
              }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* ── TOP PRIORITY TASKS & MY PROJECTS ────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: '20px' }}>

          {/* Top Priority Tasks */}
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border-default)',
            borderRadius: '12px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            minHeight: '240px',
          }}>
            <div className="flex items-center justify-between" style={{ marginBottom: '20px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Top Priority Tasks
              </h2>
              <button style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                fontSize: '12px', color: 'var(--text-muted)',
                background: 'none', border: 'none', cursor: 'pointer',
                transition: 'color 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                View all <ArrowRight size={12} />
              </button>
            </div>
            <div className="flex-1 flex flex-col" style={{ gap: '10px' }}>
              {data?.top_priority_tasks?.length > 0 ? (
                data.top_priority_tasks.map((task, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-strong)',
                    background: 'var(--surface-hover)',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--focus-ring)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-strong)'}
                  >
                    <div className="flex items-center" style={{ gap: '10px' }}>
                      <div style={{
                        width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                        background: task.status === 'Done' ? '#22C55E' :
                          task.status === 'In Progress' ? '#3B82F6' : 'var(--text-muted)',
                      }} />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{task.title}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{task.status}</div>
                      </div>
                    </div>
                    <span style={{
                      fontSize: '10px', fontWeight: 700, padding: '2px 8px',
                      border: '1px solid var(--border-strong)', borderRadius: '4px',
                      color: 'var(--text-secondary)', background: 'var(--surface-raised)',
                    }}>
                      {task.priority || 'Normal'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center" style={{ padding: '32px', textAlign: 'center', background: 'var(--surface-raised)', borderRadius: '8px', border: '1px dashed var(--border-default)' }}>
                  <CheckCircle2 size={20} style={{ color: 'var(--focus-ring)', marginBottom: '10px' }} />
                  <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>No priority tasks</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>You're all caught up.</p>
                </div>
              )}
            </div>
          </div>

          {/* My Projects */}
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border-default)',
            borderRadius: '12px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            minHeight: '240px',
          }}>
            <div className="flex items-center justify-between" style={{ marginBottom: '20px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>My Projects</h2>
              <button style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                fontSize: '12px', color: 'var(--text-muted)',
                background: 'none', border: 'none', cursor: 'pointer',
                transition: 'color 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                View all <ArrowRight size={12} />
              </button>
            </div>
            <div className="flex-1 flex flex-col" style={{ gap: '10px' }}>
              {data?.my_projects?.length > 0 ? (
                data.my_projects.map((project, i) => (
                  <div key={i} style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-strong)',
                    background: 'var(--surface-hover)',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--focus-ring)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-strong)'}
                  >
                    <div className="flex items-center justify-between" style={{ marginBottom: '8px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {project.name}
                      </div>
                      <span style={{
                        fontSize: '10px', fontWeight: 600,
                        color: project.status === 'Active' ? '#22C55E' : 'var(--text-secondary)',
                        flexShrink: 0, marginLeft: '8px',
                      }}>
                        {project.status}
                      </span>
                    </div>
                    <div className="flex items-center" style={{ gap: '16px', marginBottom: '10px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--text-muted)' }}>
                        <Circle size={10} /> {project.tasks_open} open
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--text-muted)' }}>
                        <Check size={11} /> {project.tasks_completed} done
                      </span>
                    </div>
                    <div className="flex items-center" style={{ gap: '8px' }}>
                      <div style={{ flex: 1, height: '4px', background: 'var(--border-default)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${project.progress}%`, background: '#3B82F6', borderRadius: '2px' }} />
                      </div>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', width: '28px', textAlign: 'right', flexShrink: 0 }}>
                        {project.progress}%
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center" style={{ padding: '32px', textAlign: 'center', background: 'var(--surface-raised)', borderRadius: '8px', border: '1px dashed var(--border-default)' }}>
                  <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>No projects yet</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Create your first project.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── NOTIFICATIONS / RECENT PROJECTS / ACTIVITY ───────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: '20px' }}>
          {/* Notifications */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border-default)', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', minHeight: '180px' }}>
            <div className="flex items-center justify-between" style={{ marginBottom: '20px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>Notifications</h2>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center">
              <div style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid var(--border-strong)', background: 'var(--surface-raised)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px', color: '#22C55E' }}>
                <Bell size={15} />
              </div>
              <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>No notifications</p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>You're all caught up.</p>
            </div>
          </div>

          {/* Recent Projects */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border-default)', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', minHeight: '180px' }}>
            <div className="flex items-center justify-between" style={{ marginBottom: '20px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>Recent Projects</h2>
              <button style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                View all <ArrowRight size={10} />
              </button>
            </div>
            <div className="flex flex-col" style={{ gap: '8px' }}>
              {data?.recent_projects?.length > 0 ? (
                data.recent_projects.map((p, i) => (
                  <div key={i} style={{ padding: '10px 12px', borderRadius: '7px', border: '1px solid var(--border-default)', background: 'var(--surface-raised)', cursor: 'pointer', transition: 'border-color 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-strong)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-default)'}
                  >
                    <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '2px' }}>{p.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{p.tasks_count} tasks</div>
                  </div>
                ))
              ) : (
                <div className="flex-1 flex items-center justify-center" style={{ padding: '16px' }}>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No recent projects</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border-default)', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', minHeight: '180px' }}>
            <div className="flex items-center justify-between" style={{ marginBottom: '20px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>Recent Activity</h2>
              <button style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                View all <ArrowRight size={10} />
              </button>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No recent activity</p>
            </div>
          </div>
        </div>

        {/* ── WORKSPACE ACTIVITY (CHARTS) ──────────────────────────── */}
        <div>
          <p style={{
            fontSize: '10px', fontWeight: 600, textTransform: 'uppercase',
            letterSpacing: '0.14em', color: 'var(--text-muted)', marginBottom: '16px'
          }}>
            Workspace Activity
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: '20px' }}>
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border-default)',
              borderRadius: '12px', display: 'flex', flexDirection: 'column',
              overflow: 'hidden', height: '260px',
            }}>
              <div style={{ padding: '20px 20px 8px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500, flexShrink: 0 }}>
                Tasks Completed (Last 7 Days)
              </div>
              <div style={{ flex: 1, minHeight: 0, padding: '0 8px 8px' }}>
                <TasksCompletedChart data={data?.tasks_completed_7_days} />
              </div>
            </div>
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border-default)',
              borderRadius: '12px', display: 'flex', flexDirection: 'column',
              overflow: 'hidden', height: '260px',
            }}>
              <div style={{ padding: '20px 20px 8px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500, flexShrink: 0 }}>
                Status Distribution
              </div>
              <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', padding: '0 20px 20px' }}>
                <StatusDistribution distribution={data?.task_status_distribution} />
              </div>
            </div>
          </div>
        </div>

      </div>
    </PageContainer>
  );
}
