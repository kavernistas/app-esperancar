import { Controller, Post, Get, Delete, Param, Query, UseGuards, UploadedFile, UseInterceptors, Res, HttpCode, HttpStatus } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Response } from 'express';
import { FilesService } from './files.service';

@ApiTags('Files')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/files')
export class FilesController {
  constructor(private readonly service: FilesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOperation({ summary: 'Upload de arquivo' })
  async upload(@UploadedFile() file: any, @CurrentUser() user: any) {
    if (!file) {
      return { error: 'Nenhum arquivo enviado' };
    }

    return this.service.upload(
      {
        buffer: file.buffer,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      },
      user?.id,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Listar arquivos' })
  async list(@Query() query: any) {
    return this.service.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter metadata do arquivo' })
  async getOne(@Param('id') id: string) {
    return this.service.getFile(id);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download do arquivo' })
  async download(@Param('id') id: string, @Res() res: Response) {
    const { buffer, filename, mimetype } = await this.service.getFileBuffer(id);
    res.setHeader('Content-Type', mimetype);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir arquivo' })
  async delete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.delete(id, user?.id);
  }

  @Get('provider/info')
  @ApiOperation({ summary: 'Info do provider de storage' })
  async getProvider() {
    return this.service.getProvider();
  }
}
