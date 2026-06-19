import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// CDN base do TSE
const TSE_CDN_BASE = 'https://cdn.tse.jus.br/estatistica/sead/odsele';
const DATASET_PATH = {
  votacao_secao: 'votacao_secao',
  votacao_nominal_munzona: 'votacao_nominal_munzona',
  detalhe_apuracao_munzona: 'detalhe_apuracao_munzona',
  perfil_eleitorado_secao: 'perfil_eleitorado_secao',
};
const MAX_DOWNLOAD_SIZE = 50 * 1024 * 1024;
const BATCH_SIZE = 1000;
const MAX_RUNTIME_MS = 50000; // 50s — margem antes do timeout de 60s

const CARGO_MAP_CD = {
  '1': 'presidente', '3': 'governador', '5': 'senador',
  '6': 'deputado_federal', '7': 'deputado_estadual',
  '11': 'prefeito', '13': 'vereador',
};

// ============ ROUTER ============
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action } = body;

    if (action === 'query') return handleLocalQuery(base44, body);
    if (action === 'sync') return handleSync(base44, body);
    if (action === 'sync_status') return handleStatusCheck(base44, body);
    if (action === 'import_file') return handleFileImport(base44, body);
    if (action === 'resolve_source') return handleResolveSource(base44, body);
    if (action === 'start_import') return handleStartImport(base44, body);
    if (action === 'continue_import') return handleContinueImport(base44, body);
    if (action === 'job_status') return handleJobStatus(base44, body);
    if (action === 'cancel_job') return handleCancelJob(base44, body);
    if (action === 'dedup') return handleDedup(base44, body);

    return Response.json({ error: 'Ação inválida.' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// ============ CONSULTA LOCAL ============
async function handleLocalQuery(base44, body) {
  const { ano, uf, cargo, municipio, zona, secao, candidato, page = 0, limit = 100 } = body;
  if (!ano || !uf) return Response.json({ error: 'Parâmetros obrigatórios: ano, uf' }, { status: 400 });

  const year = parseInt(ano);
  const state = uf.toUpperCase();

  const syncStatus = await base44.asServiceRole.entities.TSESyncStatus.filter({
    ano: year, uf: state, status: 'importado',
  }, '', 5);

  if (syncStatus.length === 0) {
    return Response.json({
      success: true, isSynced: false, data: [], total: 0,
      message: `Dados oficiais ainda não importados para ${state}/${year}.`,
    });
  }

  const query = { ano: year, uf: state };
  if (cargo) query.cargo = cargo;
  if (municipio) query.municipio = municipio;
  if (zona) query.zona = zona;
  if (secao) query.secao = secao;
  if (candidato) {
    query[/^\d+$/.test(candidato) ? 'numero_candidato' : 'nome_candidato'] = /^\d+$/.test(candidato) ? candidato : candidato.toUpperCase();
  }

  const results = await base44.asServiceRole.entities.TSEVoteResult.filter(query, '-votos', limit);
  return Response.json({
    success: true, isSynced: true, data: results, total: results.length,
    syncInfo: syncStatus[0],
    message: `Base oficial TSE sincronizada localmente para ${state}/${year}.`,
  });
}

// ============ SINCRONIZAÇÃO CDN (arquivos ≤50MB) ============
async function handleSync(base44, body) {
  const { ano, uf, dataset_tipo = 'votacao_secao' } = body;
  if (!ano || !uf) return Response.json({ error: 'Parâmetros obrigatórios: ano, uf' }, { status: 400 });

  const year = parseInt(ano);
  const state = uf.toUpperCase();
  const path = DATASET_PATH[dataset_tipo];
  if (!path) return Response.json({ error: 'Dataset inválido' }, { status: 400 });

  const cdnUrl = `${TSE_CDN_BASE}/${path}/${path}_${year}_${state}.zip`;

  const existing = await base44.asServiceRole.entities.TSESyncStatus.filter({ ano: year, uf: state, tipo_dataset: 'votacao' });
  if (existing.length > 0 && existing[0].status === 'importando') {
    return Response.json({ success: false, message: 'Importação já em andamento.' });
  }

  if (existing.length > 0) {
    await base44.asServiceRole.entities.TSESyncStatus.update(existing[0].id, { status: 'importando', mensagem_erro: '' });
  } else {
    await base44.asServiceRole.entities.TSESyncStatus.create({
      ano: year, uf: state, tipo_dataset: 'votacao', status: 'importando', fonte_url: cdnUrl,
    });
  }

  let fileSize = 0;
  try {
    const headRes = await fetch(cdnUrl, { method: 'HEAD', signal: AbortSignal.timeout(15000) });
    if (headRes.ok) fileSize = parseInt(headRes.headers.get('content-length') || '0');
  } catch (_e) {}

  // Atualizar cache de fonte
  const cachedSources = await base44.asServiceRole.entities.TSEDataSourceMap.filter({ ano: year, uf: state, dataset_tipo });
  const sourceStatus = fileSize > 0 ? (fileSize <= MAX_DOWNLOAD_SIZE ? 'disponivel' : 'muito_grande') : 'indisponivel';
  if (cachedSources.length > 0) {
    await base44.asServiceRole.entities.TSEDataSourceMap.update(cachedSources[0].id, {
      status: sourceStatus, tamanho_estimado: fileSize, fonte_url: cdnUrl,
    });
  } else {
    await base44.asServiceRole.entities.TSEDataSourceMap.create({
      ano: year, uf: state, dataset_tipo, fonte_url: cdnUrl, formato: 'zip',
      status: sourceStatus, tamanho_estimado: fileSize,
    });
  }

  if (fileSize === 0 || fileSize > MAX_DOWNLOAD_SIZE) {
    const sizeMB = fileSize > 0 ? (fileSize/(1024*1024)).toFixed(1) : '?';
    await updateSyncStatus(base44, year, state, 'nao_importado',
      fileSize > MAX_DOWNLOAD_SIZE ? `Arquivo de ${sizeMB}MB requer importação assíncrona.` : 'URL não encontrada.');
    return Response.json({
      success: true, needs_upload: true, total_importado: 0,
      message: fileSize > MAX_DOWNLOAD_SIZE
        ? `Arquivo de ${sizeMB}MB — use a importação assíncrona (upload manual).`
        : `O TSE disponibiliza este recurso como arquivo ZIP/CSV. Faça upload para importar.`,
      tse_url: cdnUrl, file_size_mb: sizeMB,
    });
  }

  try {
    const downloadRes = await fetch(cdnUrl, { signal: AbortSignal.timeout(120000) });
    if (!downloadRes.ok) throw new Error(`CDN HTTP ${downloadRes.status}`);
    const buffer = await downloadRes.arrayBuffer();
    const csvText = await extractCSVFromZip(buffer);
    const total = await parseAndImportCSVStreaming(base44, csvText, year, state, null);
    await updateSyncStatus(base44, year, state, 'importado', '', total);
    return Response.json({
      success: true, total_importado: total, uf: state, ano: year,
      fonte: 'cdn_tse', message: `${total} registros importados.`,
    });
  } catch (error) {
    await updateSyncStatus(base44, year, state, 'erro', error.message);
    return Response.json({ success: false, needs_upload: true, error: error.message, tse_url: cdnUrl });
  }
}

async function updateSyncStatus(base44, year, state, status, mensagemErro, totalLinhas) {
  const recs = await base44.asServiceRole.entities.TSESyncStatus.filter({ ano: year, uf: state, tipo_dataset: 'votacao' });
  const updateData = { status, mensagem_erro: mensagemErro || '' };
  if (status === 'importado') {
    updateData.total_linhas = totalLinhas || 0;
    updateData.data_ultima_sincronizacao = new Date().toISOString();
  }
  if (recs.length > 0) {
    await base44.asServiceRole.entities.TSESyncStatus.update(recs[0].id, updateData);
  }
}

// ============ IMPORTAÇÃO POR ARQUIVO (legado — redireciona para start_import) ============
async function handleFileImport(base44, body) {
  const { ano, uf, file_url, dataset_tipo = 'votacao_secao', municipio = '' } = body;
  if (!ano || !uf || !file_url) return Response.json({ error: 'Parâmetros obrigatórios: ano, uf, file_url' }, { status: 400 });
  // Redireciona para o novo fluxo assíncrono
  return handleStartImport(base44, { ...body, municipio });
}

// ============ NOVA IMPORTAÇÃO ASSÍNCRONA ============
async function handleStartImport(base44, body) {
  const { ano, uf, file_url, dataset_tipo = 'votacao_secao', municipio = '' } = body;
  if (!ano || !uf || !file_url) return Response.json({ error: 'Parâmetros obrigatórios: ano, uf, file_url' }, { status: 400 });

  const year = parseInt(ano);
  const state = uf.toUpperCase();

  // Verificar se já existe job em andamento para este ano/UF
  const existingJobs = await base44.asServiceRole.entities.TSEImportJob.filter({
    ano: year, uf: state, dataset_tipo,
    status: ['pendente', 'baixando', 'extraindo', 'importando', 'deduplicando'],
  });
  if (existingJobs.length > 0) {
    const job = existingJobs[0];
    return Response.json({
      success: true, job_id: job.id, status: job.status,
      progresso: job.progresso, message: 'Importação já em andamento.',
      needs_continuation: job.status !== 'concluido',
    });
  }

  // Criar job
  const job = await base44.asServiceRole.entities.TSEImportJob.create({
    ano: year, uf: state, municipio, dataset_tipo, file_url,
    status: 'baixando', etapa: 'baixando', inicio: new Date().toISOString(),
    ultima_atividade: new Date().toISOString(),
  });

  // Iniciar processamento
  return processImportChunk(base44, job);
}

async function handleContinueImport(base44, body) {
  const { job_id } = body;
  if (!job_id) return Response.json({ error: 'job_id obrigatório' }, { status: 400 });

  let job;
  try {
    const jobs = await base44.asServiceRole.entities.TSEImportJob.filter({ id: job_id });
    if (jobs.length === 0) return Response.json({ error: 'Job não encontrado' }, { status: 404 });
    job = jobs[0];
  } catch (_e) {
    return Response.json({ error: 'Job não encontrado' }, { status: 404 });
  }

  if (job.status === 'concluido') {
    return Response.json({ success: true, job_id: job.id, status: 'concluido', message: 'Importação já concluída.' });
  }
  if (job.status === 'cancelado') {
    return Response.json({ success: false, error: 'Job cancelado.' });
  }

  return processImportChunk(base44, job);
}

async function handleJobStatus(base44, body) {
  const { job_id, ano, uf } = body;

  if (job_id) {
    const jobs = await base44.asServiceRole.entities.TSEImportJob.filter({ id: job_id });
    if (jobs.length === 0) return Response.json({ error: 'Job não encontrado' }, { status: 404 });
    return Response.json({ success: true, job: jobs[0] });
  }

  if (ano && uf) {
    const year = parseInt(ano);
    const state = uf.toUpperCase();
    const jobs = await base44.asServiceRole.entities.TSEImportJob.filter(
      { ano: year, uf: state }, '-created_date', 10
    );
    return Response.json({ success: true, jobs });
  }

  const jobs = await base44.asServiceRole.entities.TSEImportJob.filter({}, '-created_date', 20);
  return Response.json({ success: true, jobs });
}

async function handleCancelJob(base44, body) {
  const { job_id } = body;
  if (!job_id) return Response.json({ error: 'job_id obrigatório' }, { status: 400 });

  const jobs = await base44.asServiceRole.entities.TSEImportJob.filter({ id: job_id });
  if (jobs.length === 0) return Response.json({ error: 'Job não encontrado' }, { status: 404 });

  await base44.asServiceRole.entities.TSEImportJob.update(job_id, {
    status: 'cancelado', fim: new Date().toISOString(), erro: 'Cancelado pelo usuário.',
  });
  return Response.json({ success: true, message: 'Job cancelado.' });
}

async function handleDedup(base44, body) {
  const { ano, uf } = body;
  if (!ano || !uf) return Response.json({ error: 'Parâmetros obrigatórios: ano, uf' }, { status: 400 });

  const year = parseInt(ano);
  const state = uf.toUpperCase();

  // Buscar todos os registros do ano/UF
  const allRecords = await base44.asServiceRole.entities.TSEVoteResult.filter(
    { ano: year, uf: state }, 'created_date', 5000
  );

  const seen = new Set();
  const duplicates = [];

  for (const r of allRecords) {
    const key = `${r.ano}|${r.uf}|${r.municipio}|${r.zona}|${r.secao}|${r.cargo}|${r.numero_candidato}`;
    if (seen.has(key)) {
      duplicates.push(r.id);
    } else {
      seen.add(key);
    }
  }

  if (duplicates.length > 0) {
    // Deletar em lotes
    for (let i = 0; i < duplicates.length; i += 100) {
      const batch = duplicates.slice(i, i + 100);
      for (const id of batch) {
        await base44.asServiceRole.entities.TSEVoteResult.delete(id);
      }
    }
  }

  return Response.json({
    success: true,
    total_verificados: allRecords.length,
    duplicatas_removidas: duplicates.length,
    message: duplicates.length > 0
      ? `${duplicates.length} registros duplicados removidos.`
      : 'Nenhuma duplicata encontrada.',
  });
}

// ============ CORE: PROCESSAMENTO EM CHUNKS ============
async function processImportChunk(base44, job) {
  const startTime = Date.now();

  try {
    // Atualizar status
    await base44.asServiceRole.entities.TSEImportJob.update(job.id, {
      status: 'baixando', etapa: 'baixando', ultima_atividade: new Date().toISOString(),
    });

    // 1. Baixar arquivo
    const fileRes = await fetch(job.file_url, { signal: AbortSignal.timeout(120000) });
    if (!fileRes.ok) throw new Error(`Erro ao baixar: HTTP ${fileRes.status}`);

    const buffer = await fileRes.arrayBuffer();
    const fileUrlLower = job.file_url.toLowerCase();
    const contentType = fileRes.headers.get('content-type') || '';

    // 2. Extrair CSV
    await base44.asServiceRole.entities.TSEImportJob.update(job.id, {
      status: 'extraindo', etapa: 'extraindo', ultima_atividade: new Date().toISOString(),
    });

    let csvText;
    if (contentType.includes('zip') || fileUrlLower.endsWith('.zip')) {
      csvText = await extractCSVFromZip(buffer);
    } else {
      csvText = new TextDecoder().decode(new Uint8Array(buffer));
    }
    csvText = normalizarEncoding(csvText);

    // 3. Contar total de linhas (uma vez)
    if (job.total_linhas_arquivo === 0) {
      const totalLinhas = countCSVLines(csvText);
      await base44.asServiceRole.entities.TSEImportJob.update(job.id, {
        total_linhas_arquivo: totalLinhas,
        ultima_atividade: new Date().toISOString(),
      });
      job.total_linhas_arquivo = totalLinhas;
    }

    // 4. Construir set de deduplicação
    await base44.asServiceRole.entities.TSEImportJob.update(job.id, {
      status: 'deduplicando', etapa: 'deduplicando', ultima_atividade: new Date().toISOString(),
    });

    const dedupSet = await buildDedupSet(base44, job.ano, job.uf);

    // 5. Importar em streaming
    await base44.asServiceRole.entities.TSEImportJob.update(job.id, {
      status: 'importando', etapa: 'importando', ultima_atividade: new Date().toISOString(),
    });

    const result = await parseAndImportCSVStreaming(
      base44, csvText, job.ano, job.uf,
      job.municipio || null, dedupSet, job.linha_offset, startTime, job.id
    );

    // Atualizar job
    const newOffset = job.linha_offset + result.bytesProcessed;
    const newLinhas = job.linhas_processadas + result.linesProcessed;
    const newRegistros = job.registros_importados + result.recordsImported;
    const newDupes = job.registros_duplicados + result.duplicatesSkipped;
    const elapsed = Date.now() - startTime;
    const speed = elapsed > 0 ? Math.round(result.recordsImported / (elapsed / 1000)) : 0;

    const updateData = {
      linha_offset: newOffset,
      linhas_processadas: newLinhas,
      registros_importados: newRegistros,
      registros_duplicados: newDupes,
      velocidade_registros_segundo: speed,
      ultima_atividade: new Date().toISOString(),
    };

    if (result.complete) {
      updateData.status = 'concluido';
      updateData.progresso = 100;
      updateData.fim = new Date().toISOString();
      updateData.etapa = 'finalizando';

      // Atualizar sync status
      await updateSyncStatus(base44, job.ano, job.uf, 'importado', '', newRegistros);
    } else {
      updateData.progresso = job.total_linhas_arquivo > 0
        ? Math.min(99, Math.round((newLinhas / job.total_linhas_arquivo) * 100))
        : 0;
      // Estimar tempo restante
      if (speed > 0 && job.total_linhas_arquivo > 0) {
        const remaining = job.total_linhas_arquivo - newLinhas;
        updateData.tempo_estimado_segundos = Math.round(remaining / speed);
      }
    }

    await base44.asServiceRole.entities.TSEImportJob.update(job.id, updateData);

    return Response.json({
      success: true,
      job_id: job.id,
      status: result.complete ? 'concluido' : 'processando',
      progresso: updateData.progresso,
      registros_importados: newRegistros,
      registros_duplicados: newDupes,
      linhas_processadas: newLinhas,
      total_linhas: job.total_linhas_arquivo,
      velocidade: speed,
      tempo_estimado: updateData.tempo_estimado_segundos || 0,
      needs_continuation: !result.complete,
      message: result.complete
        ? `Importação concluída! ${newRegistros} registros (${newDupes} duplicados ignorados).`
        : `Processando... ${newLinhas}/${job.total_linhas_arquivo} linhas. Continue chamando continue_import.`,
    });

  } catch (error) {
    await base44.asServiceRole.entities.TSEImportJob.update(job.id, {
      status: 'erro', erro: error.message, fim: new Date().toISOString(),
      ultima_atividade: new Date().toISOString(),
    });
    return Response.json({
      success: false, job_id: job.id, status: 'erro',
      error: error.message,
      message: `Erro na importação: ${error.message}. Use continue_import para retomar.`,
      retryable: true,
    });
  }
}

// ============ STREAMING CSV PARSER ============
async function parseAndImportCSVStreaming(base44, csvText, year, state, municipio, dedupSet, startOffset, budgetStartMs, jobId) {
  let bytePos = 0;
  const len = csvText.length;

  // Pular para o offset salvo
  if (startOffset > 0) {
    bytePos = startOffset;
  }

  // Se for primeira execução, ler cabeçalho
  let header = null;
  let delimiter = null;
  let ufIdx = -1;

  if (bytePos === 0) {
    let headerEnd = csvText.indexOf('\n', 0);
    if (headerEnd === -1) throw new Error('CSV vazio.');
    if (csvText[headerEnd - 1] === '\r') headerEnd--;
    const headerLine = csvText.slice(0, headerEnd);
    bytePos = csvText.indexOf('\n', 0) + 1;

    if (!headerLine.trim()) throw new Error('CSV sem cabeçalho.');
    delimiter = detectarSeparador(headerLine);
    header = parseCSVLine(headerLine, delimiter);
    ufIdx = header.findIndex(h => h === 'SG_UF');
    if (ufIdx === -1) throw new Error('Coluna SG_UF não encontrada.');
  } else {
    // Na retomada, precisamos re-parsear o cabeçalho
    let headerEnd = csvText.indexOf('\n', 0);
    if (csvText[headerEnd - 1] === '\r') headerEnd--;
    const headerLine = csvText.slice(0, headerEnd);
    delimiter = detectarSeparador(headerLine);
    header = parseCSVLine(headerLine, delimiter);
    ufIdx = header.findIndex(h => h === 'SG_UF');
  }

  let batch = [];
  let recordsImported = 0;
  let duplicatesSkipped = 0;
  let linesProcessed = 0;
  let bytesProcessed = 0;
  const startBytePos = bytePos;
  const municipioUpper = municipio ? municipio.toUpperCase() : null;
  const municipioIdx = municipio ? header.findIndex(h => h === 'NM_MUNICIPIO') : -1;

  while (bytePos < len) {
    // Verificar budget de tempo
    const elapsed = Date.now() - budgetStartMs;
    if (elapsed > MAX_RUNTIME_MS && recordsImported > 0) {
      bytesProcessed = bytePos - startBytePos;
      return {
        complete: false, recordsImported, duplicatesSkipped, linesProcessed, bytesProcessed,
      };
    }

    let end = csvText.indexOf('\n', bytePos);
    if (end === -1) end = len;
    let line = csvText.slice(bytePos, end);
    if (line.endsWith('\r')) line = line.slice(0, -1);
    bytePos = end + 1;
    linesProcessed++;

    if (!line.trim()) continue;

    const values = parseCSVLine(line, delimiter);
    if (values.length < header.length) continue;
    if (values[ufIdx] !== state) continue;
    if (municipioUpper && municipioIdx >= 0 && values[municipioIdx].toUpperCase() !== municipioUpper) continue;

    // Verificar duplicata
    const dedupKey = buildDedupKey(values, header, year, state);
    if (dedupSet.has(dedupKey)) {
      duplicatesSkipped++;
      continue;
    }
    dedupSet.add(dedupKey);

    const record = buildRecordFromCSV(header, values, year, state);
    batch.push(record);

    if (batch.length >= BATCH_SIZE) {
      await base44.asServiceRole.entities.TSEVoteResult.bulkCreate(batch);
      recordsImported += batch.length;
      batch = [];

      // Atualizar progresso no job a cada lote
      if (jobId) {
        try {
          await base44.asServiceRole.entities.TSEImportJob.update(jobId, {
            linhas_processadas: (await getJobLinhas(base44, jobId)) + linesProcessed,
            registros_importados: (await getJobRegistros(base44, jobId)) + recordsImported,
            ultima_atividade: new Date().toISOString(),
          });
        } catch (_e) { /* non-critical */ }
      }
    }
  }

  // Último lote
  if (batch.length > 0) {
    await base44.asServiceRole.entities.TSEVoteResult.bulkCreate(batch);
    recordsImported += batch.length;
  }

  bytesProcessed = bytePos - startBytePos;

  return {
    complete: true, recordsImported, duplicatesSkipped, linesProcessed, bytesProcessed,
  };
}

async function getJobLinhas(base44, jobId) {
  const jobs = await base44.asServiceRole.entities.TSEImportJob.filter({ id: jobId });
  return jobs.length > 0 ? jobs[0].linhas_processadas : 0;
}

async function getJobRegistros(base44, jobId) {
  const jobs = await base44.asServiceRole.entities.TSEImportJob.filter({ id: jobId });
  return jobs.length > 0 ? jobs[0].registros_importados : 0;
}

function buildDedupKey(values, header, year, state) {
  const get = (name) => {
    const idx = header.findIndex(h => h === name);
    return idx >= 0 ? (values[idx] || '') : '';
  };
  return `${year}|${state}|${get('NM_MUNICIPIO')}|${get('NR_ZONA')}|${get('NR_SECAO')}|${get('DS_CARGO') || get('CD_CARGO')}|${get('NR_VOTAVEL') || get('NR_CANDIDATO')}`;
}

async function buildDedupSet(base44, year, state) {
  const set = new Set();
  let page = 0;
  const pageSize = 2000;
  let hasMore = true;

  while (hasMore) {
    const records = await base44.asServiceRole.entities.TSEVoteResult.filter(
      { ano: year, uf: state }, 'id', pageSize
    );
    if (records.length === 0) { hasMore = false; break; }

    for (const r of records) {
      set.add(`${r.ano}|${r.uf}|${r.municipio}|${r.zona}|${r.secao}|${r.cargo}|${r.numero_candidato}`);
    }

    if (records.length < pageSize) { hasMore = false; }
    page++;
  }

  return set;
}

function countCSVLines(csvText) {
  let count = 0;
  for (let i = 0; i < csvText.length; i++) {
    if (csvText[i] === '\n') count++;
  }
  // Não conta a última linha se terminar sem \n
  if (csvText.length > 0 && csvText[csvText.length - 1] !== '\n') count++;
  return count;
}

// ============ RESOLVE SOURCE ============
async function handleResolveSource(base44, body) {
  const { ano, uf, dataset_tipo = 'votacao_secao' } = body;
  if (!ano || !uf) return Response.json({ error: 'Parâmetros obrigatórios: ano, uf' }, { status: 400 });

  const year = parseInt(ano);
  const state = uf.toUpperCase();
  const path = DATASET_PATH[dataset_tipo];
  if (!path) return Response.json({ error: 'Dataset inválido' }, { status: 400 });

  const url = `${TSE_CDN_BASE}/${path}/${path}_${year}_${state}.zip`;

  const cached = await base44.asServiceRole.entities.TSEDataSourceMap.filter({ ano: year, uf: state, dataset_tipo });
  if (cached.length > 0) {
    return Response.json({ success: true, fonte: cached[0], cdn_url: url });
  }

  let status = 'nao_verificado';
  let sizeBytes = 0;
  try {
    const headRes = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(10000) });
    if (headRes.ok) {
      sizeBytes = parseInt(headRes.headers.get('content-length') || '0');
      status = sizeBytes > 0 && sizeBytes <= MAX_DOWNLOAD_SIZE ? 'disponivel'
        : sizeBytes > MAX_DOWNLOAD_SIZE ? 'muito_grande' : 'indisponivel';
    } else {
      status = 'indisponivel';
    }
  } catch (_e) {
    status = 'indisponivel';
  }

  await base44.asServiceRole.entities.TSEDataSourceMap.create({
    ano: year, uf: state, dataset_tipo, fonte_url: url, formato: 'zip',
    status, tamanho_estimado: sizeBytes,
  });

  return Response.json({
    success: true,
    fonte: { ano: year, uf: state, dataset_tipo, fonte_url: url, formato: 'zip', status, tamanho_estimado: sizeBytes },
    cdn_url: url,
  });
}

