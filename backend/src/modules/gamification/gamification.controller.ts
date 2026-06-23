import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { GamificationService } from './gamification.service';
import { CreateGamificationDto, UpdateGamificationDto, ListGamificationDto } from './dto';

@ApiTags('Gamification')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('gamification')
export class GamificationController {
  constructor(private readonly service: GamificationService) {}

  @Get()
  @ApiOperation({ summary: 'Listar gamification' })
  async findAll(@Query() query: ListGamificationDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter gamification por ID' })
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles('admin', 'coordenador')
  @ApiOperation({ summary: 'Criar gamification' })
  async create(@Body() dto: CreateGamificationDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Roles('admin', 'coordenador')
  @ApiOperation({ summary: 'Atualizar gamification' })
  async update(@Param('id') id: string, @Body() dto: UpdateGamificationDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Excluir gamification (soft delete)' })
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
