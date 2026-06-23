import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { MissionsService } from './missions.service';
import { CreateMissionDto, UpdateMissionDto, ListMissionDto } from './dto';

@ApiTags('Missions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('missions')
export class MissionsController {
  constructor(private readonly service: MissionsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar missoes com paginacao e filtros' })
  async findAll(@Query() query: ListMissionDto, @CurrentUser() user: any) {
    return this.service.findAll(query, user?.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter missao por ID' })
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles('admin', 'coordenador')
  @ApiOperation({ summary: 'Criar nova missao' })
  async create(@Body() dto: CreateMissionDto, @CurrentUser() user: any) {
    return this.service.create(dto, user?.id, user?.full_name);
  }

  @Patch(':id')
  @Roles('admin', 'coordenador')
  @ApiOperation({ summary: 'Atualizar missao' })
  async update(@Param('id') id: string, @Body() dto: UpdateMissionDto, @CurrentUser() user: any) {
    return this.service.update(id, dto, user?.id, user?.full_name);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Excluir missao (soft delete)' })
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.remove(id, user?.id, user?.full_name);
  }
}