// ============ STATUS CHECK ============
async function handleStatusCheck(base44, body) {
  const { ano, uf } = body;
  const query = {};
  if (ano) query.ano = parseInt(ano);
  if (uf) query.uf = uf.toUpperCase();
  const statuses = await base44.asServiceRole.entities.TSESyncStatus.filter(query, '-data_ultima_sincronizacao', 50);
  return Response.json({ success: true, statuses });
}

// ============ UTILITÁRIOS ZIP/CSV ============
function findCSVInZip(buf) {
  const data = new Uint8Array(buf);
  let cdOffset = -1;
  for (let i = data.length - 4; i >= 0; i--) {
    if (data[i] === 0x50 && data[i+1] === 0x4b && data[i+2] === 0x01 && data[i+3] === 0x02) {
      cdOffset = i; break;
    }
  }
  if (cdOffset === -1) throw new Error('ZIP inválido — arquivo corrompido.');

  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  let pos = cdOffset;
  const files = [];

  while (pos < data.length - 46) {
    const sig = view.getUint32(pos, true);
    if (sig !== 0x02014b50) break;
    const compMethod = view.getUint16(pos + 10, true);
    const fileNameLen = view.getUint16(pos + 28, true);
    const extraLen = view.getUint16(pos + 30, true);
    const commentLen = view.getUint16(pos + 32, true);
    const localHeaderOff = view.getUint32(pos + 42, true);
    const compSize = view.getUint32(pos + 20, true);
    const nameBytes = data.slice(pos + 46, pos + 46 + fileNameLen);
    const fileName = new TextDecoder().decode(nameBytes);

    if (fileName.toLowerCase().endsWith('.csv')) {
      const lhPos = localHeaderOff;
      const lhNameLen = view.getUint16(lhPos + 26, true);
      const lhExtraLen = view.getUint16(lhPos + 28, true);
      const dataStart = lhPos + 30 + lhNameLen + lhExtraLen;
      const compressed = data.slice(dataStart, dataStart + compSize);
      files.push({ name: fileName, data: compressed, method: compMethod === 8 ? 'deflate' : 'store' });
    }
    pos += 46 + fileNameLen + extraLen + commentLen;
  }
  return files;
}

