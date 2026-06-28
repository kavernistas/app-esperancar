import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { PermissionsGuard } from '@/modules/access-control/access-control.service';
import { RequirePermissions } from '@/modules/access-control/permissions.decorator';
import { EventsService } from './events.service';

@ApiTags('Events')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller()
export class EventsController {
  constructor(private readonly events: EventsService) {}

  @Get('events')
  @RequirePermissions('audit.read')
  @ApiOperation({ summary: 'Listar eventos internos da organização' })
  async listEvents(@Query() query: any, @CurrentUser() user: any) {
    return this.events.list(user.organization_id, query);
  }

  @Get('audit-logs')
  @RequirePermissions('audit.read')
  @ApiOperation({ summary: 'Listar logs de auditoria da organização' })
  async listAudit(@Query() query: any, @CurrentUser() user: any) {
    return this.events.listAudit(user.organization_id, query);
  }
}
