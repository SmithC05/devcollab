import { create } from 'zustand';
import { nanoid } from 'nanoid';

// All grayscale avatars
const SEED_MEMBERS = [
  { id: 'member-1', name: 'Libin',         email: 'libin@devcollab.io',  role: 'Owner',  joinedDate: '2026-08-01', status: 'active', avatar: 'L', avatarBg: '#2a2a2a' },
  { id: 'member-2', name: 'Arjun',         email: 'arjun@devcollab.io',  role: 'Dev',    joinedDate: '2026-08-05', status: 'active', avatar: 'A', avatarBg: '#222' },
  { id: 'member-3', name: 'Priya',         email: 'priya@devcollab.io',  role: 'Lead',   joinedDate: '2026-08-02', status: 'active', avatar: 'P', avatarBg: '#1a1a1a' },
  { id: 'member-4', name: 'Rahul',         email: 'rahul@devcollab.io',  role: 'Dev',    joinedDate: '2026-08-10', status: 'active', avatar: 'R', avatarBg: '#333' },
];

const WORKSPACE_USERS = [
  { id: 'user-4', name: 'Rahul Verma',     email: 'rahul@devcollab.io',  avatar: 'R', avatarBg: '#2a2a2a' },
  { id: 'user-5', name: 'Meera Nair',      email: 'meera@devcollab.io',  avatar: 'M', avatarBg: '#222' },
  { id: 'user-6', name: 'Sanjay Mehta',    email: 'sanjay@devcollab.io', avatar: 'S', avatarBg: '#1a1a1a' },
  { id: 'user-7', name: 'Ananya Krishnan', email: 'ananya@devcollab.io', avatar: 'A', avatarBg: '#2a2a2a' },
];

export const useMemberStore = create((set, get) => ({
  members: SEED_MEMBERS,
  workspaceUsers: WORKSPACE_USERS,

  addMember: (user) => {
    const already = get().members.find((m) => m.id === user.id);
    if (already) return;
    set((state) => ({
      members: [...state.members, { ...user, role: 'Member', joinedDate: new Date().toISOString().split('T')[0], status: 'active' }],
    }));
  },

  removeMember: (memberId) => {
    set((state) => ({ members: state.members.filter((m) => m.id !== memberId) }));
  },

  updateRole: (memberId, role) => {
    set((state) => ({ members: state.members.map((m) => m.id === memberId ? { ...m, role } : m) }));
  },

  getAvailableUsers: () => {
    const memberIds = get().members.map((m) => m.id);
    return get().workspaceUsers.filter((u) => !memberIds.includes(u.id));
  },
}));
