export interface NotificationTemplate {
  type: string;
  title: string;
  message: string;
  entityType: string;
  actionUrl: ((id: string) => string) | null;
  allowSelfNotification?: boolean;
  mandatory?: boolean;
}

export const NOTIFICATION_TEMPLATES: Record<string, NotificationTemplate> = {
  'mission.assigned': {
    type: 'MISSION_ASSIGNED',
    title: 'Nova missão atribuída',
    message: 'Você recebeu uma nova missão.',
    entityType: 'MISSION',
    actionUrl: (id) => `/missions/${id}`,
    mandatory: true,
  },
  'mission.completed': {
    type: 'MISSION_COMPLETED',
    title: 'Missão concluída',
    message: 'Uma missão foi concluída.',
    entityType: 'MISSION',
    actionUrl: (id) => `/missions/${id}`,
  },
  'mission.cancelled': {
    type: 'MISSION_CANCELLED',
    title: 'Missão cancelada',
    message: 'Uma missão foi cancelada.',
    entityType: 'MISSION',
    actionUrl: (id) => `/missions/${id}`,
  },
  'demand.assigned': {
    type: 'DEMAND_ASSIGNED',
    title: 'Nova demanda atribuída',
    message: 'Uma demanda foi atribuída a você.',
    entityType: 'DEMAND',
    actionUrl: (id) => `/demands/${id}`,
    mandatory: true,
  },
  'demand.status_changed': {
    type: 'DEMAND_STATUS_CHANGED',
    title: 'Status da demanda atualizado',
    message: 'O status de uma demanda foi alterado.',
    entityType: 'DEMAND',
    actionUrl: (id) => `/demands/${id}`,
  },
  'demand.closed': {
    type: 'DEMAND_CLOSED',
    title: 'Demanda encerrada',
    message: 'Uma demanda foi encerrada.',
    entityType: 'DEMAND',
    actionUrl: (id) => `/demands/${id}`,
  },
  'team.member_added': {
    type: 'TEAM_MEMBER_ADDED',
    title: 'Você entrou em uma equipe',
    message: 'Você foi adicionado a uma equipe.',
    entityType: 'TEAM',
    actionUrl: (id) => `/teams/${id}`,
  },
  'team.member_removed': {
    type: 'TEAM_MEMBER_REMOVED',
    title: 'Você foi removido de uma equipe',
    message: 'Você foi removido de uma equipe.',
    entityType: 'TEAM',
    actionUrl: (id) => `/teams/${id}`,
  },
  'user.role_changed': {
    type: 'USER_ROLE_CHANGED',
    title: 'Seu perfil foi alterado',
    message: 'Seu papel na organização foi alterado.',
    entityType: 'USER',
    actionUrl: null,
    mandatory: true,
  },
  'user.deactivated': {
    type: 'USER_DEACTIVATED',
    title: 'Conta desativada',
    message: 'Sua conta foi desativada.',
    entityType: 'USER',
    actionUrl: null,
    mandatory: true,
  },
  'invitation.accepted': {
    type: 'INVITATION_ACCEPTED',
    title: 'Convite aceito',
    message: 'Um convite foi aceito.',
    entityType: 'INVITATION',
    actionUrl: (id) => `/admin/invitations`,
  },
  'invitation.revoked': {
    type: 'INVITATION_REVOKED',
    title: 'Convite revogado',
    message: 'Um convite foi revogado.',
    entityType: 'INVITATION',
    actionUrl: (id) => `/admin/invitations`,
  },
  'invitation.created': {
    type: 'INVITATION_CREATED',
    title: 'Novo convite criado',
    message: 'Um convite foi criado.',
    entityType: 'INVITATION',
    actionUrl: (id) => `/admin/invitations/${id}`,
    mandatory: true,
  },
  'campaign.activated': {
    type: 'CAMPAIGN_ACTIVATED',
    title: 'Campanha ativada',
    message: 'Uma campanha foi ativada.',
    entityType: 'CAMPAIGN',
    actionUrl: (id) => `/campaigns/${id}`,
    mandatory: true,
  },
};

export function getTemplate(eventName: string): NotificationTemplate | null {
  return NOTIFICATION_TEMPLATES[eventName] || null;
}