async function inflateData(compressed) {
  const ds = new DecompressionStream('deflate-raw');
  const writer = ds.writable.getWriter();
  const reader = ds.readable.getReader();
  writer.write(compressed);
  writer.close();
  const chunks = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  const totalLen = chunks.reduce((s, c) => s + c.length, 0);
  const result = new Uint8Array(totalLen);
  let offset = 0;
  for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.length; }
  return result;
}

async function extractCSVFromZip(buffer) {
  const files = findCSVInZip(buffer);
  if (files.length === 0) throw new Error('Nenhum CSV encontrado no ZIP.');
  const csvFile = files[0];
  let csvData;
  if (csvFile.method === 'deflate') {
    csvData = await inflateData(csvFile.data);
  } else {
    csvData = csvFile.data;
  }
  return new TextDecoder().decode(csvData);
}

function normalizarEncoding(text) {
  try {
    if (text.includes('Ã§') || text.includes('Ã£') || text.includes('Ã©') || text.includes('Ã') || text.includes('Ã´')) {
      const bytes = new Uint8Array(text.length);
      for (let i = 0; i < text.length; i++) bytes[i] = text.charCodeAt(i) & 0xFF;
      return new TextDecoder('iso-8859-1').decode(bytes);
    }
    return text;
  } catch (_e) {
    return text;
  }
}

