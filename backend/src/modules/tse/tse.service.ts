import { Injectable, NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/common/prisma.service';
import { Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class TseService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private audit: AuditService,
  ) {}

  // ============ SYNC STATUS ============

  async getSyncStatus(ano: number, uf: string, userId?: string) {
    const statuses = await this.prisma.tSESyncStatus.findMany({
      where: { ano, uf: uf.toUpperCase() },
    });

    return {
      ano,
      uf: uf.toUpperCase(),
      datasets: statuses,
      isFullySynced: statuses.every(s => s.status === 'importado'),
      totalDatasets: statuses.length,
    };
  }

  async listSyncStatus(query: { ano?: number; uf?: string; page?: number; limit?: number }, userId?: string) {
    const { page = 1, limit = 50, ano, uf } = query;
    const where: Prisma.TSESyncStatusWhereInput = {};
    if (ano) where.ano = ano;
    if (uf) where.uf = uf.toUpperCase();

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.tSESyncStatus.findMany({ where, orderBy: [{ ano: 'desc' }, { uf: 'asc' }], skip, take: limit }),
      this.prisma.tSESyncStatus.count({ where }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async updateSyncStatus(id: string, dto: { status: string; total_linhas?: number; fonte_url?: string; mensagem_erro?: string }, userId?: string) {
    const existing = await this.prisma.tSESyncStatus.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`SyncStatus ${id} nao encontrado`);

    const updated = await this.prisma.tSESyncStatus.update({
      where: { id },
      data: {
        ...dto,
        data_ultima_sincronizacao: dto.status === 'importado' ? new Date() : undefined,
      },
    });

    await this.audit.log({ action: 'update', entity: 'TSESyncStatus', entity_id: id, entity_label: `${existing.ano}/${existing.uf}/${existing.tipo_dataset}`, user_id: userId, module: 'tse' });
    return updated;
  }

  // ============ VOTE RESULTS (consulta local) ============

  async queryVoteResults(query: {
    ano: number; uf: string; cargo?: string; municipio?: string;
    zona?: string; secao?: string; candidato?: string;
    page?: number; limit?: number; sortBy?: string; sortOrder?: string;
  }, userId?: string) {
    const {
      ano, uf, cargo, municipio, zona, secao, candidato,
      page = 1, limit = 100, sortBy = 'votos', sortOrder = 'desc',
    } = query;

    // Check if data is synced
    const syncStatus = await this.prisma.tSESyncStatus.findFirst({
      where: { ano, uf: uf.toUpperCase(), tipo_dataset: 'votacao', status: 'importado' },
    });

    if (!syncStatus) {
      return {
        success: true,
        isSynced: false,
        data: [],
        total: 0,
        message: `Dados oficiais ainda nao importados para ${uf.toUpperCase()}/${ano}.`,
      };
    }

    const where: Prisma.TSEVoteResultWhereInput = {
      ano,
      uf: uf.toUpperCase(),
    };

    if (cargo) where.cargo = cargo;
    if (municipio) where.municipio = { contains: municipio, mode: 'insensitive' };
    if (zona) where.zona = zona;
    if (secao) where.secao = secao;

    if (candidato) {
      if (/^\d+$/.test(candidato)) {
        where.numero_candidato = candidato;
      } else {
        where.nome_candidato = { contains: candidato.toUpperCase(), mode: 'insensitive' };
      }
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.tSEVoteResult.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      this.prisma.tSEVoteResult.count({ where }),
    ]);

    // Generate summary
    const summary = await this.generateSummary(where, ano, uf, cargo);

    return {
      success: true,
      isSynced: true,
      data,
      total,
      summary,
      page,
      limit,
      syncInfo: {
        lastSync: syncStatus.data_ultima_sincronizacao,
        totalRows: syncStatus.total_linhas,
      },
    };
  }

  private async generateSummary(where: Prisma.TSEVoteResultWhereInput, ano: number, uf: string, cargo?: string) {
    const results = await this.prisma.tSEVoteResult.findMany({
      where,
      select: { nome_candidato: true, partido: true, votos: true },
    });

    const candidateMap = new Map<string, { nome: string; partido: string; votos: number }>();
    let totalVotos = 0;

    for (const r of results) {
      const key = `${r.nome_candidato}_${r.partido}`;
      const existing = candidateMap.get(key) || { nome: r.nome_candidato || '', partido: r.partido || '', votos: 0 };
      existing.votos += r.votos || 0;
      candidateMap.set(key, existing);
      totalVotos += r.votos || 0;
    }

    const candidatos = Array.from(candidateMap.values())
      .sort((a, b) => b.votos - a.votos)
      .slice(0, 20);

    return {
      totalVotos,
      totalCandidatos: candidateMap.size,
      topCandidatos: candidatos,
      cargo,
      ano,
      uf: uf.toUpperCase(),
    };
  }

  // ============ CANDIDATES ============

  async listCandidates(query: { ano?: number; uf?: string; cargo?: string; search?: string; page?: number; limit?: number }, userId?: string) {
    const { page = 1, limit = 50, ano, uf, cargo, search } = query;
    const where: Prisma.TSECandidateWhereInput = {};
    if (ano) where.ano = ano;
    if (uf) where.uf = uf.toUpperCase();
    if (cargo) where.cargo = cargo;
    if (search) {
      where.OR = [
        { nome: { contains: search, mode: 'insensitive' } },
        { numero: { contains: search } },
      ];
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.tSECandidate.findMany({ where, orderBy: { nome: 'asc' }, skip, take: limit }),
      this.prisma.tSECandidate.count({ where }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  // ============ DATA SOURCE MAPS ============

  async listDataSources(query: { ano?: number; uf?: string; dataset_tipo?: string }, userId?: string) {
    const where: Prisma.TSEDataSourceMapWhereInput = {};
    if (query.ano) where.ano = query.ano;
    if (query.uf) where.uf = query.uf.toUpperCase();
    if (query.dataset_tipo) where.dataset_tipo = query.dataset_tipo;

    return this.prisma.tSEDataSourceMap.findMany({ where, orderBy: [{ ano: 'desc' }, { uf: 'asc' }] });
  }

  async resolveSource(dto: { ano: number; uf: string; dataset_tipo: string }, userId?: string) {
    const TSE_CDN_BASE = 'https://cdn.tse.jus.br/estatistica/sead/odsele';
    const DATASET_CDN_PATH: Record<string, string> = {
      votacao_secao: 'votacao_secao',
      votacao_nominal_munzona: 'votacao_candidato_munzona',
      detalhe_apuracao_munzona: 'detalhe_votacao_secao',
      perfil_eleitorado_secao: 'perfil_eleitor_secao',
    };
    const DATASETS_NACIONAIS = new Set(['votacao_nominal_munzona', 'detalhe_apuracao_munzona']);

    const cdnPath = DATASET_CDN_PATH[dto.dataset_tipo];
    if (!cdnPath) {
      throw new BadRequestException(`Dataset invalido. Validos: ${Object.keys(DATASET_CDN_PATH).join(', ')}`);
    }

    const isNacional = DATASETS_NACIONAIS.has(dto.dataset_tipo);
    const url = isNacional
      ? `${TSE_CDN_BASE}/${cdnPath}/${cdnPath}_${dto.ano}.zip`
      : `${TSE_CDN_BASE}/${cdnPath}/${cdnPath}_${dto.ano}_${dto.uf.toUpperCase()}.zip`;

    // Upsert source map
    const existing = await this.prisma.tSEDataSourceMap.findUnique({
      where: { ano_uf_dataset_tipo: { ano: dto.ano, uf: dto.uf.toUpperCase(), dataset_tipo: dto.dataset_tipo } },
    });

    if (existing) {
      await this.prisma.tSEDataSourceMap.update({
        where: { id: existing.id },
        data: { fonte_url: url, status: 'nao_verificado' },
      });
    } else {
      await this.prisma.tSEDataSourceMap.create({
        data: {
          ano: dto.ano,
          uf: dto.uf.toUpperCase(),
          dataset_tipo: dto.dataset_tipo,
          fonte_url: url,
          status: 'nao_verificado',
        },
      });
    }

    return { url, dataset_tipo: dto.dataset_tipo, ano: dto.ano, uf: dto.uf.toUpperCase() };
  }

  // ============ IMPORT JOBS ============

  async createImportJob(dto: {
    ano: number; uf: string; dataset_tipo: string; file_url: string; municipio?: string;
  }, userId?: string) {
    const job = await this.prisma.tSEImportJob.create({
      data: {
        ano: dto.ano,
        uf: dto.uf.toUpperCase(),
        dataset_tipo: dto.dataset_tipo,
        file_url: dto.file_url,
        municipio: dto.municipio,
        status: 'pendente',
        etapa: 'baixando',
      },
    });

    await this.audit.log({ action: 'create', entity: 'TSEImportJob', entity_id: job.id, entity_label: `${dto.ano}/${dto.uf}/${dto.dataset_tipo}`, user_id: userId, module: 'tse' });
    return job;
  }

  async listImportJobs(query: { status?: string; ano?: number; uf?: string; page?: number; limit?: number }, userId?: string) {
    const { page = 1, limit = 50, status, ano, uf } = query;
    const where: Prisma.TSEImportJobWhereInput = {};
    if (status) where.status = status;
    if (ano) where.ano = ano;
    if (uf) where.uf = uf.toUpperCase();

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.tSEImportJob.findMany({ where, orderBy: { created_at: 'desc' }, skip, take: limit }),
      this.prisma.tSEImportJob.count({ where }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getImportJob(id: string) {
    const job = await this.prisma.tSEImportJob.findUnique({ where: { id } });
    if (!job) throw new NotFoundException(`ImportJob ${id} nao encontrado`);
    return job;
  }

  async updateImportJob(id: string, dto: {
    status?: string; progresso?: number; linhas_processadas?: number;
    registros_importados?: number; registros_duplicados?: number;
    erro?: string; etapa?: string; linha_offset?: number;
  }, userId?: string) {
    const job = await this.prisma.tSEImportJob.update({
      where: { id },
      data: {
        ...dto,
        ultima_atividade: new Date(),
        fim: dto.status === 'concluido' || dto.status === 'erro' ? new Date() : undefined,
      },
    });
    return job;
  }

  // ============ BATCH RECEIVE (para ETL externo) ============

  async receiveBatch(dto: {
    ano: number; uf: string; dataset_tipo?: string;
    records: any[]; final_batch?: boolean; source_url?: string; total_registros?: number;
  }, authHeader?: string) {
    // Validate shared secret
    const SECRET = this.config.get('TSE_ETL_SHARED_SECRET');
    if (!SECRET) {
      throw new UnauthorizedException('TSE_ETL_SHARED_SECRET nao configurado');
    }
    const expectedAuth = `Bearer ${SECRET}`;
    if (authHeader !== expectedAuth) {
      throw new UnauthorizedException('Unauthorized — shared secret mismatch');
    }

    const { ano, uf, records, dataset_tipo = 'votacao_secao' } = dto;

    if (!Array.isArray(records) || records.length === 0) {
      return { success: true, imported: 0, message: 'Lote vazio — nada a importar.' };
    }

    const year = Number(ano);
    const state = uf.toUpperCase();

    // Normalize records to TSEVoteResult schema
    const normalized = records.map(r => ({
      ano: year,
      turno: r.turno || 1,
      uf: state,
      municipio: r.municipio || '',
      codigo_municipio: r.codigo_municipio || '',
      zona: String(r.zona || ''),
      secao: String(r.secao || ''),
      cargo: r.cargo || '',
      numero_candidato: String(r.numero_candidato || ''),
      nome_candidato: r.nome_candidato || '',
      partido: r.partido || '',
      votos: typeof r.votos === 'number' ? r.votos : parseInt(r.votos) || 0,
      local_votacao: r.local_votacao || '',
    }));

    // Upsert in batches of 1000 using createMany with skipDuplicates
    const BATCH_SIZE = 1000;
    let imported = 0;
    let duplicates = 0;

    for (let i = 0; i < normalized.length; i += BATCH_SIZE) {
      const batch = normalized.slice(i, i + BATCH_SIZE);
      try {
        const result = await this.prisma.tSEVoteResult.createMany({
          data: batch as any,
          skipDuplicates: true,
        });
        imported += result.count;
        duplicates += batch.length - result.count;
      } catch (error) {
        // If createMany fails (e.g., duplicates), insert one by one
        for (const record of batch) {
          try {
            await this.prisma.tSEVoteResult.create({ data: record as any });
            imported++;
          } catch {
            duplicates++;
          }
        }
      }
    }

    // Update or create sync status
    await this.prisma.tSESyncStatus.upsert({
      where: { ano_uf_tipo_dataset: { ano: year, uf: state, tipo_dataset: 'votacao' } },
      update: {
        status: dto.final_batch ? 'importado' : 'importando',
        total_linhas: { increment: imported },
        data_ultima_sincronizacao: new Date(),
        fonte_url: dto.source_url,
      },
      create: {
        ano: year,
        uf: state,
        tipo_dataset: 'votacao',
        status: dto.final_batch ? 'importado' : 'importando',
        total_linhas: imported,
        data_ultima_sincronizacao: new Date(),
        fonte_url: dto.source_url,
      },
    });

    return {
      success: true,
      imported,
      duplicates,
      total_received: records.length,
      dataset_tipo,
      ano: year,
      uf: state,
    };
  }

  // ============ POLLING PLACES ============

  async listPollingPlaces(query: { ano?: number; uf?: string; municipio?: string; zona?: string; page?: number; limit?: number }, userId?: string) {
    const { page = 1, limit = 50, ano, uf, municipio, zona } = query;
    const where: Prisma.TSEPollingPlaceWhereInput = {};
    if (ano) where.ano = ano;
    if (uf) where.uf = uf.toUpperCase();
    if (municipio) where.municipio = { contains: municipio, mode: 'insensitive' };
    if (zona) where.zona = zona;

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.tSEPollingPlace.findMany({ where, orderBy: { zona: 'asc' }, skip, take: limit }),
      this.prisma.tSEPollingPlace.count({ where }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  // ============ ELECTORATE PROFILES ============

  async listElectorateProfiles(query: { ano?: number; uf?: string; municipio?: string; zona?: string; page?: number; limit?: number }, userId?: string) {
    const { page = 1, limit = 50, ano, uf, municipio, zona } = query;
    const where: Prisma.TSEElectorateProfileWhereInput = {};
    if (ano) where.ano = ano;
    if (uf) where.uf = uf.toUpperCase();
    if (municipio) where.municipio = { contains: municipio, mode: 'insensitive' };
    if (zona) where.zona = zona;

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.tSEElectorateProfile.findMany({ where, orderBy: { quantidade: 'desc' }, skip, take: limit }),
      this.prisma.tSEElectorateProfile.count({ where }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  // ============ DEDUP ============

  async deduplicate(ano: number, uf: string, userId?: string) {
    // Find duplicates based on unique fields
    const duplicates = await this.prisma.$queryRaw<{ id: string }[]>`
      WITH duplicates AS (
        SELECT id,
          ROW_NUMBER() OVER (
            PARTITION BY ano, uf, cargo, zona, secao, numero_candidato, turno
            ORDER BY created_at DESC
          ) as rn
        FROM tse_vote_results
        WHERE ano = ${ano} AND uf = ${uf.toUpperCase()}
      )
      SELECT id FROM duplicates WHERE rn > 1
    `;

    if (duplicates.length > 0) {
      await this.prisma.tSEVoteResult.deleteMany({
        where: { id: { in: duplicates.map(d => d.id) } },
      });
    }

    await this.audit.log({
      action: 'dedup',
      entity: 'TSEVoteResult',
      entity_label: `${ano}/${uf}`,
      user_id: userId,
      module: 'tse',
      metadata: { duplicates_removed: duplicates.length },
    });

    return { duplicates_removed: duplicates.length, ano, uf: uf.toUpperCase() };
  }
}
