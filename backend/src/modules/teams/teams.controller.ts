import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { PermissionsGuard } from '@/modules/access-control/access-control.service';
import { RequirePermissions } from '@/modules/access-control/permissions.decorator';
import { TeamsService } from './teams.service';

@ApiTags('Teams')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('teams')
export class TeamsController {
  constructor(private readonly service: TeamsService) {}

  @Get()
  @RequirePermissions('teams.read')
  async findAll(@Query() query: any, @CurrentUser() user: any) {
    return this.service.findAll(query, user);
  }

  @Get(':id')
  @RequirePermissions('teams.read')
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.findOne(id, user);
  }

  @Post()
  @RequirePermissions('teams.create')
  async create(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.create(dto, user);
  }

  @Patch(':id')
  @RequirePermissions('teams.update')
  async update(@Param('id') id: string, @Body() dto: any, @CurrentUser() user: any) {
    return this.service.update(id, dto, user);
  }

  @Delete(':id')
  @RequirePermissions('teams.delete')
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.remove(id, user);
  }

  @Get(':id/members')
  @RequirePermissions('teams.read')
  async getMembers(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.getMembers(id, user);
  }

  @Post(':id/members')
  @RequirePermissions('teams.manage_members')
  async addMember(@Param('id') id: string, @Body() body: { userId: string }, @CurrentUser() user: any) {
    return this.service.addMember(id, body.userId, user);
  }

  @Delete(':id/members/:userId')
  @RequirePermissions('teams.manage_members')
  async removeMember(@Param('id') id: string, @Param('userId') userId: string, @CurrentUser() user: any) {
    return this.service.removeMember(id, userId, user);
  }
}
