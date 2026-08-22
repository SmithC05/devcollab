import { create } from 'zustand';
import { nanoid } from 'nanoid';

export const useMemberStore = create((set, get) => ({
  members: [],
  workspaceUsers: [],

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
