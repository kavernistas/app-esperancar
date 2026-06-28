import { Controller, Get, Post, Patch, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { PermissionsGuard } from '@/modules/access-control/access-control.service';
import { RequirePermissions } from '@/modules/access-control/permissions.decorator';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, ListUserDto } from './dto';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Get()
  @RequirePermissions('members.read')
  @ApiOperation({ summary: 'Listar usuários da organização' })
  async findAll(@Query() query: ListUserDto, @CurrentUser() user: any) {
    return this.service.findAll(query, user);
  }

  @Get(':id')
  @RequirePermissions('members.read')
  @ApiOperation({ summary: 'Obter usuário por ID' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.findOne(id, user);
  }

  @Post()
  @RequirePermissions('members.invite')
  @ApiOperation({ summary: 'Criar usuário na organização' })
  async create(@Body() dto: CreateUserDto, @CurrentUser() user: any) {
    return this.service.create(dto, user);
  }

  @Patch(':id')
  @RequirePermissions('members.update')
  @ApiOperation({ summary: 'Atualizar usuário' })
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto, @CurrentUser() user: any) {
    return this.service.update(id, dto, user);
  }

  @Patch(':id/role')
  @RequirePermissions('roles.manage')
  @ApiOperation({ summary: 'Alterar papel do usuário' })
  async setRole(@Param('id') id: string, @Body() body: { role: string }, @CurrentUser() user: any) {
    return this.service.setRole(id, body.role, user);
  }

  @Post(':id/activate')
  @RequirePermissions('members.update')
  @ApiOperation({ summary: 'Ativar usuário' })
  async activate(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.activate(id, user);
  }

  @Post(':id/deactivate')
  @RequirePermissions('members.deactivate')
  @ApiOperation({ summary: 'Desativar usuário' })
  async deactivate(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.deactivate(id, user);
  }

  @Delete(':id')
  @RequirePermissions('members.remove')
  @ApiOperation({ summary: 'Remover usuário (soft delete)' })
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.remove(id, user);
  }
}
