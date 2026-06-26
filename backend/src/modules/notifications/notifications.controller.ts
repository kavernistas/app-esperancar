import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { NotificationService } from './notifications.service';
import { CreateNotificationDto, UpdateNotificationDto, ListNotificationDto } from './dto';

@ApiTags('Notification')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private readonly service: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'Listar notifications' })
  async findAll(@Query() query: ListNotificationDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter notifications por ID' })
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles('admin', 'coordenador')
  @ApiOperation({ summary: 'Criar notifications' })
  async create(@Body() dto: CreateNotificationDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Roles('admin', 'coordenador')
  @ApiOperation({ summary: 'Atualizar notifications' })
  async update(@Param('id') id: string, @Body() dto: UpdateNotificationDto) {
    return this.service.update(id, dto);
  }

  @Post('mark-all-read')
  @ApiOperation({ summary: 'Marcar todas as notificacoes como lidas' })
  async markAllRead(@CurrentUser() user: any) {
    return this.service.markAllRead(user?.id);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Excluir notifications (soft delete)' })
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
