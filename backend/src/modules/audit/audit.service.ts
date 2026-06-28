import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma.service';
import { AuditSeverity } from '@prisma/client';

interface AuditLogData {
  action: string;
  entity: string;
  entity_id?: string;
  entity_label?: string;
  user_id?: string;
  user_name?: string;
  organization_id?: string;
  campaign_id?: string;
  changes?: any;
  ip_address?: string;
  user_agent?: string;
  module?: string;
  severity?: string;
  metadata?: any;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(data: AuditLogData) {
    try {
      await this.prisma.auditLog.create({
        data: {
          action: data.action,
          entity: data.entity,
          entity_id: data.entity_id,
          entity_label: data.entity_label,
          user_id: data.user_id,
          user_name: data.user_name,
          organization_id: data.organization_id,
          campaign_id: data.campaign_id,
          changes: data.changes,
          ip_address: data.ip_address,
          user_agent: data.user_agent,
          module: data.module,
          severity: (data.severity || 'INFO') as AuditSeverity,
          metadata: data.metadata,
        },
      });
    } catch (error) {
      console.error('Audit log failed:', error.message);
    }
  }

  async findAll(query: any) {
    const { page = 1, limit = 50, entity, action, userId } = query;
    const where: any = {};
    if (entity) where.entity = entity;
    if (action) where.action = action;
    if (userId) where.user_id = userId;

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    return this.prisma.auditLog.findUnique({ where: { id } });
  }

  async create(dto: any) {
    return this.prisma.auditLog.create({ data: dto });
  }

  async update(id: string, dto: any) {
    return this.prisma.auditLog.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    return this.prisma.auditLog.delete({ where: { id } });
  }
}
