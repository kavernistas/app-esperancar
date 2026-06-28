import { Injectable, NotFoundException, ForbiddenException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AccessControlService } from '../access-control/access-control.service';
import { randomBytes, createHash } from 'crypto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class InvitationsService {
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

  async findAll(orgId: string, actor: any) {
    const actorOrgId = await this.getOrgId(actor.id);
    if (orgId !== actorOrgId) throw new ForbiddenException('Sem acesso');
    return this.prisma.invitation.findMany({ where: { organization_id: orgId }, orderBy: { created_at: 'desc' } });
  }

  async create(orgId: string, dto: any, actor: any) {
    const actorOrgId = await this.getOrgId(actor.id);
    if (orgId !== actorOrgId) throw new ForbiddenException('Sem acesso');

    const email = dto.email?.toLowerCase().trim();
    if (!email) throw new BadRequestException('Email obrigatório');

    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser && existingUser.organization_id === orgId) throw new ConflictException('Usuário já pertence à organização');

    const activeInvite = await this.prisma.invitation.findFirst({ where: { organization_id: orgId, email, accepted_at: null, expires_at: { gt: new Date() } } });
    if (activeInvite) throw new ConflictException('Já existe convite ativo para este email');

    const token = randomBytes(32).toString('hex');
    const token_hash = createHash('sha256').update(token).digest('hex');
    const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invitation = await this.prisma.invitation.create({
      data: { organization_id: orgId, campaign_id: dto.campaign_id || null, email, role: dto.role || 'OPERADOR', token_hash, expires_at, invited_by: actor.id },
    });

    await this.audit.log({ action: 'create', entity: 'Invitation', entity_id: invitation.id, entity_label: email, user_id: actor.id, user_name: actor.full_name || actor.email, organization_id: orgId, module: 'invitations' });

    return { ...invitation, invite_token: token, invite_link: `/invitations/accept?token=${token}` };
  }

  async accept(token: string, userId: string) {
    if (!token) throw new BadRequestException('Token obrigatório');
    const token_hash = createHash('sha256').update(token).digest('hex');
    const invitation = await this.prisma.invitation.findUnique({ where: { token_hash } });
    if (!invitation) throw new NotFoundException('Convite inválido');
    if (invitation.accepted_at) throw new ConflictException('Convite já utilizado');
    if (new Date(invitation.expires_at) < new Date()) throw new BadRequestException('Convite expirado');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    if (user.email !== invitation.email) throw new BadRequestException('Email do convite não corresponde ao usuário');

    await this.prisma.invitation.update({ where: { id: invitation.id }, data: { accepted_at: new Date() } });
    await this.prisma.membership.upsert({
      where: { id: userId + '_' + invitation.organization_id },
      update: { is_active: true },
      create: { id: userId + '_' + invitation.organization_id, user_id: userId, organization_id: invitation.organization_id, campaign_id: invitation.campaign_id, role: invitation.role, is_active: true },
    });
    await this.prisma.user.update({ where: { id: userId }, data: { organization_id: invitation.organization_id, active_campaign_id: invitation.campaign_id || user.active_campaign_id, status: 'ACTIVE' } });

    await this.audit.log({ action: 'update', entity: 'Invitation', entity_id: invitation.id, entity_label: invitation.email + ' accepted', user_id: userId, module: 'invitations', organization_id: invitation.organization_id });

    return { invitation_id: invitation.id, organization_id: invitation.organization_id };
  }

  async revoke(invitationId: string, actor: any) {
    await this.getOrgId(actor.id);
    const invitation = await this.prisma.invitation.findFirst({ where: { id: invitationId } });
    if (!invitation) throw new NotFoundException('Convite não encontrado');
    if (invitation.accepted_at) throw new ConflictException('Convite já aceito');
    await this.prisma.invitation.update({ where: { id: invitationId }, data: { expires_at: new Date() } });
    await this.audit.log({ action: 'update', entity: 'Invitation', entity_id: invitationId, entity_label: invitation.email + ' revoked', user_id: actor.id, user_name: actor.full_name || actor.email, organization_id: invitation.organization_id, module: 'invitations' });
    return { id: invitationId, revoked: true };
  }
}
