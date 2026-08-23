import { useState, useEffect, useCallback } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import {
  Search, X, UserPlus, Trash2,
  CheckCircle2, Loader2, Mail, Shield, ChevronDown,
} from 'lucide-react';

/* ─── role config ────────────────────────────────────────────────────────── */
const ROLE_BADGE = {
  OWNER:     { bg: '#6366f118', color: '#818cf8', border: '#6366f144', label: 'Owner' },
  ADMIN:     { bg: '#f59e0b18', color: '#fbbf24', border: '#f59e0b44', label: 'Admin' },
  LEAD:      { bg: '#10b98118', color: '#34d399', border: '#10b98144', label: 'Lead' },
  DEVELOPER: { bg: '#3b82f618', color: '#60a5fa', border: '#3b82f644', label: 'Developer' },
  // server may return title-case
  Owner:  { bg: '#6366f118', color: '#818cf8', border: '#6366f144', label: 'Owner' },
  Admin:  { bg: '#f59e0b18', color: '#fbbf24', border: '#f59e0b44', label: 'Admin' },
  Lead:   { bg: '#10b98118', color: '#34d399', border: '#10b98144', label: 'Lead' },
  Dev:    { bg: '#3b82f618', color: '#60a5fa', border: '#3b82f644', label: 'Developer' },
  Member: { bg: '#ffffff0a', color: '#aaa',    border: '#ffffff18', label: 'Member' },
};

// Hierarchy: 0 = highest authority
const ROLE_RANK = { OWNER: 0, Owner: 0, ADMIN: 1, Admin: 1, LEAD: 2, Lead: 2, DEVELOPER: 3, Dev: 3, Member: 4 };

/* ─── avatar ─────────────────────────────────────────────────────────────── */
function Avatar({ name, size = 34 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: 'var(--border-strong)', color: '#fff', border: '1px solid #333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: size * 0.38, flexShrink: 0 }}>
      {(name || '?')[0].toUpperCase()}
    </div>
  );
}

