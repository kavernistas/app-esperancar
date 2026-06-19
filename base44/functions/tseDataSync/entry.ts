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

    return Response.json({ error: 'Ação inválida. Use: query, sync, sync_status, import_file, resolve_source' }, { status: 400 });
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
  const totalCount = results.length;

  return Response.json({
    success: true,
    isSynced: true,
    data: results,
    total: totalCount,
    syncInfo: syncStatus[0],
    message: `Base oficial TSE sincronizada localmente para ${state}/${year}.`,
  });
}

// ============ SINCRONIZAÇÃO (Download CDN TSE) ============
async function handleSync(base44, body) {
  const { ano, uf, dataset_tipo = 'votacao_secao' } = body;
  if (!ano || !uf) return Response.json({ error: 'Parâmetros obrigatórios: ano, uf' }, { status: 400 });

  const year = parseInt(ano);
  const state = uf.toUpperCase();
  const path = DATASET_PATH[dataset_tipo];

  if (!path) {
    return Response.json({ error: 'Dataset inválido', validos: Object.keys(DATASET_PATH) }, { status: 400 });
  }

  const cdnUrl = `${TSE_CDN_BASE}/${path}/${path}_${year}_${state}.zip`;

  // Verificar/criar status de sincronização
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

  // Verificar tamanho do arquivo
  let fileSize = 0;
  try {
    const headRes = await fetch(cdnUrl, { method: 'HEAD', signal: AbortSignal.timeout(15000) });
    if (headRes.ok) {
      const cl = headRes.headers.get('content-length');
      fileSize = cl ? parseInt(cl) : 0;
    }
  } catch (_e) {
    fileSize = 0;
  }

  // Atualizar/criar cache de fonte
  const cachedSources = await base44.asServiceRole.entities.TSEDataSourceMap.filter({ ano: year, uf: state, dataset_tipo });
  if (cachedSources.length > 0) {
    await base44.asServiceRole.entities.TSEDataSourceMap.update(cachedSources[0].id, {
      status: fileSize > 0 ? (fileSize <= MAX_DOWNLOAD_SIZE ? 'disponivel' : 'muito_grande') : 'indisponivel',
      tamanho_estimado: fileSize,
      fonte_url: cdnUrl,
    });
  } else {
    await base44.asServiceRole.entities.TSEDataSourceMap.create({
      ano: year, uf: state, dataset_tipo, fonte_url: cdnUrl, formato: 'zip',
      status: fileSize > 0 ? (fileSize <= MAX_DOWNLOAD_SIZE ? 'disponivel' : 'muito_grande') : 'indisponivel',
      tamanho_estimado: fileSize,
    });
  }

  // Se arquivo muito grande ou indisponível → upload manual
  if (fileSize === 0) {
    await updateSyncStatus(base44, year, state, 'nao_importado', 'URL não encontrada no CDN do TSE.');
    return Response.json({
      success: true, needs_upload: true, total_importado: 0,
      message: `O TSE disponibiliza este recurso como arquivo ZIP/CSV. Faça a importação para consultar no app. URL: ${cdnUrl}`,
      tse_url: cdnUrl,
    });
  }

  if (fileSize > MAX_DOWNLOAD_SIZE) {
    await updateSyncStatus(base44, year, state, 'nao_importado',
      `Arquivo de ${(fileSize/(1024*1024)).toFixed(1)}MB excede o limite de 50MB. Baixe manualmente.`);
    return Response.json({
      success: true, needs_upload: true, total_importado: 0,
      message: `O TSE disponibiliza este recurso como arquivo ZIP de ${(fileSize/(1024*1024)).toFixed(1)}MB (acima do limite de 50MB). Baixe o arquivo e faça upload manual.`,
      tse_url: cdnUrl, file_size_mb: (fileSize/(1024*1024)).toFixed(1),
    });
  }

  // Download e importação
  let totalImported = 0;
  try {
    const downloadRes = await fetch(cdnUrl, { signal: AbortSignal.timeout(120000) });
    if (!downloadRes.ok) throw new Error(`CDN HTTP ${downloadRes.status}`);

    const buffer = await downloadRes.arrayBuffer();
    const csvText = await extractCSVFromZip(buffer);

    totalImported = await parseAndImportCSV(base44, csvText, year, state);

    await updateSyncStatus(base44, year, state, 'importado', '', totalImported);

    return Response.json({
      success: true, total_importado: totalImported, uf: state, ano: year,
      fonte: 'cdn_tse', message: `Base oficial TSE sincronizada localmente. ${totalImported} registros.`,
    });
  } catch (error) {
    await updateSyncStatus(base44, year, state, 'erro', error.message);
    return Response.json({
      success: false, needs_upload: true, error: error.message,
      message: 'Erro no download automático. Tente o upload manual do arquivo.',
      tse_url: cdnUrl,
    });
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

// ============ IMPORTAÇÃO POR ARQUIVO (Upload usuário) ============
async function handleFileImport(base44, body) {
  const { ano, uf, file_url, dataset_tipo = 'votacao_secao' } = body;
  if (!ano || !uf || !file_url) return Response.json({ error: 'Parâmetros obrigatórios: ano, uf, file_url' }, { status: 400 });

  const year = parseInt(ano);
  const state = uf.toUpperCase();

  const existing = await base44.asServiceRole.entities.TSESyncStatus.filter({ ano: year, uf: state, tipo_dataset: 'votacao' });
  if (existing.length > 0 && existing[0].status === 'importando') {
    return Response.json({ success: false, message: 'Importação já em andamento.' });
  }

  if (existing.length > 0) {
    await base44.asServiceRole.entities.TSESyncStatus.update(existing[0].id, { status: 'importando', mensagem_erro: '' });
  } else {
    await base44.asServiceRole.entities.TSESyncStatus.create({
      ano: year, uf: state, tipo_dataset: 'votacao', status: 'importando', fonte_url: file_url,
    });
  }

  try {
    const fileRes = await fetch(file_url, { signal: AbortSignal.timeout(120000) });
    if (!fileRes.ok) throw new Error(`Erro ao baixar arquivo: HTTP ${fileRes.status}`);

    const buffer = await fileRes.arrayBuffer();
    const fileUrlLower = file_url.toLowerCase();
    const contentType = fileRes.headers.get('content-type') || '';

    let csvText;
    if (contentType.includes('zip') || fileUrlLower.endsWith('.zip')) {
      csvText = await extractCSVFromZip(buffer);
    } else {
      csvText = new TextDecoder().decode(new Uint8Array(buffer));
    }

    // Detectar encoding (Latin1 → UTF-8)
    csvText = normalizarEncoding(csvText);

    const total = await parseAndImportCSV(base44, csvText, year, state);

    await updateSyncStatus(base44, year, state, 'importado', '', total);

    return Response.json({
      success: true, total_importado: total, uf: state, ano: year,
      fonte: 'arquivo_usuario', message: `Base oficial TSE importada com sucesso. ${total} registros.`,
    });
  } catch (error) {
    await updateSyncStatus(base44, year, state, 'erro', error.message);
    return Response.json({ success: false, error: error.message });
  }
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

// ============ ZIP EXTRACTION ============
function findCSVInZip(buf) {
  const data = new Uint8Array(buf);
  let cdOffset = -1;
  for (let i = data.length - 4; i >= 0; i--) {
    if (data[i] === 0x50 && data[i+1] === 0x4b && data[i+2] === 0x01 && data[i+3] === 0x02) {
      cdOffset = i; break;
    }
  }
  if (cdOffset === -1) throw new Error('ZIP inválido — arquivo corrompido ou formato não suportado.');

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
  if (files.length === 0) throw new Error('Nenhum arquivo CSV encontrado no ZIP.');

  const csvFile = files[0];
  let csvData;
  if (csvFile.method === 'deflate') {
    csvData = await inflateData(csvFile.data);
  } else {
    csvData = csvFile.data;
  }
  return new TextDecoder().decode(csvData);
}

// ============ CSV PARSER ============
function normalizarEncoding(text) {
  // Tenta detectar se é Latin1 (ISO-8859-1) com caracteres mal decodificados
  // Se já for UTF-8 válido, retorna como está
  try {
    // Testa se há caracteres de substituição comuns de Latin1 mal interpretado
    if (text.includes('Ã§') || text.includes('Ã£') || text.includes('Ã©') || text.includes('Ã') || text.includes('Ã´')) {
      // Provavelmente Latin1 interpretado como UTF-8
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

async function parseAndImportCSV(base44, csvText, year, state) {
  const lines = csvText.split('\n').filter(l => l.trim());
  if (lines.length < 2) throw new Error('CSV vazio ou com apenas cabeçalho.');

  const delimiter = detectarSeparador(lines[0]);
  const header = parseCSVLine(lines[0], delimiter);

  // Encontrar coluna de UF
  const ufIdx = header.findIndex(h => h === 'SG_UF');
  if (ufIdx === -1) throw new Error('Coluna SG_UF não encontrada. Verifique o formato do arquivo TSE.');

  let batch = [];
  let total = 0;
  let imported = 0;

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i], delimiter);
    if (values.length < header.length) continue;
    if (values[ufIdx] !== state) continue;

    const record = buildRecordFromCSV(header, values, year, state);
    batch.push(record);
    total++;

    if (batch.length >= 100) {
      await base44.asServiceRole.entities.TSEVoteResult.bulkCreate(batch);
      imported += batch.length;
      batch = [];
    }
  }

  if (batch.length > 0) {
    await base44.asServiceRole.entities.TSEVoteResult.bulkCreate(batch);
    imported += batch.length;
  }

  return imported;
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