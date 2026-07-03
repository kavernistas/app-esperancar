import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma.service';
import { CreateMissionDto, UpdateMissionDto, ListMissionDto } from './dto';
import { AuditService } from '../audit/audit.service';

function normalizeSortBy(sortBy?: string): string {
  if (!sortBy) return 'created_at';
  if (sortBy === 'created_date') return 'created_at';
  if (sortBy === 'updated_date') return 'updated_at';
  return sortBy;
}


@Injectable()
export class MissionsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async findAll(query: ListMissionDto, userId?: string) {
    const { page = 1, limit = 50, search, sortBy = 'created_at', sortOrder = 'desc', status, type, leader_id, priority } = query;
    const where: any = { deleted_at: null };
    if (search) where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
    if (status) where.status = status as any;
    if (type) where.type = type as any;
    if (leader_id) where.leader_id = leader_id;
    if (priority) where.priority = priority as any;

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.mission.findMany({ where, orderBy: { [normalizeSortBy(sortBy)]: sortOrder }, skip, take: limit, include: { leader: { select: { id: true, name: true } } } }),
      this.prisma.mission.count({ where }),
    ]);
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const mission = await this.prisma.mission.findFirst({ where: { id, deleted_at: null }, include: { leader: { select: { id: true, name: true } } } });
    if (!mission) throw new NotFoundException(`Missao ${id} nao encontrada`);
    return mission;
  }

  async create(dto: CreateMissionDto, userId?: string, userName?: string) {
    const mission = await this.prisma.mission.create({ data: { ...dto, created_by_user_id: userId } as any });
    await this.audit.log({ action: 'create', entity: 'mission', entity_id: mission.id, entity_label: mission.title, user_id: userId, user_name: userName, module: 'missions' });
    return mission;
  }

  async update(id: string, dto: UpdateMissionDto, userId?: string, userName?: string) {
    const existing = await this.findOne(id);
    const mission = await this.prisma.mission.update({ where: { id }, data: dto as any });
    await this.audit.log({ action: 'update', entity: 'mission', entity_id: mission.id, entity_label: mission.title, user_id: userId, user_name: userName, module: 'missions', changes: { before: existing, after: mission } });
    return mission;
  }

  async remove(id: string, userId?: string, userName?: string) {
    const mission = await this.findOne(id);
    await this.prisma.mission.update({ where: { id }, data: { deleted_at: new Date() } });
    await this.audit.log({ action: 'delete', entity: 'mission', entity_id: id, entity_label: mission.title, user_id: userId, user_name: userName, module: 'missions' });
    return { id, deleted: true };
  }
}
