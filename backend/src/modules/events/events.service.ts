import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma.service';

export interface EventData {
  organizationId?: string | null;
  campaignId?: string | null;
  userId?: string;
  type: string;
  title?: string;
  description?: string;
  entityType?: string;
  entityId?: string;
  entityLabel?: string;
  data?: any;
}

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  async emit(event: EventData) {
    try {
      return await this.prisma.internalEvent.create({
        data: {
          organization_id: event.organizationId,
          campaign_id: event.campaignId,
          user_id: event.userId,
          type: event.type,
          title: event.title,
          description: event.description,
          entity_type: event.entityType,
          entity_id: event.entityId,
          entity_label: event.entityLabel,
          data: event.data || {},
        },
      });
    } catch (e) {
      console.error('Event emit failed:', e.message);
      return null;
    }
  }

  async list(organizationId: string, params: any = {}) {
    const { page = 1, limit = 50, type, userId, entityType, campaignId } = params;
    const where: any = {
      organization_id: organizationId,
      ...(type ? { type } : {}),
      ...(userId ? { user_id: userId } : {}),
      ...(entityType ? { entity_type: entityType } : {}),
      ...(campaignId ? { campaign_id: campaignId } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.internalEvent.findMany({
        where,
        orderBy: { created_at: 'desc' },
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
