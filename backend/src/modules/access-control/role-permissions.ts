export const ROLE_PERMISSIONS: Record<string, string[]> = {
  ADMIN: [
    'organizations.read', 'organizations.update',
    'members.read', 'members.invite', 'members.update', 'members.deactivate', 'members.remove',
    'campaigns.read', 'campaigns.create', 'campaigns.update', 'campaigns.activate', 'campaigns.archive',
    'contacts.read', 'contacts.create', 'contacts.update', 'contacts.delete', 'contacts.export',
    'demands.read', 'demands.create', 'demands.update', 'demands.assign', 'demands.close', 'demands.delete',
    'missions.read', 'missions.create', 'missions.update', 'missions.assign', 'missions.complete', 'missions.approve', 'missions.delete',
    'teams.read', 'teams.create', 'teams.update', 'teams.manage_members', 'teams.delete',
    'reports.read', 'reports.export',
    'finance.read', 'finance.create', 'finance.update', 'finance.approve',
    'communications.read', 'communications.create', 'communications.send', 'communications.approve',
    'audit.read',
    'users.manage', 'roles.manage',
  ],
  COORDENADOR: [
    'contacts.read', 'contacts.create', 'contacts.update', 'contacts.export',
    'demands.read', 'demands.create', 'demands.update', 'demands.assign', 'demands.close',
    'missions.read', 'missions.create', 'missions.update', 'missions.assign', 'missions.complete',
    'campaigns.read', 'campaigns.create', 'campaigns.update', 'campaigns.activate', 'campaigns.archive',
    'teams.read', 'teams.create', 'teams.update', 'teams.manage_members',
    'reports.read', 'reports.export',
    'members.read',
  ],
  LIDERANCA: [
    'contacts.read', 'contacts.create',
    'demands.read', 'demands.create',
    'missions.read', 'missions.complete',
    'teams.read',
  ],
  OPERADOR: [
    'contacts.read', 'contacts.create', 'contacts.update',
    'demands.read', 'demands.create', 'demands.update',
    'missions.read', 'missions.update',
  ],
  FINANCEIRO: [
    'finance.read', 'finance.create', 'finance.update',
    'reports.read',
  ],
  COMUNICACAO: [
    'communications.read', 'communications.create',
    'contacts.read',
  ],
  LEITURA: [
    'contacts.read', 'demands.read', 'missions.read', 'campaigns.read', 'reports.read',
  ],
  USER: [],
};

export function normalizeRole(role?: string): string {
  return String(role ?? '').trim().toUpperCase();
}

export function roleHasPermission(role: string, permission: string): boolean {
  const r = normalizeRole(role);
  const perms = ROLE_PERMISSIONS[r] || [];
  return perms.includes('*') || perms.includes(permission);
}
