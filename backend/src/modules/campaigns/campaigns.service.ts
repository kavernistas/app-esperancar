import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateCampaignDto, UpdateCampaignDto, ListCampaignDto } from './dto';
import { CampaignStatus } from '@prisma/client';

@Injectable()
export class CampaignService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async findAll(query: ListCampaignDto, orgId: string) {
    const { page = 1, limit = 50, search, sortBy = 'created_at', sortOrder = 'desc' } = query;
    const where: any = {
      deleted_at: null,
      organization_id: orgId,
      ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.campaign.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.campaign.count({ where }),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string, orgId: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id, organization_id: orgId, deleted_at: null },
      include: { _count: { select: { contacts: true, demands: true, missions: true } } },
    });
    if (!campaign) throw new NotFoundException('Campanha não encontrada');
    return campaign;
  }

  async create(dto: CreateCampaignDto, orgId: string, userId: string, userName: string) {
    const campaign = await this.prisma.campaign.create({
      data: {
        name: dto.name,
        type: dto.type as any,
        year: dto.year,
        position: dto.position as any,
        candidate_name: dto.candidate_name,
        party: dto.party,
        coalition: dto.coalition,
        vote_goal: dto.vote_goal || 0,
        budget: dto.budget || 0,
        status: 'PLANNING',
        start_date: dto.start_date,
        end_date: dto.end_date,
        organization_id: orgId,
        created_by: userId,
      },
    });

    await this.prisma.membership.upsert({
      where: { id: userId + '_' + campaign.id },
      update: {},
      create: {
        id: userId + '_' + campaign.id,
        user_id: userId,
        organization_id: orgId,
        campaign_id: campaign.id,
        role: 'ADMIN',
        permissions: ['*'],
        is_active: true,
      },
    });

    await this.audit.log({
      action: 'create',
      entity: 'Campaign',
      entity_id: campaign.id,
      entity_label: campaign.name,
      user_id: userId,
      user_name: userName,
      organization_id: orgId,
      module: 'campaigns',
    });

    return campaign;
  }

  async update(id: string, dto: UpdateCampaignDto, orgId: string, userId: string, userName: string) {
    await this.findOne(id, orgId);

    const updated = await this.prisma.campaign.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.year && { year: dto.year }),
        ...(dto.position && { position: dto.position as any }),
        ...(dto.candidate_name !== undefined && { candidate_name: dto.candidate_name }),
        ...(dto.party !== undefined && { party: dto.party }),
        ...(dto.vote_goal !== undefined && { vote_goal: dto.vote_goal }),
        ...(dto.budget !== undefined && { budget: dto.budget }),
        ...(dto.status && { status: dto.status as any }),
        ...(dto.start_date && { start_date: dto.start_date }),
        ...(dto.end_date && { end_date: dto.end_date }),
      },
    });

    await this.audit.log({
      action: 'update',
      entity: 'Campaign',
      entity_id: id,
      entity_label: updated.name,
      user_id: userId,
      user_name: userName,
      organization_id: orgId,
      module: 'campaigns',
    });

    return updated;
  }

  async remove(id: string, orgId: string, userId: string, userName: string) {
    await this.findOne(id, orgId);
    await this.prisma.campaign.update({ where: { id }, data: { deleted_at: new Date() } });

    await this.audit.log({
      action: 'delete',
      entity: 'Campaign',
      entity_id: id,
      user_id: userId,
      user_name: userName,
      organization_id: orgId,
      module: 'campaigns',
    });

    return { id, deleted: true };
  }

  async getActiveCampaign(userId: string, orgId: string, activeCampaignId?: string) {
    if (!activeCampaignId) {
      const first = await this.prisma.campaign.findFirst({
        where: { organization_id: orgId, deleted_at: null, status: 'ACTIVE' },
        orderBy: { created_at: 'desc' },
      });
      return first;
    }
    return this.prisma.campaign.findFirst({
      where: { id: activeCampaignId, organization_id: orgId, deleted_at: null },
    });
  }

  async activate(campaignId: string, userId: string, orgId: string, userName: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id: campaignId, organization_id: orgId, deleted_at: null },
    });
    if (!campaign) throw new NotFoundException('Campanha não encontrada ou sem acesso');

    // Deactivate other campaigns in org
    await this.prisma.campaign.updateMany({
      where: { organization_id: orgId, status: 'ACTIVE', id: { not: campaignId } },
      data: { status: 'PLANNING' },
    });

    // Activate this one
    await this.prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'ACTIVE' },
    });

    // Set user active campaign
    await this.prisma.user.update({
      where: { id: userId },
      data: { active_campaign_id: campaignId },
    });

    await this.audit.log({
      action: 'update',
      entity: 'Campaign',
      entity_id: campaign.id,
      entity_label: campaign.name + ' activated',
      user_id: userId,
      user_name: userName,
      organization_id: orgId,
      module: 'campaigns',
    });

    return campaign;
  }
}
