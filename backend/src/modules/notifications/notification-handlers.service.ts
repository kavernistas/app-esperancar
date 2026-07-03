import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma.service';
import { NotificationService } from './notifications.service';
import { NotificationPreferenceService } from './notification-preference.service';
import { EventsService } from '../events/events.service';
import { getTemplate, NotificationTemplate } from './notification-templates';

interface InternalEventRecord {
  id: string;
  event_name: string;
  organization_id: string | null;
  campaign_id: string | null;
  aggregate_type: string | null;
  aggregate_id: string | null;
  user_id: string | null;
  payload: any;
  request_id: string | null;
  correlation_id: string | null;
}

@Injectable()
export class NotificationHandlersService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationService,
    private preferences: NotificationPreferenceService,
    private events: EventsService,
  ) {}

  /** Publica evento e processa handlers de notificação. */
  async publishAndHandle(event: {
    eventName: string;
    eventVersion?: number;
    organizationId?: string | null;
    campaignId?: string | null;
    aggregateType?: string;
    aggregateId?: string;
    actorUserId?: string | null;
    payload?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
    correlationId?: string;
    requestId?: string;
    occurredAt?: Date;
  }): Promise<string | null> {
    const eventId = await this.events.publish({
      ...event,
      type: event.eventName,
    });
    if (!eventId) return null;
    const stored = await this.prisma.internalEvent.findUnique({ where: { id: eventId } });
    if (stored) {
      await this.handle(stored);
    }
    return eventId;
  }

  async handle(event: InternalEventRecord): Promise<void> {
    const template = getTemplate(event.event_name);
    if (!template) return;

    try {
      const recipientId = await this.resolveRecipient(event, template);
      if (!recipientId) return;

      // Auto-notification check
      if (recipientId === event.user_id && !template.allowSelfNotification) return;

      // Preference check (skip for mandatory events)
      if (!template.mandatory && event.organization_id) {
        const pref = await this.preferences.shouldNotify(recipientId, event.event_name);
        if (!pref.in_app) return;
      }

      // Validate active membership
      const membership = await this.prisma.membership.findFirst({
        where: {
          user_id: recipientId,
          organization_id: event.organization_id ?? undefined,
          is_active: true,
        },
      });
      if (event.organization_id && !membership) return;

      const actionUrl = template.actionUrl && event.aggregate_id
        ? template.actionUrl(event.aggregate_id)
        : null;

      await this.notifications.createDeduplicated({
        organizationId: event.organization_id,
        campaignId: event.campaign_id,
        userId: recipientId,
        eventId: event.id,
        type: template.type,
        title: template.title,
        message: template.message,
        entityType: template.entityType,
        entityId: event.aggregate_id,
        actionUrl,
        metadata: { event_name: event.event_name, correlation_id: event.correlation_id, request_id: event.request_id },
      });
    } catch (error) {
      console.error('[NotificationHandlers] handle() falhou:', error?.message || error);
    }
  }

  private async resolveRecipient(event: InternalEventRecord, template: NotificationTemplate): Promise<string | null> {
    switch (event.event_name) {
      case 'mission.assigned':
      case 'mission.cancelled':
        return event.payload?.leader_id || event.payload?.assigned_to || null;
      case 'mission.completed': {
        const mission = await this.prisma.mission.findUnique({
          where: { id: event.aggregate_id ?? '' },
          select: { created_by_user_id: true },
        });
        return mission?.created_by_user_id || null;
      }
      case 'demand.assigned':
      case 'demand.status_changed':
      case 'demand.closed':
        return event.payload?.responsible_id || event.payload?.responsible || null;
      case 'team.member_added':
      case 'team.member_removed':
        return event.payload?.member_user_id || null;
      case 'user.role_changed':
      case 'user.deactivated':
        return event.aggregate_id || event.payload?.user_id || null;
      case 'invitation.accepted':
      case 'invitation.revoked':
        return event.payload?.user_id || null;
      default:
        return null;
    }
  }
}