import api from './client';

export async function listInvitations(orgId) { return api.get(`/organizations/${orgId}/invitations`); }
export async function createInvitation(orgId, data) { return api.post(`/organizations/${orgId}/invitations`, data); }
export async function revokeInvitation(invitationId) { return api.get(`/invitations/${invitationId}/revoke`); }
export async function listRolePermissions() {
  // Static matrix - to be replaced by API later
  return { data: ROLE_PERMISSIONS };
}

export const ROLE_PERMISSIONS = {
  ADMIN: ["organizations.read", "organizations.update", "members.read", "members.invite", "members.update", "members.deactivate", "members.remove", "campaigns.read", "campaigns.create", "campaigns.update", "campaigns.activate", "campaigns.archive", "contacts.read", "contacts.create", "contacts.update", "contacts.delete", "contacts.export", "demands.read", "demands.create", "demands.update", "demands.assign", "demands.close", "demands.delete", "missions.read", "missions.create", "missions.update", "missions.assign", "missions.complete", "missions.approve", "missions.delete", "teams.read", "teams.create", "teams.update", "teams.manage_members", "teams.delete", "reports.read", "reports.export", "audit.read", "users.manage", "roles.manage"],
  COORDENADOR: ["contacts.read", "contacts.create", "contacts.update", "contacts.export", "demands.read", "demands.create", "demands.update", "demands.assign", "demands.close", "missions.read", "missions.create", "missions.update", "missions.assign", "missions.complete", "campaigns.read", "campaigns.create", "campaigns.update", "campaigns.activate", "campaigns.archive", "teams.read", "teams.create", "teams.update", "teams.manage_members", "reports.read", "reports.export", "members.read"],
  LIDERANCA: ["contacts.read", "contacts.create", "demands.read", "demands.create", "missions.read", "missions.complete", "teams.read"],
  OPERADOR: ["contacts.read", "contacts.create", "contacts.update", "demands.read", "demands.create", "demands.update", "missions.read", "missions.update"],
  FINANCEIRO: ["finance.read", "finance.create", "finance.update", "reports.read"],
  COMUNICACAO: ["communications.read", "communications.create", "contacts.read"],
  LEITURA: ["contacts.read", "demands.read", "missions.read", "campaigns.read", "reports.read"],
  USER: [],
};

export const ALL_PERMISSIONS = [...new Set(Object.values(ROLE_PERMISSIONS).flat())];
export const ALL_ROLES = Object.keys(ROLE_PERMISSIONS);
