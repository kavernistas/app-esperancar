import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/common/prisma.service';
import { AuditService } from '../audit/audit.service';

export interface WhatsAppSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

@Injectable()
export class WhatsAppService {
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly instance: string;

  // Rate limiting state
  private sentLog = { hourly: 0, daily: 0, hourStart: Date.now(), dayStart: Date.now() };

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
    private audit: AuditService,
  ) {
    this.apiUrl = config.get('EVOLUTION_API_URL', '');
    this.apiKey = config.get('EVOLUTION_API_KEY', '');
    this.instance = config.get('EVOLUTION_INSTANCE', 'esperancar');
  }

  // ============ SEND MESSAGE ============

  async send(options: {
    phone: string;
    message: string;
    contactId?: string;
    contactName?: string;
    campaignId?: string;
    templateName?: string;
    userId?: string;
    userName?: string;
    metadata?: any;
  }): Promise<WhatsAppSendResult> {
    const { phone, message, contactId, contactName, campaignId, templateName, userId, userName, metadata } = options;

    // Format phone
    const formattedPhone = this.formatPhone(phone);
    if (!formattedPhone) {
      throw new BadRequestException(`Telefone invalido: ${phone}`);
    }

    // Check rate limits
    this.resetCounters();
    if (this.sentLog.hourly >= 30) {
      throw new BadRequestException('Limite horario de mensagens atingido (30/hora)');
    }
    if (this.sentLog.daily >= 200) {
      throw new BadRequestException('Limite diario de mensagens atingido (200/dia)');
    }

    // Send via Evolution API
    let result: WhatsAppSendResult;
    try {
      result = await this.callEvolutionApi(formattedPhone, message);
    } catch (error) {
      // Log failure
      await this.logMessage({
        recipientPhone: formattedPhone,
        recipientName: contactName,
        recipientType: 'apoiador',
        campaignId,
        templateName,
        messageContent: message,
        status: 'FAILED',
        sentById: userId,
        sentByName: userName,
        errorMessage: error.message,
        metadata,
      });

      throw error;
    }

    // Update rate counters
    this.sentLog.hourly++;
    this.sentLog.daily++;

    // Log success
    await this.logMessage({
      recipientPhone: formattedPhone,
      recipientName: contactName,
      recipientType: 'apoiador',
      campaignId,
      templateName,
      messageContent: message,
      status: 'SENT',
      sentById: userId,
      sentByName: userName,
      metadata: { ...metadata, messageId: result.messageId },
    });

    await this.audit.log({
      action: 'send_whatsapp',
      entity: 'WhatsAppLog',
      entity_label: formattedPhone,
      user_id: userId,
      user_name: userName,
      module: 'whatsapp',
      metadata: { campaignId, templateName },
    });

    return result;
  }

  // ============ SEND BATCH ============

  async sendBatch(options: {
    contacts: Array<{ id?: string; phone: string; name?: string }>;
    message: string;
    campaignId?: string;
    templateName?: string;
    userId?: string;
    userName?: string;
    delayMs?: number;
    batchSize?: number;
    batchPauseMs?: number;
  }): Promise<{ total: number; sent: number; failed: number; errors: string[] }> {
    const {
      contacts, message, campaignId, templateName, userId, userName,
      delayMs = 1500, batchSize = 8, batchPauseMs = 45000,
    } = options;

    const result = { total: contacts.length, sent: 0, failed: 0, errors: [] as string[] };

    for (let i = 0; i < contacts.length; i += batchSize) {
      const batch = contacts.slice(i, i + batchSize);

      for (const contact of batch) {
        try {
          await this.send({
            phone: contact.phone,
            message,
            contactId: contact.id,
            contactName: contact.name,
            campaignId,
            templateName,
            userId,
            userName,
            metadata: { batch: Math.floor(i / batchSize) + 1 },
          });
          result.sent++;
        } catch (error) {
          result.failed++;
          result.errors.push(`${contact.phone}: ${error.message}`);
        }

        // Delay between messages
        if (delayMs > 0) {
          await this.sleep(delayMs + Math.random() * delayMs * 0.3);
        }
      }

      // Pause between batches
      if (i + batchSize < contacts.length && batchPauseMs > 0) {
        await this.sleep(batchPauseMs);
      }
    }

    return result;
  }

  // ============ MESSAGE LOGS ============

  async getLogs(query: {
    campaignId?: string;
    status?: string;
    sentById?: string;
    page?: number;
    limit?: number;
  }) {
    const { page = 1, limit = 50, campaignId, status, sentById } = query;
    const where: any = {};
    if (campaignId) where.campaign_id = campaignId;
    if (status) where.status = status;
    if (sentById) where.sent_by_id = sentById;

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.whatsAppLog.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
        include: { campaign: { select: { id: true, name: true } } },
      }),
      this.prisma.whatsAppLog.count({ where }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getLogStats(campaignId?: string) {
    const where: any = {};
    if (campaignId) where.campaign_id = campaignId;

    const stats = await this.prisma.whatsAppLog.groupBy({
      by: ['status'],
      where,
      _count: { status: true },
    });

    const result: Record<string, number> = { total: 0 };
    for (const s of stats) {
      result[s.status] = s._count.status;
      result.total += s._count.status;
    }

    return result;
  }

  // ============ EVOLUTION API ============

  private async callEvolutionApi(phone: string, message: string): Promise<WhatsAppSendResult> {
    if (!this.apiUrl || !this.apiKey) {
      // Simulation mode (no Evolution API configured)
      return {
        success: true,
        messageId: `sim_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      };
    }

    const response = await fetch(`${this.apiUrl}/message/sendText/${this.instance}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': this.apiKey,
      },
      body: JSON.stringify({
        number: phone,
        text: message,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new BadRequestException(`Erro Evolution API: ${error}`);
    }

    const data = await response.json();
    return {
      success: true,
      messageId: data.key?.id || data.messageId,
    };
  }

  // ============ HELPERS ============

  private formatPhone(phone: string): string | null {
    if (!phone) return null;
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('55') && digits.length >= 12) return digits;
    if (digits.length === 11) return `55${digits}`;
    if (digits.length === 10) return `55${digits.slice(0, 2)}9${digits.slice(2)}`;
    return null;
  }

  private async logMessage(data: {
    recipientPhone: string;
    recipientName?: string;
    recipientType?: string;
    campaignId?: string;
    templateName?: string;
    messageContent?: string;
    status: string;
    sentById?: string;
    sentByName?: string;
    errorMessage?: string;
    metadata?: any;
  }) {
    try {
      await this.prisma.whatsAppLog.create({
        data: {
          recipient_phone: data.recipientPhone,
          recipient_name: data.recipientName,
          recipient_type: data.recipientType || 'apoiador',
          campaign_id: data.campaignId,
          template_name: data.templateName,
          message_content: data.messageContent,
          status: data.status as any,
          sent_by_id: data.sentById,
          sent_by_name: data.sentByName,
          error_message: data.errorMessage,
          metadata: data.metadata,
        },
      });
    } catch (error) {
      console.error('Failed to log WhatsApp message:', error.message);
    }
  }

  private resetCounters() {
    const now = Date.now();
    if (now - this.sentLog.hourStart > 3600000) {
      this.sentLog.hourly = 0;
      this.sentLog.hourStart = now;
    }
    if (now - this.sentLog.dayStart > 86400000) {
      this.sentLog.daily = 0;
      this.sentLog.dayStart = now;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getStatus() {
    this.resetCounters();
    return {
      provider: 'evolution',
      apiUrl: this.apiUrl || 'not configured',
      instance: this.instance,
      rateLimit: {
        hourly: { used: this.sentLog.hourly, max: 30 },
        daily: { used: this.sentLog.daily, max: 200 },
      },
    };
  }
}