/* ─── Invite Modal — wired to backend ───────────────────────────────────── */
function InviteModal({ workspaceId, onClose, onInvited }) {
  const [email, setEmail]   = useState('');
  const [name, setName]     = useState('');
  const [roleVal, setRole]  = useState('DEVELOPER');
  const [state, setState]   = useState('idle'); // idle|loading|success|error
  const [errMsg, setErrMsg] = useState('');

  const send = async () => {
    if (!email.trim()) return;
    setState('loading'); setErrMsg('');
    try {
      const { apiClient } = await import('../../api/client');
      await apiClient(`/workspaces/${workspaceId}/invitations/`, {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), name: name.trim(), role: roleVal }),
      });
      setState('success');
      onInvited?.();
      setTimeout(onClose, 2000);
    } catch (err) {
      setErrMsg(err.message || 'Failed to send.');
      setState('error');
    }
  };

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--surface-item)', border: '1px solid #2a2a2e', borderRadius: '14px', width: '460px', padding: '28px', position: 'relative', boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={16} /></button>

        {state === 'success' ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <CheckCircle2 size={44} color="#4ade80" style={{ margin: '0 auto 14px', display: 'block' }} />
            <p style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '16px', margin: '0 0 6px' }}>Invitation Sent!</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>Invite dispatched to <strong style={{ color: 'var(--text-secondary)' }}>{email}</strong></p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <UserPlus size={16} color="#fff" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Invite to Project</h3>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>Send a role-based email invitation</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>NAME (optional)</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Their name" style={{ width: '100%', boxSizing: 'border-box', background: 'var(--surface-item)', border: '1px solid #2a2a2e', borderRadius: '8px', padding: '10px 14px', fontSize: '14px', color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit' }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>EMAIL ADDRESS *</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={13} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input autoFocus value={email} onChange={e => { setEmail(e.target.value); if (state === 'error') setState('idle'); }} onKeyDown={e => e.key === 'Enter' && send()} placeholder="colleague@company.com" type="email" style={{ width: '100%', boxSizing: 'border-box', background: 'var(--surface-item)', border: `1px solid ${state === 'error' ? '#f87171' : 'var(--border-strong)'}`, borderRadius: '8px', padding: '10px 14px 10px 34px', fontSize: '14px', color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit' }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>ASSIGN ROLE</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['ADMIN', 'LEAD', 'DEVELOPER'].map(r => (
                    <button key={r} onClick={() => setRole(r)} style={{ flex: 1, padding: '8px', borderRadius: '7px', fontSize: '12px', fontWeight: 600, border: roleVal === r ? '1px solid #6366f1' : '1px solid #2a2a2e', background: roleVal === r ? '#6366f118' : 'transparent', color: roleVal === r ? '#818cf8' : 'var(--text-muted)', cursor: 'pointer', transition: 'all 120ms' }}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              {state === 'error' && <div style={{ background: '#f8717118', border: '1px solid #f8717144', borderRadius: '7px', padding: '10px 14px', fontSize: '12px', color: '#f87171' }}>{errMsg}</div>}
              <button onClick={send} disabled={!email.trim() || state === 'loading'} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: email.trim() && state !== 'loading' ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'var(--border-strong)', color: email.trim() && state !== 'loading' ? '#fff' : 'var(--text-muted)', border: 'none', cursor: email.trim() ? 'pointer' : 'not-allowed', fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 120ms' }}>
                {state === 'loading' && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
                {state === 'loading' ? 'Sending…' : 'Send Invitation'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── main page ─────────────────────────────────────────────────────────── */
export default function ProjectMembersPage() {
  const { projectId } = useParams();
  const { project } = useOutletContext() || {};
  const { role: myRole } = useAuthStore();

  const [members, setMembers]       = useState([]);
  const [workspaceId, setWsId]      = useState(null);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [removing, setRemoving]     = useState(null); // id being removed

  const isOwner = myRole === 'Owner' || myRole === 'OWNER';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { apiClient } = await import('../../api/client');
      const data = await apiClient('/workspace/members/');
      setMembers(data);
      const wsData = await apiClient('/workspaces/');
      if (wsData?.workspaces?.length > 0) setWsId(wsData.workspaces[0].id);
    } catch (err) {
      console.error('Failed to load members', err);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRemove = async (memberId) => {
    // Frontend only for now (member store removal) — backend endpoint can be wired when available
    setRemoving(memberId);
    setMembers(prev => prev.filter(m => m.id !== memberId));
    setRemoving(null);
  };

  const filtered = members.filter(m =>
    (m.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (m.email || '').toLowerCase().includes(search.toLowerCase())
  );

  // Can owner delete this member?
  const canDelete = (member) => {
    if (!isOwner) return false;
    const memberRoleRank = ROLE_RANK[member.role] ?? 99;
    const ownerRank = ROLE_RANK['OWNER'];
    // Owner cannot delete themselves; can delete anyone with lower authority
    return memberRoleRank > ownerRank; // ADMIN(1) > OWNER(0), so owner CAN delete them
  };

  return (
    <div style={{ height: '100vh', overflow: 'auto', background: 'var(--bg)', color: 'var(--text-primary)', fontFamily: 'Inter, system-ui, sans-serif', padding: '32px 36px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div>
          <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', color: 'var(--text-muted)', margin: '0 0 6px 0' }}>
            {isOwner ? 'OWNER VIEW' : 'TEAM VIEW'}
          </p>
          <h1 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
            {isOwner ? 'Team Management' : 'Project Team'}
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
            {isOwner ? 'Invite and manage people working on this project.' : 'People working on this project and their roles.'}
          </p>
        </div>
        {isOwner && (
          <button
            id="team-invite-btn"
            onClick={() => setShowInvite(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '9px', background: 'var(--text-primary)', color: 'var(--bg)', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 700, marginTop: '6px', boxShadow: '0 4px 20px rgba(99,102,241,0.3)' }}
          >
            <UserPlus size={14} /> Invite People
          </button>
        )}
      </div>

      <div style={{ borderTop: '1px solid var(--border-strong)', margin: '20px 0' }} />

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '20px', maxWidth: '360px' }}>
        <Search size={13} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search members…" style={{ width: '100%', boxSizing: 'border-box', background: 'var(--surface-item)', border: '1px solid #1f1f24', borderRadius: '9px', padding: '9px 12px 9px 34px', fontSize: '13px', color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit' }} />
      </div>

      {/* Members table */}
      <div style={{ background: 'var(--surface-item)', border: '1px solid #1f1f24', borderRadius: '12px', overflow: 'hidden' }}>
        {/* Column headers */}
        <div style={{ display: 'grid', gridTemplateColumns: isOwner ? '2fr 1fr 1fr 1fr auto' : '2fr 1fr 1fr', padding: '10px 20px', borderBottom: '1px solid #1f1f24', fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.09em', textTransform: 'uppercase' }}>
          <span>Member</span><span>Role</span><span>Status</span>
          {isOwner && <><span>Last Active</span><span /></>}
        </div>

        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <Loader2 size={22} color="var(--text-muted)" style={{ animation: 'spin 1s linear infinite', margin: '0 auto' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '12px' }}>Loading team…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
              {search ? 'No members match your search.' : 'No members yet. Invite your team!'}
            </p>
          </div>
        ) : (
          filtered.map((member, idx) => {
            const memberRole = member.role || 'Member';
            const badge = ROLE_BADGE[memberRole] || ROLE_BADGE.Member;
            const isPending = member.status === 'Pending';
            const deletable = canDelete(member) && !isPending;

            return (
              <div key={member.id} style={{ display: 'grid', gridTemplateColumns: isOwner ? '2fr 1fr 1fr 1fr auto' : '2fr 1fr 1fr', padding: '14px 20px', borderBottom: idx < filtered.length - 1 ? '1px solid #1a1a1e' : 'none', alignItems: 'center', transition: 'background 150ms', opacity: removing === member.id ? 0.4 : 1 }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--border-strong)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {/* Member info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Avatar name={member.name || member.username} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {member.name || member.username}
                      {isPending && <span style={{ marginLeft: '8px', fontSize: '10px', color: '#f59e0b', fontWeight: 700 }}>PENDING</span>}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.email}</div>
                  </div>
                </div>

                {/* Role badge */}
                <div>
                  <span style={{ padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 700, background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`, letterSpacing: '0.04em' }}>
                    {badge.label || memberRole}
                  </span>
                </div>

                {/* Status */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isPending ? '#f59e0b' : '#4ade80', flexShrink: 0 }} />
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>{member.status || 'Active'}</span>
                </div>

                {isOwner && (
                  <>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{member.last_active || '—'}</div>
                    <div>
                      {deletable && (
                        <button onClick={() => handleRemove(member.id)} title="Remove member"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', borderRadius: '6px', padding: '4px', transition: 'color 150ms' }}
                          onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>

      {showInvite && <InviteModal workspaceId={workspaceId} onClose={() => setShowInvite(false)} onInvited={load} />}
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
