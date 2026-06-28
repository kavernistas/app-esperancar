import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateOrganizationDto, UpdateOrganizationDto, OrgPlan, OrgStatus } from './dto';
import { Prisma } from '@prisma/client';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60) || 'org';
}

@Injectable()
export class OrganizationsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async findAll(userOrgId: string) {
    return this.prisma.organization.findMany({
      where: { id: userOrgId },
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: string, userOrgId: string) {
    const org = await this.prisma.organization.findFirst({
      where: { id },
      include: { _count: { select: { users: true, campaigns: true, contacts: true, missions: true } } },
    });
    if (!org) throw new NotFoundException('Organização não encontrada');
    return org;
  }

  async create(dto: CreateOrganizationDto, userId: string, userEmail: string) {
    const slug = dto.slug || slugify(dto.name);

    const existing = await this.prisma.organization.findUnique({ where: { slug } });
    if (existing) throw new ConflictException('Já existe uma organização com este slug');

    const org = await this.prisma.organization.create({
      data: {
        name: dto.name,
        slug,
        document: dto.document,
        address: dto.address,
        phone: dto.phone,
        email: dto.email,
        plan: (dto.plan as OrgPlan) || 'free',
        status: 'active',
        owner_id: userId,
      },
    });

    // Auto-membership ADMIN
    await this.prisma.membership.create({
      data: {
        user_id: userId,
        organization_id: org.id,
        role: 'ADMIN',
        permissions: ['*'],
        is_active: true,
      },
    });

    // Set user org
    await this.prisma.user.update({
      where: { id: userId },
      data: { organization_id: org.id },
    });

    await this.audit.log({
      action: 'create',
      entity: 'Organization',
      entity_id: org.id,
      entity_label: org.name,
      user_id: userId,
      user_name: userEmail,
      module: 'organizations',
    });

    return org;
  }

  async update(id: string, dto: UpdateOrganizationDto, userOrgId: string, userId: string, userEmail: string) {
    if (id !== userOrgId) throw new ForbiddenException('Sem acesso a esta organização');

    const org = await this.prisma.organization.findFirst({ where: { id } });
    if (!org) throw new NotFoundException('Organização não encontrada');

    const updated = await this.prisma.organization.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.document !== undefined && { document: dto.document }),
        ...(dto.address !== undefined && { address: dto.address }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.plan && { plan: dto.plan as any }),
        ...(dto.status && { status: dto.status as any }),
      },
    });

    await this.audit.log({
      action: 'update',
      entity: 'Organization',
      entity_id: id,
      entity_label: updated.name,
      user_id: userId,
      user_name: userEmail,
      module: 'organizations',
      changes: { before: org, after: updated },
    });

    return updated;
  }

  async getMembers(orgId: string, userOrgId: string) {
    if (orgId !== userOrgId) throw new ForbiddenException('Sem acesso');
    return this.prisma.membership.findMany({
      where: { organization_id: orgId, is_active: true },
      include: { user: { select: { id: true, email: true, full_name: true, role: true } } },
      orderBy: { joined_at: 'desc' },
    });
  }
}
