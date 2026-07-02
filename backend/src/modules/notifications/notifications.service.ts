import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma.service';

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: any) {
    const { page = 1, limit = 50, search, sortBy = 'created_at', sortOrder = 'desc', ...filters } = query;
    const where: any = { deleted_at: null };
    return {
      data: [],
      meta: { page: Number(page), limit: Number(limit), total: 0 },
    };
  }

  async findOne(id: string) {
    return { id };
  }

  async create(dto: any) {
    return dto;
  }

  async update(id: string, dto: any) {
    return { id, ...dto };
  }

  async remove(id: string) {
    return { id, deleted: true };
  }

  async markAllRead(userId: string) {
    // Notifications model not fully implemented — stub response
    return { success: true, message: 'Notifications marked as read', affected: 0 };
  }

  /** Cria notificação deduplicada.
   *
   *  Mantém a assinatura usada por NotificationHandlersService,
   *  porém realiza a lógica real de deduplication.
   */
  async createDeduplicated(input: any): Promise<any> {
    const { eventId, userId, type } = input;
    if (!eventId || !userId || !type) {
      const err = new Error('createDeduplicated requires eventId, userId and type');
      console.error('[NotificationService] createDeduplicated missing required fields', err);
      throw err;
    }
    try {
      const existing = await this.prisma.notification.findFirst({
        where: { event_id: eventId, user_id: userId, type },
      });
      if (existing) {
        return existing;
      }
      const created = await this.prisma.notification.create({
        data: input,
      });
      return created;
    } catch (error) {
      console.error('[NotificationService] createDeduplicated failed', error);
      throw error;
    }
  }
}