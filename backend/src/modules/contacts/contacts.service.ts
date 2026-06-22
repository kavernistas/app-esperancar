import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma.service';

@Injectable()
export class ContactsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: any) {
    const { page = 1, limit = 50, search, sortBy = 'created_at', sortOrder = 'desc', ...filters } = query;
    const where: any = { deleted_at: null };
    return {
      data: [],
      meta: { page, limit, total: 0 },
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
}
