import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateLeaderDto, UpdateLeaderDto, ListLeaderDto } from './dto';
import { AuditService } from '../audit/audit.service';

function normalizeSortBy(sortBy?: string): string {
  if (!sortBy) return 'created_at';
  if (sortBy === 'created_date') return 'created_at';
  if (sortBy === 'updated_date') return 'updated_at';
  return sortBy;
}


@Injectable()
export class LeadersService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async findAll(query: ListLeaderDto, userId?: string) {
    const { page = 1, limit = 50, search, sortBy = 'created_at', sortOrder = 'desc', status, city, neighborhood } = query;
    const where: Prisma.LeaderWhereInput = { deleted_at: null };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = status as any;
    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (neighborhood) where.neighborhood = { contains: neighborhood, mode: 'insensitive' };

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.leader.findMany({ where, orderBy: { [normalizeSortBy(sortBy)]: sortOrder }, skip, take: limit }),
      this.prisma.leader.count({ where }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const leader = await this.prisma.leader.findFirst({ where: { id, deleted_at: null } });
    if (!leader) throw new NotFoundException(`Lider ${id} nao encontrado`);
    return leader;
  }

  async create(dto: CreateLeaderDto, userId?: string, userName?: string) {
    const leader = await this.prisma.leader.create({ data: { ...dto, created_by_user_id: userId } as any });
    await this.audit.log({ action: 'create', entity: 'leader', entity_id: leader.id, entity_label: leader.name, user_id: userId, user_name: userName, module: 'crm' });
    return leader;
  }

  async update(id: string, dto: UpdateLeaderDto, userId?: string, userName?: string) {
    const existing = await this.findOne(id);
    const leader = await this.prisma.leader.update({ where: { id }, data: dto as any });
    await this.audit.log({ action: 'update', entity: 'leader', entity_id: leader.id, entity_label: leader.name, user_id: userId, user_name: userName, module: 'crm', changes: { before: existing, after: leader } });
    return leader;
  }

  async remove(id: string, userId?: string, userName?: string) {
    const leader = await this.findOne(id);
    await this.prisma.leader.update({ where: { id }, data: { deleted_at: new Date() } });
    await this.audit.log({ action: 'delete', entity: 'leader', entity_id: id, entity_label: leader.name, user_id: userId, user_name: userName, module: 'crm' });
    return { id, deleted: true };
  }
}
