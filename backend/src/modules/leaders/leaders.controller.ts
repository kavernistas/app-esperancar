import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { LeadersService } from './leaders.service';
import { CreateLeaderDto, UpdateLeaderDto, ListLeaderDto } from './dto';

@ApiTags('Leaders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('leaders')
export class LeadersController {
  constructor(private readonly service: LeadersService) {}

  @Get()
  @ApiOperation({ summary: 'Listar liderancas' })
  async findAll(@Query() query: ListLeaderDto, @CurrentUser() user: any) {
    return this.service.findAll(query, user?.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter lideranca por ID' })
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles('admin', 'coordenador')
  @ApiOperation({ summary: 'Criar lideranca' })
  async create(@Body() dto: CreateLeaderDto, @CurrentUser() user: any) {
    return this.service.create(dto, user?.id, user?.full_name);
  }

  @Patch(':id')
  @Roles('admin', 'coordenador')
  @ApiOperation({ summary: 'Atualizar lideranca' })
  async update(@Param('id') id: string, @Body() dto: UpdateLeaderDto, @CurrentUser() user: any) {
    return this.service.update(id, dto, user?.id, user?.full_name);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Excluir lideranca (soft delete)' })
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.remove(id, user?.id, user?.full_name);
  }
}
