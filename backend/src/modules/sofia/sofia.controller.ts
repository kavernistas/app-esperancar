import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { SofiaService } from './sofia.service';
import { CreateSofiaDto, UpdateSofiaDto, ListSofiaDto } from './dto';

@ApiTags('Sofia')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/sofia')
export class SofiaController {
  constructor(private readonly service: SofiaService) {}

  @Get()
  @ApiOperation({ summary: 'Listar sofia' })
  async findAll(@Query() query: ListSofiaDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter sofia por ID' })
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles('admin', 'coordenador')
  @ApiOperation({ summary: 'Criar sofia' })
  async create(@Body() dto: CreateSofiaDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Roles('admin', 'coordenador')
  @ApiOperation({ summary: 'Atualizar sofia' })
  async update(@Param('id') id: string, @Body() dto: UpdateSofiaDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Excluir sofia (soft delete)' })
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
