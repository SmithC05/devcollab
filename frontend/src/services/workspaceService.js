// src/services/workspaceService.js
import { mockWorkspaces, ROLES } from '../data/mockData';
import { read, write, STORAGE_KEYS } from './storageService';

const delay = (ms = 400) => new Promise(resolve => setTimeout(resolve, ms));

function getWorkspaces() {
  let workspaces = read(STORAGE_KEYS.WORKSPACES);
  if (!workspaces) {
    // Migrate mockData to the new membership model on first load
    workspaces = mockWorkspaces.map(ws => ({
      ...ws,
      members: [
        {
          userId: ws.ownerId,
          role: ROLES.OWNER
        }
      ],
      plan: 'free',
      projectsCount: 0
    }));
    write(STORAGE_KEYS.WORKSPACES, workspaces);
  }
  return workspaces;
}

export async function getUserWorkspaces(userId) {
  if (!userId) return [];
  const workspaces = getWorkspaces();
  return workspaces.filter(ws => ws.members.some(m => m.userId === userId));
}

export async function createWorkspace(name, slug, description, ownerId) {
  await delay();

  if (!name || !name.trim()) throw new Error('Workspace name is required.');
  if (!slug || !slug.trim()) throw new Error('Workspace slug is required.');
  if (!ownerId) throw new Error('Owner ID is required.');
  
  if (!/^[a-z0-9-]+$/.test(slug)) {
    throw new Error('Slug may only contain lowercase letters, numbers, and hyphens.');
  }

  const workspaces = getWorkspaces();
  
  const existing = workspaces.find(w => w.slug === slug);
  if (existing) {
    throw new Error('A workspace with this slug already exists.');
  }

  const newWorkspace = {
    id: `workspace-${Date.now()}`,
    name: name.trim(),
    slug: slug.trim(),
    description: description?.trim() || '',
    inviteCode: slug.toUpperCase().replace(/-/g, '').slice(0, 8),
    ownerId,
    plan: 'free',
    projectsCount: 0,
    members: [
      {
        userId: ownerId,
        role: ROLES.OWNER
      }
    ]
  };

  workspaces.push(newWorkspace);
  write(STORAGE_KEYS.WORKSPACES, workspaces);

  return { workspace: newWorkspace, role: ROLES.OWNER };
}

export async function joinWorkspace(inviteCode, userId) {
  await delay();

  if (!inviteCode || !inviteCode.trim()) {
    throw new Error('Invite code is required.');
  }
  if (!userId) {
    throw new Error('User ID is required to join a workspace.');
  }

  const workspaces = getWorkspaces();
  const workspaceIndex = workspaces.findIndex(
    w => w.inviteCode === inviteCode.trim().toUpperCase()
  );

  if (workspaceIndex === -1) {
    throw new Error('Invalid invite code. Please check and try again.');
  }

  const workspace = workspaces[workspaceIndex];

  // Check if already a member
  if (workspace.members.some(m => m.userId === userId)) {
    throw new Error('You are already a member of this workspace.');
  }

  // Add user as a member
  workspace.members.push({
    userId,
    role: ROLES.DEVELOPER
  });

  workspaces[workspaceIndex] = workspace;
  write(STORAGE_KEYS.WORKSPACES, workspaces);

  return { workspace, role: ROLES.DEVELOPER };
}

export async function getWorkspaceById(id) {
  const workspaces = getWorkspaces();
  return workspaces.find(w => w.id === id) || null;
}
