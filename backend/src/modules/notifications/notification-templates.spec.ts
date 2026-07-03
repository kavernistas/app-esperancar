import { getTemplate, NOTIFICATION_TEMPLATES } from './notification-templates';

describe('NotificationTemplates', () => {
  it('should return template for mission.assigned', () => {
    const t = getTemplate('mission.assigned');
    expect(t).not.toBeNull();
    expect(t?.type).toBe('MISSION_ASSIGNED');
    expect(t?.title).toBe('Nova missão atribuída');
    expect(t?.entityType).toBe('MISSION');
    expect(t?.mandatory).toBe(true);
  });

  it('should return template for demand.assigned', () => {
    const t = getTemplate('demand.assigned');
    expect(t).not.toBeNull();
    expect(t?.type).toBe('DEMAND_ASSIGNED');
  });

  it('should return template for team.member_added', () => {
    const t = getTemplate('team.member_added');
    expect(t).not.toBeNull();
    expect(t?.type).toBe('TEAM_MEMBER_ADDED');
  });

  it('should return null for unknown event', () => {
    const t = getTemplate('unknown.event');
    expect(t).toBeNull();
  });

  it('should generate safe actionUrl', () => {
    const t = getTemplate('mission.assigned');
    expect(t?.actionUrl?.('abc123')).toBe('/missions/abc123');
  });

  it('should not expose payload in title', () => {
    const t = getTemplate('mission.assigned');
    expect(t?.title).not.toContain('{{');
    expect(t?.title).not.toContain('{');
  });

  it('should have all required templates', () => {
    const expected = [
      'mission.assigned', 'mission.completed', 'mission.cancelled',
      'demand.assigned', 'demand.status_changed', 'demand.closed',
      'team.member_added', 'team.member_removed',
      'user.role_changed', 'user.deactivated',
      'invitation.accepted', 'invitation.revoked',
    ];
    for (const eventName of expected) {
      expect(NOTIFICATION_TEMPLATES[eventName]).toBeDefined();
    }
  });
});
