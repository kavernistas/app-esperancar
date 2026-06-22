import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { WhatsAppService } from './whatsapp.service';
import { CreateWhatsAppDto, UpdateWhatsAppDto, ListWhatsAppDto } from './dto';

@ApiTags('WhatsApp')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/whatsapp')
export class WhatsAppController {
  constructor(private readonly service: WhatsAppService) {}

  @Get()
  @ApiOperation({ summary: 'Listar whatsapp' })
  async findAll(@Query() query: ListWhatsAppDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter whatsapp por ID' })
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles('admin', 'coordenador')
  @ApiOperation({ summary: 'Criar whatsapp' })
  async create(@Body() dto: CreateWhatsAppDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Roles('admin', 'coordenador')
  @ApiOperation({ summary: 'Atualizar whatsapp' })
  async update(@Param('id') id: string, @Body() dto: UpdateWhatsAppDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Excluir whatsapp (soft delete)' })
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
