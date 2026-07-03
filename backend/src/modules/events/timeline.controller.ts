import { Controller, Get, Query, UseGuards, ForbiddenException, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { PrismaService } from '@/common/prisma.service';

@ApiTags('Timeline')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('timeline')
export class TimelineController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Timeline de uma entidade especifica' })
  async getTimeline(@Query() query: any, @CurrentUser() user: any) {
    const { entity_type, entity_id, campaign_id, event_name, date_from, date_to } = query;
    const orgId = user?.organization_id;

    if (!entity_type || !entity_id) {
      throw new ForbiddenException('entity_type e entity_id sao obrigatorios');
    }
    if (!orgId) throw new ForbiddenException('Organizacao nao identificada');

    const where: any = {
      organization_id: orgId,
      aggregate_type: entity_type,
      aggregate_id: entity_id,
    };
    if (campaign_id) where.campaign_id = campaign_id;
    if (event_name) where.event_name = event_name;
    if (date_from || date_to) {
      where.occurred_at = {};
      if (date_from) where.occurred_at.gte = new Date(date_from);
      if (date_to) where.occurred_at.lte = new Date(date_to);
    }

    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 50, 100);
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.internalEvent.findMany({
        where,
        orderBy: { occurred_at: 'desc' },
        skip,
        take: limit,
        include: {
          user: { select: { id: true, full_name: true, avatar_url: true } },
        },
      }),
      this.prisma.internalEvent.count({ where }),
    ]);

    return {
      data: data.map(e => {
        const payload = (e.payload || {}) as Record<string, any>;
        return {
          id: e.id,
          type: e.event_name,
          title: payload.title || e.event_name,
          description: payload.description || null,
          entity_type: e.aggregate_type,
          entity_id: e.aggregate_id,
          actor: e.user ? { id: e.user.id, name: e.user.full_name, avatar_url: e.user.avatar_url } : null,
          metadata: payload,
          occurred_at: e.occurred_at,
        };
      }),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}
