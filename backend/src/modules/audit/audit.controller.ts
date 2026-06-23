import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { AuditService } from './audit.service';
import { CreateAuditDto, UpdateAuditDto, ListAuditDto } from './dto';

@ApiTags('Audit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('audit-logs')
export class AuditController {
  constructor(private readonly service: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'Listar audit-logs' })
  async findAll(@Query() query: ListAuditDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter audit-logs por ID' })
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles('admin', 'coordenador')
  @ApiOperation({ summary: 'Criar audit-logs' })
  async create(@Body() dto: CreateAuditDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Roles('admin', 'coordenador')
  @ApiOperation({ summary: 'Atualizar audit-logs' })
  async update(@Param('id') id: string, @Body() dto: UpdateAuditDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Excluir audit-logs (soft delete)' })
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
