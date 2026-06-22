import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma.service';

interface AuditLogData {
  action: string;
  entity: string;
  entity_id?: string;
  entity_label?: string;
  user_id?: string;
  user_name?: string;
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
          changes: data.changes,
          ip_address: data.ip_address,
          user_agent: data.user_agent,
          module: data.module,
          severity: data.severity || 'INFO',
          metadata: data.metadata,
        },
      });
    } catch (error) {
      // Audit log should not break the main operation
      console.error('Audit log failed:', error.message);
    }
  }
}
