import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { WhatsAppService } from './whatsapp.service';
import { WhatsAppSendDto, WhatsAppSingleSendDto, WhatsAppLogQueryDto } from './dto';

@ApiTags('WhatsApp')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('whatsapp')
export class WhatsAppController {
  constructor(private readonly service: WhatsAppService) {}

  @Post('send')
  @Roles('admin', 'coordenador', 'lideranca')
  @ApiOperation({ summary: 'Enviar mensagem WhatsApp (single ou batch)' })
  async send(@Body() dto: WhatsAppSendDto, @CurrentUser() user: any) {
    return this.service.sendBatch({
      contacts: dto.contacts,
      message: dto.message,
      campaignId: dto.campaignId,
      templateName: dto.templateName,
      userId: user?.id,
      userName: user?.full_name,
      delayMs: dto.delayMs,
      batchSize: dto.batchSize,
      batchPauseMs: dto.batchPauseMs,
    });
  }

  @Post('send-single')
  @Roles('admin', 'coordenador', 'lideranca')
  @ApiOperation({ summary: 'Enviar mensagem WhatsApp individual' })
  async sendSingle(@Body() dto: WhatsAppSingleSendDto, @CurrentUser() user: any) {
    return this.service.send({
      phone: dto.phone,
      message: dto.message,
      contactName: dto.contactName,
      campaignId: dto.campaignId,
      templateName: dto.templateName,
      userId: user?.id,
      userName: user?.full_name,
    });
  }

  @Get('logs')
  @Roles('admin', 'coordenador')
  @ApiOperation({ summary: 'Listar logs de mensagens' })
  async getLogs(@Query() query: WhatsAppLogQueryDto) {
    return this.service.getLogs(query);
  }

  @Get('stats')
  @Roles('admin', 'coordenador')
  @ApiOperation({ summary: 'Estatisticas de envio' })
  async getStats(@Query('campaignId') campaignId?: string) {
    return this.service.getLogStats(campaignId);
  }

  @Get('status')
  @ApiOperation({ summary: 'Status da integracao WhatsApp' })
  async getStatus() {
    return this.service.getStatus();
  }
}
