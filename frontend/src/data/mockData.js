// src/data/mockData.js
// Development-only mock data. Replace with real API calls in production.

export const ROLES = {
  USER: 'user',
  OWNER: 'owner',
  ADMIN: 'admin',
  LEAD: 'lead',
  DEVELOPER: 'developer',
};

export const mockUsers = [
  {
    id: 'user-001',
    name: 'DevCollab User',
    email: 'user@example.com',
    password: 'DevCollab123',
    role: ROLES.USER,
    avatarInitials: 'DU',
  },
  {
    id: 'owner-001',
    name: 'DevCollab Owner',
    email: 'owner@example.com',
    password: 'DevCollab123',
    role: ROLES.OWNER,
    avatarInitials: 'DO',
  },
  {
    id: 'admin-001',
    name: 'DevCollab Admin',
    email: 'admin@example.com',
    password: 'DevCollab123',
    role: ROLES.ADMIN,
    avatarInitials: 'DA',
  },
  {
    id: 'member-001',
    name: 'DevCollab Member',
    email: 'member@example.com',
    password: 'DevCollab123',
    role: ROLES.MEMBER,
    avatarInitials: 'DM',
  },
  {
    id: 'viewer-001',
    name: 'DevCollab Viewer',
    email: 'viewer@example.com',
    password: 'DevCollab123',
    role: ROLES.VIEWER,
    avatarInitials: 'DV',
  },
];

export const mockWorkspaces = [
  {
    id: 'workspace-001',
    name: 'DevCollab Engineering',
    slug: 'devcollab-engineering',
    inviteCode: 'DEVTEAM001',
    ownerId: 'owner-001',
  },
  {
    id: 'workspace-002',
    name: 'Hackathon Team',
    slug: 'hackathon-team',
    inviteCode: 'HACK2026',
    ownerId: 'owner-001',
  },
];
