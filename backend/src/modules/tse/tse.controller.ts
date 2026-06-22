import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Headers, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { TseService } from './tse.service';

@ApiTags('TSE')
@Controller('api/v1/tse')
export class TseController {
  constructor(private readonly service: TseService) {}

  // ============ SYNC STATUS ============

  @Get('sync-status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verificar status de sincronizacao TSE' })
  async getSyncStatus(@Query('ano') ano: number, @Query('uf') uf: string, @CurrentUser() user: any) {
    return this.service.getSyncStatus(ano, uf, user?.id);
  }

  @Get('sync-status/list')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar status de sincronizacao' })
  async listSyncStatus(@Query() query: any, @CurrentUser() user: any) {
    return this.service.listSyncStatus(query, user?.id);
  }

  @Patch('sync-status/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar status de sincronizacao' })
  async updateSyncStatus(@Param('id') id: string, @Body() dto: any, @CurrentUser() user: any) {
    return this.service.updateSyncStatus(id, dto, user?.id);
  }

  // ============ VOTE RESULTS (consulta local) ============

  @Get('votes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Consultar resultados de votacao (dados locais)' })
  async queryVoteResults(@Query() query: any, @CurrentUser() user: any) {
    return this.service.queryVoteResults(query, user?.id);
  }

  // ============ CANDIDATES ============

  @Get('candidates')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar candidatos TSE' })
  async listCandidates(@Query() query: any, @CurrentUser() user: any) {
    return this.service.listCandidates(query, user?.id);
  }

  // ============ DATA SOURCE MAPS ============

  @Get('data-sources')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar fontes de dados TSE' })
  async listDataSources(@Query() query: any, @CurrentUser() user: any) {
    return this.service.listDataSources(query, user?.id);
  }

  @Post('resolve-source')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resolver URL da fonte de dados TSE' })
  async resolveSource(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.resolveSource(dto, user?.id);
  }

  // ============ IMPORT JOBS ============

  @Get('import-jobs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar jobs de importacao' })
  async listImportJobs(@Query() query: any, @CurrentUser() user: any) {
    return this.service.listImportJobs(query, user?.id);
  }

  @Get('import-jobs/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter job de importacao por ID' })
  async getImportJob(@Param('id') id: string) {
    return this.service.getImportJob(id);
  }

  @Post('import-jobs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar job de importacao' })
  async createImportJob(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createImportJob(dto, user?.id);
  }

  @Patch('import-jobs/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar job de importacao' })
  async updateImportJob(@Param('id') id: string, @Body() dto: any, @CurrentUser() user: any) {
    return this.service.updateImportJob(id, dto, user?.id);
  }

  // ============ BATCH RECEIVE (ETL externo) ============

  @Post('batch')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Receber lote de dados do ETL externo (shared secret)' })
  @ApiHeader({ name: 'Authorization', description: 'Bearer TSE_ETL_SHARED_SECRET' })
  async receiveBatch(@Body() dto: any, @Headers('authorization') authHeader: string) {
    return this.service.receiveBatch(dto, authHeader);
  }

  // ============ POLLING PLACES ============

  @Get('polling-places')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar locais de votacao' })
  async listPollingPlaces(@Query() query: any, @CurrentUser() user: any) {
    return this.service.listPollingPlaces(query, user?.id);
  }

  // ============ ELECTORATE PROFILES ============

  @Get('electorate-profiles')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar perfil do eleitorado' })
  async listElectorateProfiles(@Query() query: any, @CurrentUser() user: any) {
    return this.service.listElectorateProfiles(query, user?.id);
  }

  // ============ DEDUP ============

  @Post('dedup')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remover duplicados de resultados de votacao' })
  async deduplicate(@Body() dto: { ano: number; uf: string }, @CurrentUser() user: any) {
    return this.service.deduplicate(dto.ano, dto.uf, user?.id);
  }
}
