import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma.service';
import { CreateDemandDto, UpdateDemandDto, ListDemandDto } from './dto';
import { AuditService } from '../audit/audit.service';

function normalizeSortBy(sortBy?: string): string {
  if (!sortBy) return 'created_at';
  if (sortBy === 'created_date') return 'created_at';
  if (sortBy === 'updated_date') return 'updated_at';
  return sortBy;
}


@Injectable()
export class DemandsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async findAll(query: ListDemandDto, userId?: string) {
    const { page = 1, limit = 50, search, sortBy = 'created_at', sortOrder = 'desc', status, type, priority, city, neighborhood } = query;
    const where: any = { deleted_at: null };
    if (search) where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { protocol: { contains: search } },
      { requester_name: { contains: search, mode: 'insensitive' } },
    ];
    if (status) where.status = status as any;
    if (type) where.type = type as any;
    if (priority) where.priority = priority as any;
    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (neighborhood) where.neighborhood = { contains: neighborhood, mode: 'insensitive' };

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.demand.findMany({ where, orderBy: { [normalizeSortBy(sortBy)]: sortOrder }, skip, take: limit, include: { contact: { select: { id: true, full_name: true } } } }),
      this.prisma.demand.count({ where }),
    ]);
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const demand = await this.prisma.demand.findFirst({ where: { id, deleted_at: null }, include: { contact: { select: { id: true, full_name: true } } } });
    if (!demand) throw new NotFoundException(`Demanda ${id} nao encontrada`);
    return demand;
  }

  async create(dto: CreateDemandDto, userId?: string, userName?: string) {
    const count = await this.prisma.demand.count();
    const protocol = `ESP-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;
    const demand = await this.prisma.demand.create({ data: { ...dto, protocol, created_by_user_id: userId } as any });
    await this.audit.log({ action: 'create', entity: 'Demand', entity_id: demand.id, entity_label: demand.title, user_id: userId, user_name: userName, module: 'crm' });
    return demand;
  }

  async update(id: string, dto: UpdateDemandDto, userId?: string, userName?: string) {
    const existing = await this.findOne(id);
    const demand = await this.prisma.demand.update({ where: { id }, data: dto as any });
    await this.audit.log({ action: 'update', entity: 'Demand', entity_id: demand.id, entity_label: demand.title, user_id: userId, user_name: userName, module: 'crm', changes: { before: existing, after: demand } });
    return demand;
  }

  async remove(id: string, userId?: string, userName?: string) {
    const demand = await this.findOne(id);
    await this.prisma.demand.update({ where: { id }, data: { deleted_at: new Date() } });
    await this.audit.log({ action: 'delete', entity: 'Demand', entity_id: id, entity_label: demand.title, user_id: userId, user_name: userName, module: 'crm' });
    return { id, deleted: true };
  }
}
