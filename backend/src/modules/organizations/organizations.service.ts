import { Injectable, NotFoundException, ConflictException, ForbiddenException, BadRequestException } from '@nestjs/common';
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

  private async getUserOrg(userId: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { organization_id: true } });
    return user?.organization_id || null;
  }

  async findAll(userId: string) {
    const orgId = await this.getUserOrg(userId);
    if (!orgId) return [];
    const orgs = await this.prisma.organization.findMany({
      where: { id: orgId },
      orderBy: { created_at: 'desc' },
    });
    // Also include orgs where user has membership (not just primary)
    const memberships = await this.prisma.membership.findMany({
      where: { user_id: userId, is_active: true },
      select: { organization_id: true },
    });
    const orgIds = [...new Set([orgId, ...memberships.map(m => m.organization_id).filter(Boolean)])];
    return this.prisma.organization.findMany({
      where: { id: { in: orgIds as string[] } },
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const orgId = await this.getUserOrg(userId);
    const org = await this.prisma.organization.findFirst({
      where: { id },
      include: { _count: { select: { users: true, campaigns: true, contacts: true, missions: true } } },
    });
    if (!org) throw new NotFoundException('Organização não encontrada');
    if (org.id !== orgId) {
      const isMember = await this.prisma.membership.findFirst({ where: { user_id: userId, organization_id: id, is_active: true } });
      if (!isMember) throw new ForbiddenException('Sem acesso a esta organização');
    }
    return org;
  }

  async create(dto: CreateOrganizationDto, userId: string, userName: string) {
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

    // Set user primary org
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
      user_name: userName,
      module: 'organizations',
    });

    return org;
  }

  async update(id: string, dto: UpdateOrganizationDto, userId: string, userName: string) {
    const orgId = await this.getUserOrg(userId);
    if (id !== orgId) {
      const isAdmin = await this.prisma.membership.findFirst({ where: { user_id: userId, organization_id: id, role: 'ADMIN', is_active: true } });
      if (!isAdmin) throw new ForbiddenException('Sem acesso de administrador');
    }

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
      user_name: userName,
      module: 'organizations',
      changes: { before: org, after: updated },
    });

    return updated;
  }

  async getMembers(orgId: string, userId: string) {
    const userOrgId = await this.getUserOrg(userId);
    if (orgId !== userOrgId) {
      const isMember = await this.prisma.membership.findFirst({ where: { user_id: userId, organization_id: orgId, is_active: true } });
      if (!isMember) throw new ForbiddenException('Sem acesso');
    }
    return this.prisma.membership.findMany({
      where: { organization_id: orgId, is_active: true },
      include: { user: { select: { id: true, email: true, full_name: true, role: true } } },
      orderBy: { joined_at: 'desc' },
    });
  }
}
