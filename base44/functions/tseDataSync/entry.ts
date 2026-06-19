import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// CDN base do TSE
const TSE_CDN_BASE = 'https://cdn.tse.jus.br/estatistica/sead/odsele';
const DATASET_CDN_PATH = {
  votacao_secao:                'votacao_secao',
  votacao_nominal_munzona:      'votacao_candidato_munzona',
  detalhe_apuracao_munzona:     'detalhe_votacao_secao',
  perfil_eleitorado_secao:      'perfil_eleitor_secao',
};

const DATASETS_NACIONAIS = new Set([
  'votacao_nominal_munzona',
  'detalhe_apuracao_munzona',
]);

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

// ============ SINCRONIZAÇÃO — DATA WAREHOUSE (sempre assíncrono) ============
async function handleSync(base44, body) {
  const { ano, uf, dataset_tipo = 'votacao_secao', municipio = '' } = body;
  if (!ano || !uf) return Response.json({ error: 'Parâmetros obrigatórios: ano, uf' }, { status: 400 });

  const year = parseInt(ano);
  const state = uf.toUpperCase();
  const cdnPath = DATASET_CDN_PATH[dataset_tipo];
  if (!cdnPath) return Response.json({ error: 'Dataset inválido' }, { status: 400 });

  const isNacional = DATASETS_NACIONAIS.has(dataset_tipo);
  const cdnUrl = isNacional
    ? `${TSE_CDN_BASE}/${cdnPath}/${cdnPath}_${year}.zip`
    : `${TSE_CDN_BASE}/${cdnPath}/${cdnPath}_${year}_${state}.zip`;

  // Verifica se o arquivo existe e tamanho
  let fileSize = 0;
  try {
    const headRes = await fetch(cdnUrl, { method: 'HEAD', signal: AbortSignal.timeout(15000) });
    if (headRes.ok) fileSize = parseInt(headRes.headers.get('content-length') || '0');
  } catch (_e) {}

  if (fileSize === 0) {
    const cached = await base44.asServiceRole.entities.TSEDataSourceMap.filter({ ano: year, uf: state, dataset_tipo });
    const obs = 'URL não encontrada no CDN do TSE.';
    if (cached.length > 0) {
      await base44.asServiceRole.entities.TSEDataSourceMap.update(cached[0].id, { status: 'indisponivel', observacao: obs });
    } else {
      await base44.asServiceRole.entities.TSEDataSourceMap.create({
        ano: year, uf: state, dataset_tipo, fonte_url: cdnUrl, formato: 'zip', status: 'indisponivel', observacao: obs,
      });
    }
    return Response.json({ success: false, message: 'URL não encontrada no CDN do TSE.', tse_url: cdnUrl });
  }

  const sizeMB = (fileSize / (1024 * 1024)).toFixed(1);

  // Atualiza cache de fonte
  const cachedSources = await base44.asServiceRole.entities.TSEDataSourceMap.filter({ ano: year, uf: state, dataset_tipo });
  const sourceData = { status: 'disponivel', tamanho_estimado: fileSize, fonte_url: cdnUrl };
  if (cachedSources.length > 0) {
    await base44.asServiceRole.entities.TSEDataSourceMap.update(cachedSources[0].id, sourceData);
  } else {
    await base44.asServiceRole.entities.TSEDataSourceMap.create({
      ano: year, uf: state, dataset_tipo, fonte_url: cdnUrl, formato: 'zip', ...sourceData,
    });
  }

  // Delega para importação assíncrona — nunca baixa inline
  return handleStartImport(base44, { ano, uf, file_url: cdnUrl, dataset_tipo, municipio, source: 'cdn' });
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

// ============ CORE: PROCESSAMENTO EM CHUNKS (STREAMING EM DISCO) ============
async function processImportChunk(base44, job) {
  const startTime = Date.now();
  const isContinuation = job.linha_offset > 0;

  let zipPath, csvPath, tmpDir;
  try {
    // 1. Baixar ZIP para disco (streaming, sem carregar na memória)
    await base44.asServiceRole.entities.TSEImportJob.update(job.id, {
      status: 'baixando', etapa: 'baixando', ultima_atividade: new Date().toISOString(),
    });

    const fileUrlLower = job.file_url.toLowerCase();
    const isZip = fileUrlLower.endsWith('.zip');

    const tmpDir = await Deno.makeTempDir({ prefix: 'tse_' });
    zipPath = `${tmpDir}/data.zip`;
    csvPath = `${tmpDir}/data.csv`;

    if (isZip && !isContinuation) {
      console.log('[processImportChunk] Baixando ZIP para disco:', zipPath);
      await streamDownload(job.file_url, zipPath);
      console.log('[processImportChunk] Download concluído.');
    }

    // 2. Extrair CSV do ZIP para disco
    await base44.asServiceRole.entities.TSEImportJob.update(job.id, {
      status: 'extraindo', etapa: 'extraindo', ultima_atividade: new Date().toISOString(),
    });

    if (isZip && !isContinuation) {
      const isNacional = DATASETS_NACIONAIS.has(job.dataset_tipo);
      await extractCSVToFile(zipPath, csvPath, job.uf, isNacional);
      // Limpa ZIP
      try { await Deno.remove(zipPath); } catch (_) {}
    } else if (!isZip && !isContinuation) {
      // CSV direto: baixar para disco
      await streamDownload(job.file_url, csvPath);
    }

    // 3. Contar total de linhas (uma vez, do arquivo em disco)
    if (job.total_linhas_arquivo === 0) {
      const totalLinhas = await countFileLines(csvPath);
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

    // 5. Importar do arquivo em disco (streaming)
    await base44.asServiceRole.entities.TSEImportJob.update(job.id, {
      status: 'importando', etapa: 'importando', ultima_atividade: new Date().toISOString(),
    });

    const result = await parseAndImportFromFile(
      base44, csvPath, job.ano, job.uf,
      job.municipio || null, dedupSet, job.linha_offset, startTime, job.id
    );

    // Limpa CSV se concluído
    if (result.complete) {
      try { await Deno.remove(csvPath); } catch (_) {}
    }

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
      await updateSyncStatus(base44, job.ano, job.uf, 'importado', '', newRegistros);
    } else {
      updateData.progresso = job.total_linhas_arquivo > 0
        ? Math.min(99, Math.round((newLinhas / job.total_linhas_arquivo) * 100))
        : 0;
      if (speed > 0 && job.total_linhas_arquivo > 0) {
        updateData.tempo_estimado_segundos = Math.round((job.total_linhas_arquivo - newLinhas) / speed);
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
    // Limpa arquivos temporários
    try { if (tmpDir) await Deno.remove(tmpDir, { recursive: true }); } catch (_) {}
    return Response.json({
      success: false, job_id: job.id, status: 'erro',
      error: error.message,
      message: `Erro na importação: ${error.message}. Use continue_import para retomar.`,
      retryable: true,
    });
  }
}

// ============ STREAMING CSV PARSER (LEITURA CHUNKED DO DISCO) ============
async function parseAndImportFromFile(base44, filePath, year, state, municipio, dedupSet, startOffset, budgetStartMs, jobId) {
  const file = await Deno.open(filePath, { read: true });
  try {
    const fileInfo = await file.stat();
    const fileSize = fileInfo.size;

    // Ler cabeçalho (primeiros 8KB)
    const headBuf = new Uint8Array(8192);
    await file.read(headBuf);
    const headText = new TextDecoder().decode(headBuf);
    const headerEndRaw = headText.indexOf('\n');
    if (headerEndRaw === -1) throw new Error('CSV sem cabeçalho.');
    let headerLen = headerEndRaw;
    if (headText[headerEndRaw - 1] === '\r') headerLen--;
    const headerLine = headText.slice(0, headerLen);
    const delimiter = detectarSeparador(headerLine);
    const header = parseCSVLine(headerLine, delimiter);
    const ufIdx = header.findIndex(h => h === 'SG_UF');
    if (ufIdx === -1) throw new Error('Coluna SG_UF não encontrada.');
    const dataStartByte = headerEndRaw + 1;

    // Detectar encoding
    const sample = headText.slice(0, 200);
    const needsLatin = sample.includes('Ã§') || sample.includes('Ã£') || sample.includes('Ã©') || sample.includes('Ã') || sample.includes('Ã´');
    const decoder = needsLatin ? new TextDecoder('iso-8859-1') : new TextDecoder();

    // Reposicionar após cabeçalho
    await file.seek(dataStartByte, Deno.SeekMode.Start);

    if (startOffset > 0) {
      await file.seek(startOffset, Deno.SeekMode.Start);
    }

    let bytePos = startOffset > 0 ? startOffset : dataStartByte;

    const municipioUpper = municipio ? municipio.toUpperCase() : null;
    const municipioIdx = municipio ? header.findIndex(h => h === 'NM_MUNICIPIO') : -1;

    const chunkSize = 262144; // 256KB chunks
    let remainder = '';
    let batch = [];
    let recordsImported = 0;
    let duplicatesSkipped = 0;
    let linesProcessed = 0;

    const buf = new Uint8Array(chunkSize);
    while (true) {
      const elapsed = Date.now() - budgetStartMs;
      if (elapsed > MAX_RUNTIME_MS && recordsImported > 0) {
        return { complete: false, recordsImported, duplicatesSkipped, linesProcessed, bytesProcessed: bytePos - (startOffset > 0 ? startOffset : dataStartByte) };
      }

      const n = await file.read(buf);
      if (n === null) break;

      const chunk = decoder.decode(buf.slice(0, n));
      const combined = remainder + chunk;
      const chunkLines = combined.split('\n');
      // Último elemento pode estar incompleto
      remainder = chunkLines.pop() || '';

      for (const line of chunkLines) {
        bytePos += line.length + 1;
        if (!line.trim()) continue;

        linesProcessed++;
        const values = parseCSVLine(line, delimiter);
        if (values.length < header.length) continue;
        if (values[ufIdx] !== state) continue;
        if (municipioUpper && municipioIdx >= 0 && values[municipioIdx].toUpperCase() !== municipioUpper) continue;

        const dedupKey = buildDedupKey(values, header, year, state);
        if (dedupSet.has(dedupKey)) { duplicatesSkipped++; continue; }
        dedupSet.add(dedupKey);

        batch.push(buildRecordFromCSV(header, values, year, state));

        if (batch.length >= BATCH_SIZE) {
          await base44.asServiceRole.entities.TSEVoteResult.bulkCreate(batch);
          recordsImported += batch.length;
          batch = [];
        }
      }
    }

    // Processar resto
    if (remainder.trim()) {
      linesProcessed++;
      const values = parseCSVLine(remainder, delimiter);
      if (values.length >= header.length && values[ufIdx] === state &&
          (!municipioUpper || municipioIdx < 0 || values[municipioIdx].toUpperCase() === municipioUpper)) {
        const dedupKey = buildDedupKey(values, header, year, state);
        if (!dedupSet.has(dedupKey)) {
          dedupSet.add(dedupKey);
          batch.push(buildRecordFromCSV(header, values, year, state));
        } else {
          duplicatesSkipped++;
        }
      }
    }

    if (batch.length > 0) {
      await base44.asServiceRole.entities.TSEVoteResult.bulkCreate(batch);
      recordsImported += batch.length;
    }

    return { complete: true, recordsImported, duplicatesSkipped, linesProcessed, bytesProcessed: fileSize - (startOffset > 0 ? startOffset : dataStartByte) };
  } finally {
    try { file.close(); } catch (_) {}
  }
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

// ============ RESOLVE SOURCE ============
async function handleResolveSource(base44, body) {
  const { ano, uf, dataset_tipo = 'votacao_secao' } = body;
  if (!ano || !uf) return Response.json({ error: 'Parâmetros obrigatórios: ano, uf' }, { status: 400 });

  const year = parseInt(ano);
  const state = uf.toUpperCase();
  const cdnPath = DATASET_CDN_PATH[dataset_tipo];
  if (!cdnPath) return Response.json({ error: 'Dataset inválido' }, { status: 400 });

  const isNacional = DATASETS_NACIONAIS.has(dataset_tipo);
  const url = isNacional
    ? `${TSE_CDN_BASE}/${cdnPath}/${cdnPath}_${year}.zip`
    : `${TSE_CDN_BASE}/${cdnPath}/${cdnPath}_${year}_${state}.zip`;

  const cached = await base44.asServiceRole.entities.TSEDataSourceMap.filter({ ano: year, uf: state, dataset_tipo });
  if (cached.length > 0) {
    return Response.json({ success: true, fonte: cached[0], cdn_url: url, nacional: isNacional });
  }

  let status = 'nao_verificado';
  let sizeBytes = 0;
  try {
    const headRes = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(10000) });
    if (headRes.ok) {
      sizeBytes = parseInt(headRes.headers.get('content-length') || '0');
      status = sizeBytes > 0 ? 'disponivel' : 'indisponivel';
    } else {
      status = 'indisponivel';
    }
  } catch (_e) {
    status = 'indisponivel';
  }

  const observacao = isNacional
    ? 'Este arquivo é nacional. O filtro UF/Município será aplicado após a importação ou no processamento em lote.'
    : (status === 'indisponivel'
      ? 'URL não encontrada no CDN do TSE.'
      : null);

  await base44.asServiceRole.entities.TSEDataSourceMap.create({
    ano: year, uf: state, dataset_tipo, fonte_url: url, formato: 'zip',
    status, tamanho_estimado: sizeBytes, observacao: observacao || '',
  });

  return Response.json({
    success: true,
    fonte: { ano: year, uf: state, dataset_tipo, fonte_url: url, formato: 'zip', status, tamanho_estimado: sizeBytes, observacao, nacional: isNacional },
    cdn_url: url,
    nacional: isNacional,
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

// ============ UTILITÁRIOS ZIP/CSV (DISCO) ============

// Download com streaming — salva em disco sem carregar na memória
async function streamDownload(url, destPath) {
  console.log('[streamDownload] Iniciando fetch:', url);
  let res;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(300000) });
  } catch (fe) {
    console.error('[streamDownload] Fetch falhou:', fe.message, fe.name);
    throw new Error(`Falha na rede ao baixar: ${fe.message}`);
  }
  if (!res.ok) throw new Error(`Falha no download: HTTP ${res.status}`);
  console.log('[streamDownload] Resposta OK, Content-Length:', res.headers.get('content-length'));
  const file = await Deno.open(destPath, { write: true, create: true, truncate: true });
  console.log('[streamDownload] Arquivo criado:', destPath);
  try {
    const reader = res.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      await file.write(value);
    }
  } finally {
    try { file.close(); } catch (_) {}
  }
}

// Extrai CSV de ZIP em disco para arquivo em disco
async function extractCSVToFile(zipPath, csvPath, state, isNacional) {
  // Lê os últimos 64KB para encontrar o central directory
  const zipInfo = await Deno.stat(zipPath);
  const zipSize = zipInfo.size;
  const tailSize = Math.min(65536, zipSize);
  const zipFile = await Deno.open(zipPath, { read: true });
  let csvEntry = null;

  try {
    // Buscar EOCD e CD
    await zipFile.seek(-tailSize, Deno.SeekMode.End);
    const tailBuf = new Uint8Array(tailSize);
    await zipFile.read(tailBuf);
    const view = new DataView(tailBuf.buffer, tailBuf.byteOffset, tailBuf.byteLength);

    // Encontrar EOCD
    let eocdPos = -1;
    for (let i = tailBuf.length - 22; i >= 0; i--) {
      if (tailBuf[i] === 0x50 && tailBuf[i+1] === 0x4b && tailBuf[i+2] === 0x05 && tailBuf[i+3] === 0x06) {
        eocdPos = i;
        break;
      }
    }
    if (eocdPos === -1) throw new Error('ZIP inválido — EOCD não encontrado.');

    const cdOffset = view.getUint32(eocdPos + 16, true);
    const cdSize = view.getUint32(eocdPos + 12, true);
    // cdOffset é relativo ao início do arquivo, e o tail começa em zipSize-tailSize

    // Mapear cdOffset para posição no tailBuf
    const cdInTail = cdOffset - (zipSize - tailSize);
    let candidates = [];

    if (cdInTail >= 0 && cdInTail < tailBuf.length) {
      // CD está dentro do tail que lemos
      let pos = cdInTail;
      while (pos < tailBuf.length - 46) {
        const sig = view.getUint32(pos, true);
        if (sig !== 0x02014b50) break;
        const compMethod = view.getUint16(pos + 10, true);
        const fileNameLen = view.getUint16(pos + 28, true);
        const extraLen = view.getUint16(pos + 30, true);
        const commentLen = view.getUint16(pos + 32, true);
        const localHeaderOff = view.getUint32(pos + 42, true);
        const compSize = view.getUint32(pos + 20, true);
        const nameBytes = tailBuf.slice(pos + 46, pos + 46 + fileNameLen);
        const fileName = new TextDecoder().decode(nameBytes);

        if (fileName.toLowerCase().endsWith('.csv')) {
          const lhPos = localHeaderOff;
          // Precisamos ler o local header para saber nameLen + extraLen
          const lhBuf = new Uint8Array(30);
          await zipFile.seek(lhPos, Deno.SeekMode.Start);
          await zipFile.read(lhBuf);
          const lhView = new DataView(lhBuf.buffer, lhBuf.byteOffset, lhBuf.byteLength);
          const lhNameLen = lhView.getUint16(26, true);
          const lhExtraLen = lhView.getUint16(28, true);
          const dataStart = lhPos + 30 + lhNameLen + lhExtraLen;

          candidates.push({
            name: fileName,
            dataStart,
            compSize,
            method: compMethod === 8 ? 'deflate' : 'store',
          });
        }
        pos += 46 + fileNameLen + extraLen + commentLen;
      }
    }

    if (candidates.length === 0) throw new Error('Nenhum CSV encontrado no ZIP.');

    // Selecionar CSV correto
    if (isNacional && state) {
      const suffix = `_${state}.csv`;
      csvEntry = candidates.find(f => f.name.endsWith(suffix));
      if (!csvEntry) csvEntry = candidates.find(f => f.name.includes('_BRASIL.csv'));
      if (!csvEntry) csvEntry = candidates[0];
    } else {
      csvEntry = candidates[0];
    }

    // Extrair CSVEntry para csvPath (streaming para disco)
    const outFile = await Deno.open(csvPath, { write: true, create: true, truncate: true });
    try {
      await zipFile.seek(csvEntry.dataStart, Deno.SeekMode.Start);

      if (csvEntry.method === 'deflate') {
        // Ler todos os dados comprimidos primeiro (tamanho gerenciável)
        const compData = new Uint8Array(csvEntry.compSize);
        let readTotal = 0;
        while (readTotal < csvEntry.compSize) {
          const n = await zipFile.read(compData.subarray(readTotal));
          if (n === null) break;
          readTotal += n;
        }

        // Descomprimir via streams e escrever no disco
        const ds = new DecompressionStream('deflate-raw');
        const writer = ds.writable.getWriter();
        const reader = ds.readable.getReader();
        writer.write(compData);
        writer.close();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          await outFile.write(value);
        }
      } else {
        // Store — copiar em chunks direto para disco
        const chunk = new Uint8Array(65536);
        let remaining = csvEntry.compSize;
        while (remaining > 0) {
          const toRead = Math.min(65536, remaining);
          const readChunk = new Uint8Array(toRead);
          const n = await zipFile.read(readChunk);
          if (n === null) break;
          await outFile.write(readChunk.subarray(0, n));
          remaining -= n;
        }
      }
    } finally {
      try { outFile.close(); } catch (_) {}
    }
  } finally {
    try { zipFile.close(); } catch (_) {}
  }
}

// Conta linhas em arquivo sem carregar tudo
async function countFileLines(filePath) {
  const file = await Deno.open(filePath, { read: true });
  try {
    const buf = new Uint8Array(262144);
    let count = 0;
    while (true) {
      const n = await file.read(buf);
      if (n === null) break;
      for (let i = 0; i < n; i++) {
        if (buf[i] === 10) count++; // \n
      }
    }
    // Se arquivo não terminar com \n, conta a última linha
    if (count === 0) return 1; // pelo menos o cabeçalho
    return count;
  } finally {
    try { file.close(); } catch (_) {}
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