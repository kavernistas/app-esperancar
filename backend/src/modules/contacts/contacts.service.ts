import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateContactDto, UpdateContactDto, ListContactDto } from './dto';
import { AuditService } from '../audit/audit.service';
import { EventsService } from '../events/events.service';

function normalizeSortBy(sortBy?: string): string {
  if (!sortBy) return 'created_at';
  if (sortBy === 'created_date') return 'created_at';
  if (sortBy === 'updated_date') return 'updated_at';
  return sortBy;
}


@Injectable()
export class ContactsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private events: EventsService,
  ) {}

  async findAll(query: ListContactDto, userId?: string) {
    const {
      page = 1, limit = 50, search, sortBy = 'created_at', sortOrder = 'desc',
      status, city, neighborhood, is_leader, support_intent, electoral_zone,
    } = query;

    const where: Prisma.ContactWhereInput = { deleted_at: null };

    // Text search across multiple fields
    if (search) {
      where.OR = [
        { full_name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { neighborhood: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Filters
    if (status) where.status = status as any;
    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (neighborhood) where.neighborhood = { contains: neighborhood, mode: 'insensitive' };
    if (is_leader !== undefined) where.is_leader = is_leader === 'true';
    if (support_intent) where.support_intent = support_intent;
    if (electoral_zone) where.electoral_zone = electoral_zone;

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.contact.findMany({
        where,
        orderBy: { [normalizeSortBy(sortBy)]: sortOrder },
        skip,
        take: limit,
      }),
      this.prisma.contact.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const contact = await this.prisma.contact.findFirst({
      where: { id, deleted_at: null },
    });

    if (!contact) {
      throw new NotFoundException(`Contato ${id} nao encontrado`);
    }

    return contact;
  }

  async create(dto: CreateContactDto, userId?: string, userName?: string) {
    // Check duplicate phone
    if (dto.phone) {
      const existing = await this.prisma.contact.findFirst({
        where: { phone: dto.phone, deleted_at: null },
      });
      if (existing) {
        throw new ConflictException(`Telefone ${dto.phone} ja cadastrado`);
      }
    }

    const contact = await this.prisma.contact.create({
      data: {
        ...dto,
        status: dto.status as any,
        created_by_user_id: userId,
      },
    });

    await this.audit.log({
      action: 'create',
      entity: 'Contact',
      entity_id: contact.id,
      entity_label: contact.full_name,
      user_id: userId,
      user_name: userName,
      module: 'crm',
    });

    return contact;
  }

  async update(id: string, dto: UpdateContactDto, userId?: string, userName?: string) {
    const existing = await this.findOne(id);

    // Check duplicate phone if changed
    if (dto.phone && dto.phone !== existing.phone) {
      const duplicate = await this.prisma.contact.findFirst({
        where: { phone: dto.phone, deleted_at: null, NOT: { id } },
      });
      if (duplicate) {
        throw new ConflictException(`Telefone ${dto.phone} ja cadastrado`);
      }
    }

    const contact = await this.prisma.contact.update({
      where: { id },
      data: dto as any,
    });

    await this.audit.log({
      action: 'update',
      entity: 'Contact',
      entity_id: contact.id,
      entity_label: contact.full_name,
      user_id: userId,
      user_name: userName,
      module: 'crm',
      changes: { before: existing, after: contact },
    });

    return contact;
  }

  async remove(id: string, userId?: string, userName?: string) {
    const contact = await this.findOne(id);

    // Soft delete
    await this.prisma.contact.update({
      where: { id },
      data: { deleted_at: new Date() },
    });

    await this.audit.log({
      action: 'delete',
      entity: 'Contact',
      entity_id: id,
      entity_label: contact.full_name,
      user_id: userId,
      user_name: userName,
      module: 'crm',
    });

    return { id, deleted: true };
  }
}
