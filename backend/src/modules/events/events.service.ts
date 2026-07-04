import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma.service';

export interface EventData {
  organizationId?: string | null;
  campaignId?: string | null;
  userId?: string | null;
  type: string;
  title?: string;
  description?: string;
  entityType?: string;
  entityId?: string;
  entityLabel?: string;
  data?: any;
  metadata?: any;
  correlationId?: string;
  requestId?: string;
}

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  async publish(event: EventData): Promise<string | null> {
    try {
      const result = await this.prisma.internalEvent.create({
        data: {
          organization_id: event.organizationId ?? null,
          campaign_id: event.campaignId ?? null,
          user_id: event.userId ?? null,
          event_name: event.type,
          event_version: 1,
          aggregate_type: event.entityType ?? null,
          aggregate_id: event.entityId ?? null,
          payload: {
            ...(event.data || {}),
            title: event.title,
            description: event.description,
            entity_label: event.entityLabel,
          },
          metadata: event.metadata || {},
          correlation_id: event.correlationId ?? null,
          request_id: event.requestId ?? null,
        },
      });

      return result.id ?? null;
    } catch (e: any) {
      console.error('Event publish failed:', e?.message || e);
      return null;
    }
  }

  async emit(event: EventData): Promise<string | null> {
    return this.publish(event);
  }

  async list(organizationId: string, params: any = {}) {
    const { page = 1, limit = 50, type, event_name, userId, entityType, entityId, campaignId } = params;

    const where: any = {
      organization_id: organizationId,
      ...(type || event_name ? { event_name: event_name || type } : {}),
      ...(userId ? { user_id: userId } : {}),
      ...(entityType ? { aggregate_type: entityType } : {}),
      ...(entityId ? { aggregate_id: entityId } : {}),
      ...(campaignId ? { campaign_id: campaignId } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.internalEvent.findMany({
        where,
        orderBy: { occurred_at: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        include: { user: { select: { id: true, full_name: true, email: true, avatar_url: true } } },
      }),
      this.prisma.internalEvent.count({ where }),
    ]);

    return { data, meta: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } };
  }

  async listAudit(organizationId: string, params: any = {}) {
    const { page = 1, limit = 50, action, entityType, userId } = params;

    const where: any = {
      organization_id: organizationId,
      ...(action ? { action } : {}),
      ...(entityType ? { entity: entityType } : {}),
      ...(userId ? { user_id: userId } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        include: { user: { select: { id: true, full_name: true, email: true } } },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data, meta: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } };
  }
}
