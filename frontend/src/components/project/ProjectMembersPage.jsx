import { useState } from 'react';
import { useMemberStore } from '../../stores/memberStore';
import { useAuthStore } from '../../stores/authStore';
import { Search, Plus, X, UserPlus, Trash2 } from 'lucide-react';

const ROLE_COLORS = {
  Owner:  { bg: 'rgba(255,255,255,0.08)', text: '#eee', border: 'rgba(255,255,255,0.2)' },
  Admin:  { bg: 'rgba(255,255,255,0.05)', text: '#ccc', border: 'rgba(255,255,255,0.12)' },
  Member: { bg: 'rgba(255,255,255,0.02)', text: 'var(--text-secondary)', border: 'rgba(255,255,255,0.08)' },
};

function Avatar({ name, bg, size = 32 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: bg || 'var(--border-default)', color: '#ccc', border: '1px solid var(--border-strong)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: size * 0.4, flexShrink: 0,
    }}>
      {name?.[0]?.toUpperCase() || '?'}
    </div>
  );
}

function AddMemberModal({ onClose }) {
  const { addMember, getAvailableUsers } = useMemberStore();
  const [search, setSearch] = useState('');
  const available = getAvailableUsers();
  const filtered = available.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: 'var(--surface-raised)', border: '1px solid var(--surface-hover)',
        borderRadius: '12px', width: '460px', padding: '24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Add Member</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            autoFocus value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search workspace users..."
            style={{
              width: '100%', boxSizing: 'border-box',
              background: '#0e0e0e', border: '1px solid var(--border-strong)', borderRadius: '8px',
              padding: '9px 12px 9px 34px', fontSize: '13px', color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit',
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '280px', overflowY: 'auto' }}>
          {filtered.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '20px' }}>All workspace users are already members.</p>}
          {filtered.map((user) => (
            <div key={user.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '8px', background: '#0e0e0e', border: '1px solid var(--surface-hover)', cursor: 'pointer' }}>
              <Avatar name={user.name} bg={user.avatarBg} size={32} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{user.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{user.email}</div>
              </div>
              <button onClick={() => { addMember(user); onClose(); }} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, background: 'var(--text-primary)', color: '#080808', border: 'none', cursor: 'pointer' }}>
                <UserPlus size={12} /> Add
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ProjectMembersPage() {
  const { members, removeMember } = useMemberStore();
  const { can } = useAuthStore();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);

  const filtered = members.filter(
    (m) => m.name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ height: '100vh', overflow: 'auto', background: '#080808', color: 'var(--text-primary)', fontFamily: 'Inter, system-ui, sans-serif', padding: '28px 32px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, margin: '0 0 4px 0', letterSpacing: '-0.02em' }}>Project Members</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>Manage people working on this project.</p>
        </div>
        {can('member.add') && (
          <button onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 18px', borderRadius: '8px', background: 'var(--text-primary)', color: '#080808', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 700 }}>
            <Plus size={14} strokeWidth={2.5} /> Add Member
          </button>
        )}
      </div>

      <div style={{ position: 'relative', marginBottom: '20px', maxWidth: '340px' }}>
        <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search members..." style={{ width: '100%', boxSizing: 'border-box', background: 'var(--surface-raised)', border: '1px solid var(--surface-hover)', borderRadius: '8px', padding: '9px 12px 9px 34px', fontSize: '13px', color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit' }} />
      </div>

      <div style={{ background: 'var(--surface-raised)', border: '1px solid var(--surface-hover)', borderRadius: '10px', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', padding: '10px 20px', borderBottom: '1px solid var(--surface-hover)', fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.09em', textTransform: 'uppercase' }}>
          <span>User</span><span>Role</span><span>Joined</span><span>Status</span><span />
        </div>

        {filtered.map((member, idx) => (
          <div key={member.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', padding: '14px 20px', borderBottom: idx < filtered.length - 1 ? '1px solid var(--surface-hover)' : 'none', alignItems: 'center', transition: 'background 150ms' }} className="member-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Avatar name={member.name} bg={member.avatarBg} size={34} />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{member.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{member.email}</div>
              </div>
            </div>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 9px', borderRadius: '999px', background: (ROLE_COLORS[member.role] || ROLE_COLORS.Member).bg, color: (ROLE_COLORS[member.role] || ROLE_COLORS.Member).text, border: `1px solid ${(ROLE_COLORS[member.role] || ROLE_COLORS.Member).border}` }}>
                {member.role}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{member.joinedDate}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#999', flexShrink: 0 }} />
              <span style={{ fontSize: '12px', color: '#999', fontWeight: 500 }}>Active</span>
            </div>
            {(() => {
              // Rule: Owner can't be removed here. 
              if (member.role === 'Owner') return null;
              // Rule: Admin can only be removed by someone with REMOVE_ADMIN.
              if (member.role === 'Admin' && !can('member.remove')) return null;
              // Rule: Anyone else can be removed by someone with REMOVE_MEMBER.
              if (!can('member.remove')) return null;

              return (
                <button onClick={() => removeMember(member.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--focus-ring)', display: 'flex', alignItems: 'center', borderRadius: '6px', padding: '4px', transition: 'color 150ms' }} title="Remove member">
                  <Trash2 size={14} />
                </button>
              );
            })()}
          </div>
        ))}
        {filtered.length === 0 && <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>No members found.</div>}
      </div>

      {showModal && <AddMemberModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
