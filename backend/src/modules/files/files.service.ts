import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/common/prisma.service';
import { AuditService } from '../audit/audit.service';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface FileUploadResult {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  path: string;
}

@Injectable()
export class FilesService {
  private readonly provider: string;
  private readonly localStoragePath: string;
  private readonly maxFileSize: number; // bytes
  private readonly allowedMimeTypes: string[];

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
    private audit: AuditService,
  ) {
    this.provider = config.get('STORAGE_PROVIDER', 'local');
    this.localStoragePath = config.get('STORAGE_LOCAL_PATH', './uploads');
    this.maxFileSize = 10 * 1024 * 1024; // 10MB default
    this.allowedMimeTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv', 'text/plain',
    ];

    // Ensure local storage directory exists
    if (this.provider === 'local') {
      fs.mkdirSync(this.localStoragePath, { recursive: true });
    }
  }

  // ============ UPLOAD ============

  async upload(file: {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
    size: number;
  }, userId?: string): Promise<FileUploadResult> {
    // Validate
    this.validateFile(file);

    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    const filePath = path.join(this.localStoragePath, filename);

    let url: string;

    switch (this.provider) {
      case 'local':
        url = await this.saveLocal(file.buffer, filePath);
        break;
      case 'minio':
      case 's3':
      case 'r2':
        throw new BadRequestException(`Provider ${this.provider} ainda nao implementado. Use 'local'.`);
      default:
        throw new BadRequestException(`Provider invalido: ${this.provider}`);
    }

    // Save to database
    const fileRecord = await this.prisma.file.create({
      data: {
        filename,
        original_name: file.originalname,
        mime_type: file.mimetype,
        size: file.size,
        path: filePath,
        url,
        provider: this.provider,
        uploaded_by: userId,
      },
    });

    await this.audit.log({
      action: 'upload',
      entity: 'File',
      entity_id: fileRecord.id,
      entity_label: file.originalname,
      user_id: userId,
      module: 'files',
      metadata: { size: file.size, mimetype: file.mimetype },
    });

    return {
      id: fileRecord.id,
      filename: fileRecord.filename,
      originalName: fileRecord.original_name,
      mimeType: fileRecord.mime_type,
      size: fileRecord.size,
      url: fileRecord.url!,
      path: fileRecord.path,
    };
  }

  // ============ DOWNLOAD ============

  async getFile(id: string) {
    const file = await this.prisma.file.findFirst({
      where: { id, deleted_at: null },
    });

    if (!file) {
      throw new NotFoundException(`Arquivo ${id} nao encontrado`);
    }

    return file;
  }

  async getFileBuffer(id: string): Promise<{ buffer: Buffer; filename: string; mimetype: string }> {
    const file = await this.getFile(id);

    if (this.provider === 'local') {
      const buffer = fs.readFileSync(file.path);
      return { buffer, filename: file.original_name, mimetype: file.mime_type };
    }

    throw new BadRequestException(`Download do provider ${this.provider} nao implementado`);
  }

  // ============ DELETE ============

  async delete(id: string, userId?: string) {
    const file = await this.getFile(id);

    // Soft delete in DB
    await this.prisma.file.update({
      where: { id },
      data: { deleted_at: new Date() },
    });

    // Delete physical file
    if (this.provider === 'local' && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    await this.audit.log({
      action: 'delete',
      entity: 'File',
      entity_id: id,
      entity_label: file.original_name,
      user_id: userId,
      module: 'files',
    });

    return { id, deleted: true };
  }

  // ============ LIST ============

  async list(query: { page?: number; limit?: number; uploadedBy?: string; mimeType?: string }) {
    const { page = 1, limit = 50, uploadedBy, mimeType } = query;
    const where: any = { deleted_at: null };
    if (uploadedBy) where.uploaded_by = uploadedBy;
    if (mimeType) where.mime_type = { startsWith: mimeType };

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.file.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.file.count({ where }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  // ============ HELPERS ============

  private validateFile(file: { mimetype: string; size: number }) {
    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `Arquivo muito grande. Maximo: ${Math.round(this.maxFileSize / 1024 / 1024)}MB`
      );
    }

    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Tipo de arquivo nao permitido: ${file.mimetype}. Permitidos: ${this.allowedMimeTypes.join(', ')}`
      );
    }
  }

  private async saveLocal(buffer: Buffer, filePath: string): Promise<string> {
    fs.writeFileSync(filePath, buffer);
    return `/api/v1/files/download/${path.basename(filePath)}`;
  }

  getProvider() {
    return {
      current: this.provider,
      maxFileSize: this.maxFileSize,
      allowedMimeTypes: this.allowedMimeTypes,
      available: ['local', 'minio', 's3', 'r2'],
    };
  }
}
