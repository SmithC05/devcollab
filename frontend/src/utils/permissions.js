export const ROLES = {
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  LEAD: 'LEAD',
  DEVELOPER: 'DEVELOPER'
};

const ROLE_WEIGHTS = {
  [ROLES.OWNER]: 40,
  [ROLES.ADMIN]: 30,
  [ROLES.LEAD]: 20,
  [ROLES.DEVELOPER]: 10
};

export const hasAtLeastRole = (userRole, requiredRole) => {
  return (ROLE_WEIGHTS[userRole] || 0) >= (ROLE_WEIGHTS[requiredRole] || 0);
};

export const canInviteMembers = (userRole) => {
  return hasAtLeastRole(userRole, ROLES.ADMIN);
};

export const canRemoveMember = (currentUserRole, targetUserRole) => {
  if (!hasAtLeastRole(currentUserRole, ROLES.ADMIN)) return false;
  if (targetUserRole === ROLES.OWNER) return false;
  return true;
};

export const getAvailableRolesToInvite = (inviterRole) => {
  if (inviterRole === ROLES.OWNER) {
    return [ROLES.ADMIN, ROLES.LEAD, ROLES.DEVELOPER];
  }
  if (inviterRole === ROLES.ADMIN) {
    return [ROLES.LEAD, ROLES.DEVELOPER];
  }
  return [];
};
