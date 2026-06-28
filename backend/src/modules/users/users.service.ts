import { Injectable, NotFoundException, BadRequestException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AccessControlService } from '../access-control/access-control.service';
import * as bcrypt from 'bcrypt';
import { normalizeRole } from '../access-control/role-permissions';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private ac: AccessControlService,
  ) {}

  async findAll(query: any, actor: any) {
    const { page = 1, limit = 50, search, sortBy = 'created_at', sortOrder = 'desc', status, role, teamId } = query;
    const actorCtx = await this.ac.getContext(actor.id);
    const orgId = actorCtx?.organizationId;

    const where: any = {
      deleted_at: null,
      ...(orgId ? { organization_id: orgId } : { id: actor.id }),
      ...(search ? { OR: [{ full_name: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }] } : {}),
      ...(status ? { status } : {}),
      ...(role ? { role: normalizeRole(role) as any } : {}),
      ...(teamId ? { team_memberships: { some: { team_id: teamId, active: true } } } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: { id: true, email: true, full_name: true, phone: true, role: true, status: true, avatar_url: true, created_at: true, last_login_at: true, organization_id: true, active_campaign_id: true },
        orderBy: { [sortBy || 'created_at']: sortOrder || 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data, meta: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } };
  }

  async findOne(id: string, actor: any) {
    const actorCtx = await this.ac.getContext(actor.id);
    const user = await this.prisma.user.findFirst({ where: { id, deleted_at: null }, select: { id: true, email: true, full_name: true, phone: true, role: true, status: true, avatar_url: true, created_at: true, last_login_at: true, organization_id: true, active_campaign_id: true } });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    if (actorCtx?.organizationId && user.organization_id !== actorCtx.organizationId) throw new ForbiddenException('Acesso negado');
    return user;
  }

  async create(dto: any, actor: any) {
    const actorCtx = await this.ac.getContext(actor.id);
    if (!actorCtx?.organizationId) throw new BadRequestException('Ator sem organização');
    const orgId = actorCtx.organizationId;

    const email = dto.email?.toLowerCase().trim();
    if (!email) throw new BadRequestException('Email obrigatório');
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('Email já cadastrado');

    const role: any = normalizeRole(dto.role) || 'OPERADOR';
    if (dto.password && dto.password.length < 6) throw new BadRequestException('Senha deve ter no mínimo 6 caracteres');
    const password_hash = dto.password ? await bcrypt.hash(dto.password, 12) : await bcrypt.hash(Math.random().toString(36).slice(-10) + 'A@1', 12);

    const user = await this.prisma.user.create({
      data: {
        email,
        full_name: dto.full_name || email.split('@')[0],
        phone: dto.phone || null,
        role,
        status: (dto.status as any) || 'ACTIVE',
        password_hash,
        organization_id: orgId,
        active_campaign_id: actorCtx.activeCampaignId,
      },
      select: { id: true, email: true, full_name: true, role: true, status: true, organization_id: true, created_at: true },
    });

    await this.prisma.membership.create({ data: { user_id: user.id, organization_id: orgId, role, permissions: [], is_active: true } });

    await this.audit.log({
      action: 'create', entity: 'User', entity_id: user.id, entity_label: user.email,
      user_id: actor.id, user_name: actor.full_name || actor.email,
      organization_id: orgId, module: 'users',
    });

    return user;
  }

  async update(id: string, dto: any, actor: any) {
    const actorCtx = await this.ac.getContext(actor.id);
    const user = await this.prisma.user.findFirst({ where: { id, deleted_at: null } });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    if (actorCtx?.organizationId && user.organization_id !== actorCtx.organizationId) throw new ForbiddenException('Acesso negado');

    const newRole = dto.role ? (normalizeRole(dto.role) as any) : undefined;
    if (newRole === 'ADMIN' && actorCtx?.role !== 'ADMIN') throw new ForbiddenException('Somente ADMIN pode atribuir papel ADMIN');

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.full_name !== undefined && { full_name: dto.full_name }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.role && { role: newRole }),
        ...(dto.status && { status: dto.status as any }),
        ...(dto.active_campaign_id !== undefined && { active_campaign_id: dto.active_campaign_id }),
        ...(dto.password && dto.password.length >= 6 && { password_hash: await bcrypt.hash(dto.password, 12) }),
      },
      select: { id: true, email: true, full_name: true, role: true, status: true, organization_id: true, updated_at: true },
    });

    if (newRole && user.organization_id) {
      await this.prisma.membership.updateMany({ where: { user_id: id, organization_id: user.organization_id }, data: { role: newRole } });
    }

    await this.audit.log({
      action: 'update', entity: 'User', entity_id: id, entity_label: user.email,
      user_id: actor.id, user_name: actor.full_name || actor.email,
      organization_id: actorCtx?.organizationId, module: 'users',
      changes: { before: { role: user.role, status: user.status }, after: { role: newRole, status: dto.status } },
    });

    return updated;
  }

  async setRole(id: string, role: string, actor: any) {
    return this.update(id, { role }, actor);
  }

  async deactivate(id: string, actor: any) {
    const actorCtx = await this.ac.getContext(actor.id);
    const user = await this.prisma.user.findFirst({ where: { id, deleted_at: null } });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    if (actorCtx?.organizationId && user.organization_id !== actorCtx.organizationId) throw new ForbiddenException('Acesso negado');

    if (normalizeRole(user.role) === 'ADMIN' && user.status === 'ACTIVE') {
      const otherAdmins = await this.prisma.user.count({
        where: { organization_id: user.organization_id, role: 'ADMIN' as any, status: 'ACTIVE', id: { not: id }, deleted_at: null },
      });
      if (otherAdmins === 0) throw new ForbiddenException('Não é possível desativar o último administrador ativo');
    }

    await this.prisma.user.update({ where: { id }, data: { status: 'INACTIVE' as any } });
    await this.prisma.membership.updateMany({ where: { user_id: id, is_active: true }, data: { is_active: false } });
    await this.audit.log({ action: 'update', entity: 'User', entity_id: id, entity_label: user.email + ' deactivated', user_id: actor.id, user_name: actor.full_name || actor.email, organization_id: actorCtx?.organizationId, module: 'users' });
    return { id, status: 'INACTIVE' };
  }

  async activate(id: string, actor: any) {
    const actorCtx = await this.ac.getContext(actor.id);
    const user = await this.prisma.user.findFirst({ where: { id, deleted_at: null } });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    if (actorCtx?.organizationId && user.organization_id !== actorCtx.organizationId) throw new ForbiddenException('Acesso negado');

    await this.prisma.user.update({ where: { id }, data: { status: 'ACTIVE' as any } });
    await this.prisma.membership.updateMany({ where: { user_id: id, organization_id: user.organization_id }, data: { is_active: true } });
    await this.audit.log({ action: 'update', entity: 'User', entity_id: id, entity_label: user.email + ' activated', user_id: actor.id, user_name: actor.full_name || actor.email, organization_id: actorCtx?.organizationId, module: 'users' });
    return { id, status: 'ACTIVE' };
  }

  async remove(id: string, actor: any) {
    const actorCtx = await this.ac.getContext(actor.id);
    const user = await this.prisma.user.findFirst({ where: { id, deleted_at: null } });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    if (actorCtx?.organizationId && user.organization_id !== actorCtx.organizationId) throw new ForbiddenException('Acesso negado');
    if (user.id === actor.id) throw new ForbiddenException('Não é possível remover a si mesmo');

    if (normalizeRole(user.role) === 'ADMIN') {
      const otherAdmins = await this.prisma.user.count({ where: { organization_id: user.organization_id, role: 'ADMIN' as any, status: 'ACTIVE', id: { not: id }, deleted_at: null } });
      if (otherAdmins === 0) throw new ForbiddenException('Não é possível remover o último administrador');
    }

    await this.prisma.user.update({ where: { id }, data: { deleted_at: new Date() } });
    await this.audit.log({ action: 'delete', entity: 'User', entity_id: id, entity_label: user.email, user_id: actor.id, user_name: actor.full_name || actor.email, organization_id: actorCtx?.organizationId, module: 'users' });
    return { id, deleted: true };
  }
}