function parseCSVLine(line, delimiter) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function detectarSeparador(headerLine) {
  const semicolons = (headerLine.match(/;/g) || []).length;
  const commas = (headerLine.match(/,/g) || []).length;
  return semicolons > commas ? ';' : ',';
}

function buildRecordFromCSV(header, values, year, state) {
  const get = (name) => {
    const idx = header.findIndex(h => h === name);
    return idx >= 0 ? (values[idx] || '') : '';
  };
  const cargoCd = get('CD_CARGO');
  const cargoName = get('DS_CARGO') || CARGO_MAP_CD[cargoCd] || cargoCd;
  const votos = parseInt(get('QT_VOTOS')) || parseInt(get('QT_VOTOS_NOMINAIS')) || 0;
  return {
    ano: year,
    turno: parseInt(get('NR_TURNO')) || 1,
    uf: state,
    municipio: get('NM_MUNICIPIO'),
    codigo_municipio: get('CD_MUNICIPIO') || '',
    zona: get('NR_ZONA') || '',
    secao: get('NR_SECAO') || '',
    cargo: cargoName,
    numero_candidato: String(get('NR_VOTAVEL') || get('NR_CANDIDATO') || ''),
    nome_candidato: get('NM_VOTAVEL') || get('NM_CANDIDATO') || '',
    partido: get('SG_PARTIDO') || get('NM_PARTIDO') || '',
    votos,
    local_votacao: get('NM_LOCAL_VOTACAO') || '',
  };
}