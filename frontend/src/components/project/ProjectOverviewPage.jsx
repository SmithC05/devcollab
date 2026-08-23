import { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import {
  ArrowLeft, Search, Columns3, Users, Activity,
  CheckCheck, AlertTriangle, TrendingUp, Loader2, ListTodo,
  Clock,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

/* ─── breadcrumb bar ─────────────────────────────────────────────────────── */
function PageTopBar({ projectName }) {
  const navigate = useNavigate();
  return (
    <div style={{
      height: '48px', borderBottom: '1px solid var(--border-strong)', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px', background: 'var(--bg)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={() => navigate('/dashboard/projects')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 500, transition: 'background 120ms' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-raised)'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >
          <ArrowLeft size={13} strokeWidth={2} /> Projects
        </button>
        <span style={{ color: 'var(--border-strong)' }}>/</span>
        <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '14px' }}>{projectName}</span>
      </div>
    </div>
  );
}

/* ─── stat card ─────────────────────────────────────────────────────────── */
function StatCard({ icon: Icon, value, label, loading }) {
  return (
    <div style={{ background: 'var(--surface-item)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '20px 24px' }}>
      <div style={{ marginBottom: '12px' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={15} color='var(--bg)' />
        </div>
      </div>
      {loading
        ? <Loader2 size={18} color="var(--text-muted)" style={{ animation: 'spin 1s linear infinite' }} />
        : <>
          <div style={{ fontSize: '30px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1, letterSpacing: '-0.02em' }}>{value ?? '—'}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '5px', fontWeight: 500 }}>{label}</div>
        </>
      }
    </div>
  );
}


/* ─── member row ─────────────────────────────────────────────────────────── */
const ROLE_BADGE = {
  OWNER:  { bg: '#6366f118', color: '#818cf8', border: '#6366f144' },
  ADMIN:  { bg: '#f59e0b18', color: '#fbbf24', border: '#f59e0b44' },
  LEAD:   { bg: '#10b98118', color: '#34d399', border: '#10b98144' },
  DEVELOPER: { bg: '#3b82f618', color: '#60a5fa', border: '#3b82f644' },
  Owner:  { bg: '#6366f118', color: '#818cf8', border: '#6366f144' },
  Admin:  { bg: '#f59e0b18', color: '#fbbf24', border: '#f59e0b44' },
  Lead:   { bg: '#10b98118', color: '#34d399', border: '#10b98144' },
  Dev:    { bg: '#3b82f618', color: '#60a5fa', border: '#3b82f644' },
  Member: { bg: '#ffffff0a', color: '#aaa',    border: '#ffffff18' },
};

function MemberRow({ m }) {
  const badge = ROLE_BADGE[m.role] || ROLE_BADGE.Member;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '8px', transition: 'background 120ms' }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--text-primary)', color: 'var(--bg)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px', flexShrink: 0 }}>
        {(m.name || m.username || '?')[0].toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name || m.username}</div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.email}</div>
      </div>
      <span style={{ padding: '2px 8px', borderRadius: '999px', fontSize: '10px', fontWeight: 700, background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`, flexShrink: 0 }}>
        {m.role?.toUpperCase() || 'MEMBER'}
      </span>
    </div>
  );
}

/* ─── OWNER OVERVIEW ─────────────────────────────────────────────────────── */
function OwnerOverview({ project }) {
  const navigate = useNavigate();
  const { projectId } = useParams();

  const [stats, setStats]           = useState(null);
  const [members, setMembers]       = useState([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [loadingStats, setLoadingStats]     = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { apiClient } = await import('../../api/client');
        const data = await apiClient(`/projects/${projectId}/stats/`);
        setStats(data);
      } catch (err) {
        console.error('Stats fetch failed', err);
        setStats({ total: 0, done: 0, in_progress: 0, in_review: 0, to_do: 0, blocked: 0, completion_pct: 0 });
      } finally { setLoadingStats(false); }
    };
    load();
  }, [projectId]);

  useEffect(() => {
    const load = async () => {
      try {
        const { apiClient } = await import('../../api/client');
        setMembers(await apiClient('/workspace/members/'));
      } catch { /* silent */ }
      finally { setLoadingMembers(false); }
    };
    load();
  }, []);

  const filteredMembers = members.filter(m =>
    (m.name || '').toLowerCase().includes(memberSearch.toLowerCase()) ||
    (m.email || '').toLowerCase().includes(memberSearch.toLowerCase())
  );

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '32px 36px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '6px' }}>
        <div>
          <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', color: 'var(--text-muted)', margin: '0 0 6px 0' }}>OWNER VIEW</p>
          <h1 style={{ fontSize: '36px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em', lineHeight: 1 }}>
            {project?.name || 'Project'}
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>
            Full project authority · real-time health &amp; team tracking
          </p>
        </div>
        <button onClick={() => navigate(`/projects/${projectId}/board`)} style={{ padding: '9px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, border: '1px solid var(--border-strong)', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer', marginTop: '4px' }}>
          Open Board
        </button>
      </div>

      <div style={{ borderTop: '1px solid var(--border-strong)', margin: '24px 0' }} />

      {/* Live stat cards — monochrome */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '20px' }}>
        <StatCard icon={TrendingUp}    value={loadingStats ? null : `${stats?.completion_pct ?? 0}%`} label="Completion"   loading={loadingStats} />
        <StatCard icon={ListTodo}      value={loadingStats ? null : stats?.total}                       label="Total Tasks"  loading={loadingStats} />
        <StatCard icon={CheckCheck}    value={loadingStats ? null : stats?.done}                        label="Done"         loading={loadingStats} />
        <StatCard icon={Clock}         value={loadingStats ? null : stats?.in_progress}                 label="In Progress"  loading={loadingStats} />
        <StatCard icon={AlertTriangle} value={loadingStats ? null : stats?.blocked}                     label="Blocked"      loading={loadingStats} />
      </div>

      {/* Members panel — full width, no status side panel */}
      <div style={{ background: 'var(--surface-item)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Team {!loadingMembers && <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--text-muted)' }}>({members.length})</span>}
            </p>
            <div style={{ position: 'relative' }}>
              <Search size={12} style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input value={memberSearch} onChange={e => setMemberSearch(e.target.value)} placeholder="Search…" style={{ background: 'var(--surface-item)', border: '1px solid var(--border-strong)', borderRadius: '7px', padding: '6px 10px 6px 28px', fontSize: '12px', color: 'var(--text-primary)', outline: 'none', width: '150px', fontFamily: 'inherit' }} />
            </div>
          </div>
          {loadingMembers
            ? <Loader2 size={16} color="var(--text-muted)" style={{ animation: 'spin 1s linear infinite', margin: '12px auto', display: 'block' }} />
            : filteredMembers.length === 0
              ? <p style={{ color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center', padding: '16px' }}>No members found.</p>
              : filteredMembers.map(m => <MemberRow key={m.id} m={m} />)
          }
          <button onClick={() => navigate(`/projects/${projectId}/members`)}
            style={{ marginTop: '12px', width: '100%', padding: '8px', borderRadius: '7px', border: '1px solid var(--border-strong)', background: 'transparent', color: 'var(--text-muted)', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            Team →
          </button>
        </div>
    </div>
  );
}

/* ─── NON-OWNER overview ─────────────────────────────────────────────────── */
function MembersReadOnly({ role }) {
  const navigate = useNavigate();
  const { projectId } = useParams();

  const [stats, setStats]   = useState(null);
  const [members, setMembers] = useState([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [loadingStats, setLS]   = useState(true);
  const [loadingMembers, setLM] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { apiClient } = await import('../../api/client');
        setStats(await apiClient(`/projects/${projectId}/stats/`));
      } catch { setStats({ total: 0, done: 0, in_progress: 0, blocked: 0, completion_pct: 0 }); }
      finally { setLS(false); }
    };
    load();
  }, [projectId]);

  useEffect(() => {
    const load = async () => {
      try {
        const { apiClient } = await import('../../api/client');
        setMembers(await apiClient('/workspace/members/'));
      } catch { /* silent */ }
      finally { setLM(false); }
    };
    load();
  }, []);

  const filtered = members.filter(m =>
    (m.name || '').toLowerCase().includes(memberSearch.toLowerCase()) ||
    (m.email || '').toLowerCase().includes(memberSearch.toLowerCase())
  );

  const roleLabel = { Admin: 'ADMIN VIEW', Lead: 'LEAD VIEW', Dev: 'DEVELOPER VIEW' }[role] || 'PROJECT VIEW';

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '32px 36px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', color: 'var(--text-muted)', margin: '0 0 6px 0' }}>{roleLabel}</p>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '6px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>Project Overview</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>Your team and the current state of this project</p>
        </div>
        <button onClick={() => navigate(`/projects/${projectId}/board`)} style={{ padding: '9px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, border: '1px solid var(--border-strong)', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer', marginTop: '4px' }}>Open Board</button>
      </div>
      <div style={{ borderTop: '1px solid var(--border-strong)', margin: '24px 0' }} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
        <StatCard icon={TrendingUp}    value={loadingStats ? null : `${stats?.completion_pct ?? 0}%`} label="Completion"  loading={loadingStats} />
        <StatCard icon={ListTodo}      value={loadingStats ? null : stats?.total}                       label="Total Tasks" loading={loadingStats} />
        <StatCard icon={CheckCheck}    value={loadingStats ? null : stats?.done}                        label="Done"        loading={loadingStats} />
        <StatCard icon={AlertTriangle} value={loadingStats ? null : stats?.blocked}                     label="Blocked"     loading={loadingStats} />
      </div>

      {/* Read-only member list */}
      <div style={{ background: 'var(--surface-item)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '20px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Team Members {!loadingMembers && <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--text-muted)' }}>({members.length})</span>}
          </p>
          <div style={{ position: 'relative' }}>
            <Search size={12} style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input value={memberSearch} onChange={e => setMemberSearch(e.target.value)} placeholder="Search…" style={{ background: 'var(--surface-item)', border: '1px solid var(--border-strong)', borderRadius: '7px', padding: '6px 10px 6px 28px', fontSize: '12px', color: 'var(--text-primary)', outline: 'none', width: '150px', fontFamily: 'inherit' }} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', padding: '6px 10px', fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.09em', textTransform: 'uppercase', borderBottom: '1px solid var(--border-strong)', marginBottom: '6px' }}>
          <span>Member</span><span>Role</span><span>Status</span>
        </div>
        {loadingMembers
          ? <Loader2 size={16} color="var(--text-muted)" style={{ animation: 'spin 1s linear infinite', margin: '16px auto', display: 'block' }} />
          : filtered.length === 0
            ? <p style={{ color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center', padding: '20px' }}>No members found.</p>
            : filtered.map(m => {
              const badge = ROLE_BADGE[m.role] || ROLE_BADGE.Member;
              return (
                <div key={m.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', alignItems: 'center', padding: '9px 10px', borderRadius: '8px', transition: 'background 120ms' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--text-primary)', color: 'var(--bg)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px', flexShrink: 0 }}>
                      {(m.name || '?')[0].toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.email}</div>
                    </div>
                  </div>
                  <span style={{ padding: '3px 9px', borderRadius: '999px', fontSize: '10px', fontWeight: 700, background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>
                    {m.role?.toUpperCase() || 'MEMBER'}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80' }} />
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Active</span>
                  </div>
                </div>
              );
            })
        }
      </div>
    </div>
  );
}

/* ─── root export ────────────────────────────────────────────────────────── */
export default function ProjectOverviewPage() {
  const { role } = useAuthStore();
  const { project } = useOutletContext() || {};
  const safeRole = role || 'Dev';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)', color: 'var(--text-primary)', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <PageTopBar projectName={project?.name || 'Project'} />
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      {safeRole === 'Owner' ? <OwnerOverview project={project} /> : <MembersReadOnly role={safeRole} />}
    </div>
  );
}
