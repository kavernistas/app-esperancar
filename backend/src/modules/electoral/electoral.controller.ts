import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { ElectoralService } from './electoral.service';
import { CreateElectoralDto, UpdateElectoralDto, ListElectoralDto } from './dto';

@ApiTags('Electoral')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/electoral-data')
export class ElectoralController {
  constructor(private readonly service: ElectoralService) {}

  @Get()
  @ApiOperation({ summary: 'Listar electoral-data' })
  async findAll(@Query() query: ListElectoralDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter electoral-data por ID' })
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles('admin', 'coordenador')
  @ApiOperation({ summary: 'Criar electoral-data' })
  async create(@Body() dto: CreateElectoralDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Roles('admin', 'coordenador')
  @ApiOperation({ summary: 'Atualizar electoral-data' })
  async update(@Param('id') id: string, @Body() dto: UpdateElectoralDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Excluir electoral-data (soft delete)' })
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
