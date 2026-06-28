import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AccessControlService } from '../access-control/access-control.service';

@Injectable()
export class TeamsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private ac: AccessControlService,
  ) {}

  private async getOrgId(actorId: string): Promise<string> {
    const ctx = await this.ac.getContext(actorId);
    if (!ctx?.organizationId) throw new ForbiddenException('Usuário sem organização');
    return ctx.organizationId;
  }

  async findAll(query: any, actor: any) {
    const orgId = await this.getOrgId(actor.id);
    const { page = 1, limit = 50, search, campaignId } = query;
    const where: any = { deleted_at: null, organization_id: orgId, ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}), ...(campaignId ? { campaign_id: campaignId } : {}) };
    const [data, total] = await Promise.all([
      this.prisma.team.findMany({ where, include: { _count: { select: { members: true } } }, orderBy: { created_at: 'desc' }, skip: (Number(page) - 1) * Number(limit), take: Number(limit) }),
      this.prisma.team.count({ where }),
    ]);
    return { data, meta: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } };
  }

  async findOne(id: string, actor: any) {
    const orgId = await this.getOrgId(actor.id);
    const team = await this.prisma.team.findFirst({ where: { id, deleted_at: null, organization_id: orgId } });
    if (!team) throw new NotFoundException('Equipe não encontrada');
    return team;
  }

  async create(dto: any, actor: any) {
    const orgId = await this.getOrgId(actor.id);
    const team = await this.prisma.team.create({
      data: {
        organization_id: orgId,
        campaign_id: dto.campaign_id || null,
        name: dto.name,
        description: dto.description,
        created_by: actor.id,
      },
    });
    await this.audit.log({ action: 'create', entity: 'Team', entity_id: team.id, entity_label: team.name, user_id: actor.id, user_name: actor.full_name || actor.email, organization_id: orgId, module: 'teams' });
    return team;
  }

  async update(id: string, dto: any, actor: any) {
    await this.findOne(id, actor);
    const updated = await this.prisma.team.update({
      where: { id },
      data: { ...(dto.name && { name: dto.name }), ...(dto.description !== undefined && { description: dto.description }), ...(dto.campaign_id !== undefined && { campaign_id: dto.campaign_id }), ...(dto.active !== undefined && { active: dto.active }) },
    });
    await this.audit.log({ action: 'update', entity: 'Team', entity_id: id, entity_label: updated.name, user_id: actor.id, user_name: actor.full_name || actor.email, organization_id: updated.organization_id, module: 'teams' });
    return updated;
  }

  async remove(id: string, actor: any) {
    await this.findOne(id, actor);
    await this.prisma.team.update({ where: { id }, data: { deleted_at: new Date() } });
    await this.audit.log({ action: 'delete', entity: 'Team', entity_id: id, user_id: actor.id, user_name: actor.full_name || actor.email, module: 'teams' });
    return { id, deleted: true };
  }

  async getMembers(id: string, actor: any) {
    await this.findOne(id, actor);
    return this.prisma.teamMembership.findMany({
      where: { team_id: id, active: true },
      include: { user: { select: { id: true, email: true, full_name: true, role: true, status: true } } },
      orderBy: { joined_at: 'desc' },
    });
  }

  async addMember(id: string, userId: string, actor: any) {
    const team = await this.findOne(id, actor);
    const user = await this.prisma.user.findFirst({ where: { id: userId, deleted_at: null } });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    if (user.organization_id !== team.organization_id) throw new ForbiddenException('Usuário não pertence à organização');

    const existing = await this.prisma.teamMembership.findFirst({ where: { team_id: id, user_id: userId } });
    if (existing) {
      if (existing.active) throw new ConflictException('Usuário já é membro');
      await this.prisma.teamMembership.update({ where: { id: existing.id }, data: { active: true, left_at: null } });
    } else {
      await this.prisma.teamMembership.create({ data: { team_id: id, user_id: userId, active: true } });
    }
    await this.audit.log({ action: 'update', entity: 'Team', entity_id: id, entity_label: team.name + ' member_added=' + userId, user_id: actor.id, user_name: actor.full_name || actor.email, organization_id: team.organization_id, module: 'teams' });
    return { team_id: id, user_id: userId, active: true };
  }

  async removeMember(id: string, userId: string, actor: any) {
    const team = await this.findOne(id, actor);
    await this.prisma.teamMembership.updateMany({ where: { team_id: id, user_id: userId, active: true }, data: { active: false, left_at: new Date() } });
    await this.audit.log({ action: 'update', entity: 'Team', entity_id: id, entity_label: team.name + ' member_removed=' + userId, user_id: actor.id, user_name: actor.full_name || actor.email, organization_id: team.organization_id, module: 'teams' });
    return { team_id: id, user_id: userId, active: false };
  }
}
