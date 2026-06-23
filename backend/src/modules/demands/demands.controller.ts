import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { DemandsService } from './demands.service';
import { CreateDemandDto, UpdateDemandDto, ListDemandDto } from './dto';

@ApiTags('Demands')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('demands')
export class DemandsController {
  constructor(private readonly service: DemandsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar demandas com paginacao e filtros' })
  async findAll(@Query() query: ListDemandDto, @CurrentUser() user: any) {
    return this.service.findAll(query, user?.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter demanda por ID' })
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles('admin', 'coordenador', 'lideranca')
  @ApiOperation({ summary: 'Criar nova demanda' })
  async create(@Body() dto: CreateDemandDto, @CurrentUser() user: any) {
    return this.service.create(dto, user?.id, user?.full_name);
  }

  @Patch(':id')
  @Roles('admin', 'coordenador')
  @ApiOperation({ summary: 'Atualizar demanda' })
  async update(@Param('id') id: string, @Body() dto: UpdateDemandDto, @CurrentUser() user: any) {
    return this.service.update(id, dto, user?.id, user?.full_name);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Excluir demanda (soft delete)' })
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.remove(id, user?.id, user?.full_name);
  }
}
