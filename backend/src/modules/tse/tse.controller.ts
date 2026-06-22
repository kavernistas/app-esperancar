import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { TseService } from './tse.service';
import { CreateTseDto, UpdateTseDto, ListTseDto } from './dto';

@ApiTags('Tse')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/tse')
export class TseController {
  constructor(private readonly service: TseService) {}

  @Get()
  @ApiOperation({ summary: 'Listar tse' })
  async findAll(@Query() query: ListTseDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter tse por ID' })
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles('admin', 'coordenador')
  @ApiOperation({ summary: 'Criar tse' })
  async create(@Body() dto: CreateTseDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Roles('admin', 'coordenador')
  @ApiOperation({ summary: 'Atualizar tse' })
  async update(@Param('id') id: string, @Body() dto: UpdateTseDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Excluir tse (soft delete)' })
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
