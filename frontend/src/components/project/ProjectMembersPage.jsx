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
    <div style={{ width: size, height: size, borderRadius: '50%', background: '#2a2a2e', color: '#fff', border: '1px solid #333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: size * 0.38, flexShrink: 0 }}>
      {(name || '?')[0].toUpperCase()}
    </div>
  );
}

/* ─── Add Member Modal — wired to backend ───────────────────────────────────── */
function AddMemberModal({ projectId, existingMemberIds = [], onClose, onAdded }) {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [state, setState] = useState('idle'); // idle|saving|success|error
  const [errMsg, setErrMsg] = useState('');

  useEffect(() => {
    let active = true;
    const fetchWorkspaceMembers = async () => {
      try {
        const { apiClient } = await import('../../api/client');
        const data = await apiClient('/workspace/members/');
        if (active) {
          // Filter to only active members who are not already in the project
          const eligible = data.filter(m => 
            m.status !== 'Pending' && 
            m.status !== 'Rejected' && 
            !existingMemberIds.includes(m.id)
          );
          setCandidates(eligible);
          setLoading(false);
        }
      } catch (err) {
        if (active) {
          setErrMsg('Failed to load workspace members.');
          setLoading(false);
        }
      }
    };
    fetchWorkspaceMembers();
    return () => { active = false; };
  }, [existingMemberIds]);

  const handleAdd = async () => {
    if (!selectedUser) return;
    setState('saving'); setErrMsg('');
    try {
      const { apiClient } = await import('../../api/client');
      await apiClient(`/projects/${projectId}/members/`, {
        method: 'POST',
        body: JSON.stringify({ user_id: selectedUser.id }),
      });
      setState('success');
      onAdded?.();
      setTimeout(onClose, 1500);
    } catch (err) {
      setErrMsg(err.message || 'Failed to add member.');
      setState('error');
    }
  };

  const filtered = candidates.filter(m => 
    (m.name || m.username || '').toLowerCase().includes(search.toLowerCase()) ||
    (m.email || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#141416', border: '1px solid #2a2a2e', borderRadius: '14px', width: '460px', padding: '28px', position: 'relative', boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={16} /></button>

        {state === 'success' ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <CheckCircle2 size={44} color="#4ade80" style={{ margin: '0 auto 14px', display: 'block' }} />
            <p style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '16px', margin: '0 0 6px' }}>Added!</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}><strong style={{ color: 'var(--text-secondary)' }}>{selectedUser?.name || selectedUser?.username}</strong> was added to the project.</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <UserPlus size={16} color="#fff" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Add Members to Project</h3>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>Select members from this workspace to add to the project.</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>MEMBER</label>
                
                {selectedUser ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0e0e0e', border: '1px solid #3b82f644', borderRadius: '8px', padding: '10px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Avatar name={selectedUser.name || selectedUser.username} size={28} />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>{selectedUser.name || selectedUser.username} <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: '#6366f118', color: '#818cf8', marginLeft: '6px' }}>{selectedUser.role}</span></div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{selectedUser.email}</div>
                      </div>
                    </div>
                    <button onClick={() => setSelectedUser(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={14} /></button>
                  </div>
                ) : (
                  <>
                    <div style={{ position: 'relative', marginBottom: '10px' }}>
                      <Search size={13} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Search workspace members..." style={{ width: '100%', boxSizing: 'border-box', background: '#0e0e0e', border: '1px solid #2a2a2e', borderRadius: '8px', padding: '10px 14px 10px 34px', fontSize: '13px', color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit' }} />
                    </div>
                    
                    <div style={{ background: '#0e0e0e', border: '1px solid #2a2a2e', borderRadius: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                      {loading ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>Loading members...</div>
                      ) : candidates.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>No members available. Invite people to this workspace first.</div>
                      ) : filtered.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>No members found. Try a different name or email.</div>
                      ) : (
                        filtered.map(m => (
                          <div key={m.id} onClick={() => setSelectedUser(m)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid #1a1a1e', cursor: 'pointer', transition: 'background 150ms' }} onMouseEnter={e => e.currentTarget.style.background = '#1a1a1e'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <Avatar name={m.name || m.username} size={28} />
                              <div>
                                <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>{m.name || m.username}</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{m.email}</div>
                              </div>
                            </div>
                            <div style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: '#ffffff0a', color: '#aaa', fontWeight: 700 }}>{m.role}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>
              
              {state === 'error' && <div style={{ background: '#f8717118', border: '1px solid #f8717144', borderRadius: '7px', padding: '10px 14px', fontSize: '12px', color: '#f87171' }}>{errMsg}</div>}
              
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button onClick={onClose} style={{ flex: 1, padding: '12px', borderRadius: '8px', background: 'transparent', border: '1px solid #2a2a2e', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '13px', fontWeight: 600, transition: 'all 120ms' }}>Cancel</button>
                <button onClick={handleAdd} disabled={!selectedUser || state === 'saving'} style={{ flex: 1, padding: '12px', borderRadius: '8px', background: selectedUser && state !== 'saving' ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : '#1a1a1e', color: selectedUser && state !== 'saving' ? '#fff' : 'var(--text-muted)', border: 'none', cursor: selectedUser ? 'pointer' : 'not-allowed', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 120ms' }}>
                  {state === 'saving' && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
                  {state === 'saving' ? 'Adding...' : 'Add Member'}
                </button>
              </div>
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
      // Fetch project members instead of all workspace members
      const data = await apiClient(`/projects/${projectId}/members/`);
      setMembers(data);
    } catch (err) {
      console.error('Failed to load project members', err);
    } finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  const handleRemove = async (memberId) => {
    setRemoving(memberId);
    try {
      const { apiClient } = await import('../../api/client');
      await apiClient(`/projects/${projectId}/members/${memberId}/`, { method: 'DELETE' });
      setMembers(prev => prev.filter(m => m.id !== memberId));
    } catch (err) {
      console.error('Failed to remove project member', err);
    }
    setRemoving(null);
  };

  const filtered = members.filter(m =>
    (m.name || m.username || '').toLowerCase().includes(search.toLowerCase()) ||
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
    <div style={{ height: '100vh', overflow: 'auto', background: '#0d0d0f', color: 'var(--text-primary)', fontFamily: 'Inter, system-ui, sans-serif', padding: '32px 36px' }}>

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
            {isOwner ? 'Manage people working on this project.' : 'People working on this project and their roles.'}
          </p>
        </div>
        {isOwner && (
          <button
            id="team-invite-btn"
            onClick={() => setShowInvite(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '9px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 700, marginTop: '6px', boxShadow: '0 4px 20px rgba(99,102,241,0.3)' }}
          >
            <UserPlus size={14} /> Add Members
          </button>
        )}
      </div>

      <div style={{ borderTop: '1px solid #1a1a1e', margin: '20px 0' }} />

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '20px', maxWidth: '360px' }}>
        <Search size={13} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search project members…" style={{ width: '100%', boxSizing: 'border-box', background: '#141416', border: '1px solid #1f1f24', borderRadius: '9px', padding: '9px 12px 9px 34px', fontSize: '13px', color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit' }} />
      </div>

      {/* Members table */}
      <div style={{ background: '#141416', border: '1px solid #1f1f24', borderRadius: '12px', overflow: 'hidden' }}>
        {/* Column headers */}
        <div style={{ display: 'grid', gridTemplateColumns: isOwner ? '2fr 1fr 1fr 1fr auto' : '2fr 1fr 1fr', padding: '10px 20px', borderBottom: '1px solid #1f1f24', fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.09em', textTransform: 'uppercase' }}>
          <span>Member</span><span>Role</span><span>Status</span>
          {isOwner && <><span>Added At</span><span /></>}
        </div>

        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <Loader2 size={22} color="var(--text-muted)" style={{ animation: 'spin 1s linear infinite', margin: '0 auto' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '12px' }}>Loading team…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
              {search ? 'No members match your search.' : 'No members yet. Add people from the workspace!'}
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
                onMouseEnter={e => e.currentTarget.style.background = '#1a1a1e'}
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
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {member.added_at ? new Date(member.added_at).toLocaleDateString() : '—'}
                    </div>
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

      {showInvite && <AddMemberModal projectId={projectId} existingMemberIds={members.map(m => m.id)} onClose={() => setShowInvite(false)} onAdded={load} />}
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
