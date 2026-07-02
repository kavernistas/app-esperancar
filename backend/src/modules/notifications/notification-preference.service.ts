import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma.service';

const DEFAULT_EVENTS = [
  'mission.assigned',
  'mission.completed',
  'mission.approved',
  'mission.cancelled',
  'demand.assigned',
  'demand.status_changed',
  'demand.closed',
  'team.member_added',
  'team.member_removed',
  'user.role_changed',
  'user.deactivated',
  'invitation.created',
  'invitation.accepted',
  'invitation.revoked',
];

@Injectable()
export class NotificationPreferenceService {
  constructor(private prisma: PrismaService) {}

  async getPreferences(userId: string, organizationId?: string) {
    const prefs = await this.prisma.notificationPreference.findMany({
      where: {
        user_id: userId,
        ...(organizationId ? { organization_id: organizationId } : {}),
      },
      orderBy: { event_name: 'asc' },
    });

    // Garantir que default events aparecem
    const existing = new Set(prefs.map(p => p.event_name));
    const result = [...prefs];
    for (const eventName of DEFAULT_EVENTS) {
      if (!existing.has(eventName)) {
        result.push({
          id: `default_${eventName}`,
          organization_id: organizationId || null,
          user_id: userId,
          event_name: eventName,
          in_app: true,
          email: false,
          whatsapp: false,
          created_at: new Date(),
          updated_at: new Date(),
        });
      }
    }
    return result;
  }

  async upsert(userId: string, eventName: string, prefs: { in_app?: boolean; email?: boolean; whatsapp?: boolean }, organizationId?: string) {
    const existing = await this.prisma.notificationPreference.findFirst({
      where: {
        user_id: userId,
        event_name: eventName,
        ...(organizationId
          ? { organization_id: organizationId }
          : { organization_id: null }),
      },
    });

    if (existing) {
      return this.prisma.notificationPreference.update({
        where: { id: existing.id },
        data: {
          in_app: prefs.in_app ?? existing.in_app,
          email: prefs.email ?? existing.email,
          whatsapp: prefs.whatsapp ?? existing.whatsapp,
        },
      });
    }

    return this.prisma.notificationPreference.create({
      data: {
        organization_id: organizationId,
        user_id: userId,
        event_name: eventName,
        in_app: prefs.in_app ?? true,
        email: prefs.email ?? false,
        whatsapp: prefs.whatsapp ?? false,
      },
    });
  }

  async shouldNotify(userId: string, eventName: string): Promise<{ in_app: boolean; email: boolean; whatsapp: boolean }> {
    const pref = await this.prisma.notificationPreference.findFirst({
      where: {
        user_id: userId,
        event_name: eventName,
      },
    });
    return {
      in_app: pref?.in_app ?? true,
      email: pref?.email ?? false,
      whatsapp: pref?.whatsapp ?? false,
    };
  }
}
