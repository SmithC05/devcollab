import { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import {
  ArrowLeft, Search, Columns3, Users, Activity,
  CheckCheck, AlertTriangle, TrendingUp, Loader2, ListTodo,
  Clock,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';


/* ─── stat card ─────────────────────────────────────────────────────────── */
function StatCard({ value, label, loading }) {
  const formattedValue = typeof value === 'number' && value < 10 && value >= 0 ? `0${value}` : value;
  return (
    <div className="flex flex-col gap-1.5 min-w-[120px] bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-[12px] p-5 hover:border-[var(--border-strong)] transition-colors">
      {loading ? (
        <Loader2 size={18} className="text-[var(--text-muted)] animate-spin my-auto" />
      ) : (
        <>
          <span className="text-[32px] md:text-[40px] font-medium text-[var(--fg)] leading-none tracking-tight">{formattedValue ?? '—'}</span>
          <span className="text-[10px] md:text-[11px] text-[var(--text-muted)] font-bold uppercase tracking-[0.15em]">{label}</span>
        </>
      )}
    </div>
  );
}

/* ─── member row ─────────────────────────────────────────────────────────── */
const ROLE_BADGE = {
  OWNER:  { border: 'var(--border-focus)', bg: 'transparent', text: 'var(--text-primary)' },
  ADMIN:  { border: 'var(--border-strong)', bg: 'transparent', text: 'var(--text-primary)' },
  LEAD:   { border: 'var(--border-subtle)', bg: 'transparent', text: 'var(--text-secondary)' },
  DEVELOPER: { border: 'var(--border-default)', bg: 'transparent', text: 'var(--text-secondary)' },
  Owner:  { border: 'var(--border-focus)', bg: 'transparent', text: 'var(--text-primary)' },
  Admin:  { border: 'var(--border-strong)', bg: 'transparent', text: 'var(--text-primary)' },
  Lead:   { border: 'var(--border-subtle)', bg: 'transparent', text: 'var(--text-secondary)' },
  Dev:    { border: 'var(--border-default)', bg: 'transparent', text: 'var(--text-secondary)' },
  Member: { border: 'var(--border-subtle)', bg: 'transparent', text: 'var(--text-muted)' },
};

function MemberRow({ m }) {
  const badge = ROLE_BADGE[m.role] || ROLE_BADGE.Member;
  return (
    <div className="flex items-center gap-3 py-3 border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--surface-hover)] transition-colors px-2 -mx-2 rounded-[6px]">
      <div className="w-[32px] h-[32px] rounded-full bg-[var(--surface-item)] border border-[var(--border-strong)] text-[var(--text-secondary)] flex items-center justify-center text-[12px] font-medium shrink-0">
        {(m.name || m.username || '?')[0].toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-medium text-[var(--text-primary)] truncate">{m.name || m.username}</div>
        <div className="text-[13px] text-[var(--text-muted)] truncate">{m.email}</div>
      </div>
      <span 
        className="px-2 py-0.5 rounded-[4px] text-[10px] font-bold uppercase tracking-wider shrink-0"
        style={{ border: `1px solid ${badge.border}`, background: badge.bg, color: badge.text }}
      >
        {m.role || 'MEMBER'}
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
    <div className="flex-1 overflow-auto bg-[var(--bg)] p-6 md:p-10 max-w-[1400px] mx-auto w-full">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-12">
        <div>
          <span className="text-[11px] font-bold tracking-[0.15em] text-[var(--text-muted)] uppercase mb-3 block">
            Workspace / Project
          </span>
          <div className="flex items-center gap-4">
            <h1 className="text-[32px] md:text-[42px] font-semibold text-[var(--fg)] tracking-tight leading-none mb-3">
              {project?.name || 'Project'}
            </h1>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--surface-item)] border border-[var(--border-subtle)] mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-[11px] font-medium text-[var(--text-primary)]">Active</span>
            </div>
          </div>
          <p className="text-[14px] md:text-[15px] text-[var(--text-secondary)]">
            Full project authority · real-time health & team tracking
          </p>
        </div>
        <button 
          onClick={() => navigate(`/projects/${projectId}/board`)} 
          className="h-[36px] px-4 rounded-[6px] border border-[var(--border-strong)] text-[var(--text-primary)] text-[13px] font-medium hover:bg-[var(--surface-hover)] transition-colors"
        >
          Open Board
        </button>
      </div>

      <div className="h-px bg-[var(--border-subtle)] w-full mb-10" />

      {/* Live stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6 mb-10">
        <StatCard value={loadingStats ? null : `${stats?.completion_pct ?? 0}%`} label="Completion"   loading={loadingStats} />
        <StatCard value={loadingStats ? null : stats?.total}                       label="Total Tasks"  loading={loadingStats} />
        <StatCard value={loadingStats ? null : stats?.done}                        label="Done"         loading={loadingStats} />
        <StatCard value={loadingStats ? null : stats?.in_progress}                 label="In Progress"  loading={loadingStats} />
        <StatCard value={loadingStats ? null : stats?.blocked}                     label="Blocked"      loading={loadingStats} />
      </div>

      {/* Members panel */}
      <div className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-[12px] p-6 max-w-2xl">
          <div className="flex items-center justify-between mb-6">
            <p className="m-0 text-[16px] font-semibold text-[var(--text-primary)]">
              Team {!loadingMembers && <span className="text-[14px] font-normal text-[var(--text-muted)]">({members.length})</span>}
            </p>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input 
                value={memberSearch} 
                onChange={e => setMemberSearch(e.target.value)} 
                placeholder="Search…" 
                className="bg-[var(--bg)] border border-[var(--border-subtle)] rounded-[8px] py-1.5 pr-3 pl-9 text-[13px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-focus)] transition-colors w-[180px]" 
              />
            </div>
          </div>
          <div className="flex flex-col gap-2 mb-4">
            {loadingMembers
              ? <Loader2 size={16} className="text-[var(--text-muted)] animate-spin my-4 mx-auto" />
              : filteredMembers.length === 0
                ? <p className="text-[var(--text-muted)] text-[13px] text-center p-4">No members found.</p>
                : filteredMembers.map(m => <MemberRow key={m.id} m={m} />)
            }
          </div>
          <button 
            onClick={() => navigate(`/projects/${projectId}/members`)}
            className="w-full h-[36px] flex items-center justify-center gap-2 rounded-[8px] border border-[var(--border-subtle)] bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors text-[13px] font-medium"
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
    <div className="flex-1 overflow-auto bg-[var(--bg)] p-6 md:p-10 max-w-[1400px] mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-12">
        <div>
          <span className="text-[11px] font-bold tracking-[0.15em] text-[var(--text-muted)] uppercase mb-3 block">
            {roleLabel}
          </span>
          <div className="flex items-center gap-4">
            <h1 className="text-[32px] md:text-[42px] font-semibold text-[var(--fg)] tracking-tight leading-none mb-3">
              Project Overview
            </h1>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--surface-item)] border border-[var(--border-subtle)] mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-[11px] font-medium text-[var(--text-primary)]">Active</span>
            </div>
          </div>
          <p className="text-[14px] md:text-[15px] text-[var(--text-secondary)]">Your team and the current state of this project</p>
        </div>
        <button 
          onClick={() => navigate(`/projects/${projectId}/board`)} 
          className="h-[36px] px-4 rounded-[6px] border border-[var(--border-strong)] text-[var(--text-primary)] text-[13px] font-medium hover:bg-[var(--surface-hover)] transition-colors"
        >
          Open Board
        </button>
      </div>
      
      <div className="h-px bg-[var(--border-subtle)] w-full mb-10" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-10">
        <StatCard value={loadingStats ? null : `${stats?.completion_pct ?? 0}%`} label="Completion"  loading={loadingStats} />
        <StatCard value={loadingStats ? null : stats?.total}                       label="Total Tasks" loading={loadingStats} />
        <StatCard value={loadingStats ? null : stats?.done}                        label="Done"        loading={loadingStats} />
        <StatCard value={loadingStats ? null : stats?.blocked}                     label="Blocked"     loading={loadingStats} />
      </div>

      {/* Read-only member list */}
      <div className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-[12px] p-6 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <p className="m-0 text-[16px] font-semibold text-[var(--text-primary)]">
            Team Members {!loadingMembers && <span className="text-[14px] font-normal text-[var(--text-muted)]">({members.length})</span>}
          </p>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input 
              value={memberSearch} 
              onChange={e => setMemberSearch(e.target.value)} 
              placeholder="Search…" 
              className="bg-[var(--bg)] border border-[var(--border-subtle)] rounded-[8px] py-1.5 pr-3 pl-9 text-[13px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-focus)] transition-colors w-[180px]" 
            />
          </div>
        </div>
        
        <div className="flex flex-col gap-2">
        {loadingMembers
          ? <Loader2 size={16} className="text-[var(--text-muted)] animate-spin my-4 mx-auto" />
          : filtered.length === 0
            ? <p className="text-[var(--text-muted)] text-[13px] text-center p-4">No members found.</p>
            : filtered.map(m => <MemberRow key={m.id} m={m} />)
        }
        </div>
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
    <div className="flex flex-col h-full bg-[var(--bg)] text-[var(--text-primary)]">
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      {safeRole === 'Owner' || safeRole === 'OWNER' ? <OwnerOverview project={project} /> : <MembersReadOnly role={safeRole} />}
    </div>
  );
}
