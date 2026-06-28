import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { PermissionsGuard } from '@/modules/access-control/access-control.service';
import { RequirePermissions } from '@/modules/access-control/permissions.decorator';
import { InvitationsService } from './invitations.service';

@ApiTags('Invitations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller()
export class InvitationsController {
  constructor(private readonly service: InvitationsService) {}

  @Get('organizations/:id/invitations')
  @RequirePermissions('members.read')
  async findAll(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.findAll(id, user);
  }

  @Post('organizations/:id/invitations')
  @RequirePermissions('members.invite')
  async create(@Param('id') id: string, @Body() dto: any, @CurrentUser() user: any) {
    return this.service.create(id, dto, user);
  }

  @Get('invitations/:id/revoke')
  @RequirePermissions('members.invite')
  async revoke(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.revoke(id, user);
  }
}
