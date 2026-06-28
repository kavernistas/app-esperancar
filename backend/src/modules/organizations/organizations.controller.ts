import { Controller, Get, Post, Patch, Param, Body, UseGuards, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto, UpdateOrganizationDto } from './dto';

@ApiTags('Organizations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly service: OrganizationsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar organizações do usuário' })
  async findAll(@CurrentUser() user: any) {
    return this.service.findAll(user?.organization_id);
  }

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Criar nova organização' })
  async create(@Body() dto: CreateOrganizationDto, @CurrentUser() user: any) {
    return this.service.create(dto, user?.id, user?.full_name || user?.email);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter organização por ID' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.findOne(id, user?.organization_id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Atualizar organização' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateOrganizationDto,
    @CurrentUser() user: any,
  ) {
    return this.service.update(id, dto, user?.organization_id, user?.id, user?.full_name || user?.email);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'Listar membros da organização' })
  async getMembers(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.getMembers(id, user?.organization_id);
  }
}
