import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ============ CONFIGURAÇÃO ============
const DATASTORE_RESOURCES = {
  '2024': { prefeito: 'c5e1bff9-98f1-4d3b-b944-37cd22c84112', vereador: 'c5e1bff9-98f1-4d3b-b944-37cd22c84112' },
  '2022': { presidente: null, governador: null },
  '2020': { prefeito: null, vereador: null },
};

const CARGO_MAP = {
  prefeito: '11', vereador: '13', governador: '3',
  deputado_estadual: '7', deputado_federal: '6', senador: '5', presidente: '1',
};

const DATASTORE_URL = 'https://dadosabertos.tse.jus.br/api/3/action/datastore_search';

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

    return Response.json({ error: 'Ação inválida. Use: query, sync, sync_status, import_file' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// ============ CONSULTA LOCAL ============
async function handleLocalQuery(base44, body) {
  const { ano, uf, cargo, municipio, zona, secao, candidato } = body;
  if (!ano || !uf) return Response.json({ error: 'Parâmetros obrigatórios: ano, uf' }, { status: 400 });

  const syncStatus = await base44.asServiceRole.entities.TSESyncStatus.filter({
    ano: parseInt(ano), uf: uf.toUpperCase(), status: 'importado',
  }, '', 5);

  if (syncStatus.length === 0) {
    return Response.json({ success: true, isSynced: false, data: [], total: 0, message: 'Base não sincronizada.' });
  }

  const query = { ano: parseInt(ano), uf: uf.toUpperCase() };
  if (cargo) query.cargo = cargo;
  if (municipio) query.municipio = municipio;
  if (zona) query.zona = zona;
  if (secao) query.secao = secao;
  if (candidato) {
    const isNumeric = /^\d+$/.test(candidato);
    query[isNumeric ? 'numero_candidato' : 'nome_candidato'] = isNumeric ? candidato : candidato.toUpperCase();
  }

  const results = await base44.asServiceRole.entities.TSEVoteResult.filter(query, '-votos', 200);
  return Response.json({ success: true, isSynced: true, data: results, total: results.length, syncInfo: syncStatus[0] });
}

// ============ SINCRONIZAÇÃO (via CKAN Datastore) ============
async function handleSync(base44, body) {
  const { ano, uf } = body;
  if (!ano || !uf) return Response.json({ error: 'Parâmetros obrigatórios: ano, uf' }, { status: 400 });

  const year = parseInt(ano);
  const state = uf.toUpperCase();
  const yearStr = String(year);

  // Verificar / criar status
  const existing = await base44.asServiceRole.entities.TSESyncStatus.filter({ ano: year, uf: state, tipo_dataset: 'votacao' });
  if (existing.length > 0 && existing[0].status === 'importando') {
    return Response.json({ success: false, message: 'Importação já em andamento.' });
  }

  if (existing.length > 0) {
    await base44.asServiceRole.entities.TSESyncStatus.update(existing[0].id, { status: 'importando', mensagem_erro: '' });
  } else {
    await base44.asServiceRole.entities.TSESyncStatus.create({
      ano: year, uf: state, tipo_dataset: 'votacao', status: 'importando',
      fonte_url: `https://dadosabertos.tse.jus.br/dataset/resultados-${year}`,
    });
  }

  let totalImported = 0;
  let sourceUsed = 'none';
  let needsUpload = false;

  try {
    // Tentar CKAN Datastore
    const dsResources = DATASTORE_RESOURCES[yearStr] || {};
    let dsSuccess = false;

    for (const [cargo, resourceId] of Object.entries(dsResources)) {
      if (!resourceId) continue;
      try {
        const count = await importFromDatastore(base44, resourceId, year, state, cargo);
        if (count > 0) { totalImported += count; dsSuccess = true; sourceUsed = 'ckan_datastore'; }
      } catch (e) {
        console.log(`Datastore falhou para ${cargo}: ${e.message}`);
      }
    }

    if (!dsSuccess) {
      // Datastore indisponível → orientar upload manual
      needsUpload = true;
      sourceUsed = 'upload_required';
    }

    // Atualizar status final
    const statusRec = await base44.asServiceRole.entities.TSESyncStatus.filter({ ano: year, uf: state, tipo_dataset: 'votacao' });
    if (statusRec.length > 0) {
      const updateData = needsUpload
        ? { status: 'nao_importado', mensagem_erro: 'Datastore TSE indisponível para este ano. Use a importação por arquivo CSV.', total_linhas: 0 }
        : { status: 'importado', total_linhas: totalImported, data_ultima_sincronizacao: new Date().toISOString(), mensagem_erro: '' };
      await base44.asServiceRole.entities.TSESyncStatus.update(statusRec[0].id, updateData);
    }

    if (needsUpload) {
      const tseUrl = `https://dadosabertos.tse.jus.br/dataset/resultados-${year}`;
      return Response.json({
        success: true,
        needs_upload: true,
        total_importado: 0,
        message: 'API do TSE indisponível para sincronização automática neste ano. Baixe o CSV no portal do TSE e use a importação por arquivo.',
        tse_url: tseUrl,
        instructions: `Acesse ${tseUrl}, baixe o arquivo "Votação nominal por município e zona", extraia o CSV e faça upload na seção de importação.`,
      });
    }

    return Response.json({ success: true, total_importado: totalImported, uf: state, ano: year, fonte: sourceUsed });
  } catch (error) {
    const statusRec = await base44.asServiceRole.entities.TSESyncStatus.filter({ ano: year, uf: state, tipo_dataset: 'votacao' });
    if (statusRec.length > 0) {
      await base44.asServiceRole.entities.TSESyncStatus.update(statusRec[0].id, { status: 'erro', mensagem_erro: error.message });
    }
    return Response.json({ success: false, error: error.message });
  }
}

// ============ IMPORTAÇÃO VIA CKAN DATASTORE ============
async function importFromDatastore(base44, resourceId, year, state, cargo) {
  let total = 0;
  let offset = 0;

  while (true) {
    const params = new URLSearchParams({
      resource_id: resourceId,
      limit: '200',
      offset: String(offset),
      filters: JSON.stringify({ sg_uf: state, cd_cargo: CARGO_MAP[cargo] || '' }),
    });

    const res = await fetch(`${DATASTORE_URL}?${params}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) throw new Error(`Datastore HTTP ${res.status}`);

    const data = await res.json();
    const records = data?.result?.records || [];
    if (records.length === 0) break;

    const mapped = mapTSEFieldNames(records, year, state, cargo);
    if (mapped.length > 0) {
      await base44.asServiceRole.entities.TSEVoteResult.bulkCreate(mapped);
      total += mapped.length;

      const uniqueCandidates = [...new Map(mapped.map(m => [`${m.numero_candidato}|${m.cargo}`, m])).values()];
      const candidateRecords = uniqueCandidates.map(c => ({
        ano: year, uf: state, municipio: c.municipio, cargo: c.cargo,
        numero: c.numero_candidato, nome: c.nome_candidato, partido: c.partido,
        situacao: 'concorrendo', tse_resource_id: resourceId,
      }));
      await base44.asServiceRole.entities.TSECandidate.bulkCreate(candidateRecords);
    }

    offset += records.length;
    if (records.length < 200) break;
  }

  return total;
}

// ============ IMPORTAÇÃO POR ARQUIVO (CSV/ZIP enviado pelo usuário) ============
async function handleFileImport(base44, body) {
  const { ano, uf, file_url } = body;
  if (!ano || !uf || !file_url) return Response.json({ error: 'Parâmetros obrigatórios: ano, uf, file_url' }, { status: 400 });

  const year = parseInt(ano);
  const state = uf.toUpperCase();

  // Verificar status
  const existing = await base44.asServiceRole.entities.TSESyncStatus.filter({ ano: year, uf: state, tipo_dataset: 'votacao' });
  if (existing.length > 0 && existing[0].status === 'importando') {
    return Response.json({ success: false, message: 'Importação já em andamento.' });
  }

  if (existing.length > 0) {
    await base44.asServiceRole.entities.TSESyncStatus.update(existing[0].id, { status: 'importando', mensagem_erro: '' });
  } else {
    await base44.asServiceRole.entities.TSESyncStatus.create({
      ano: year, uf: state, tipo_dataset: 'votacao', status: 'importando',
      fonte_url: file_url,
    });
  }

  try {
    // Baixar o arquivo
    const fileRes = await fetch(file_url, { signal: AbortSignal.timeout(120000) });
    if (!fileRes.ok) throw new Error(`Erro ao baixar arquivo: HTTP ${fileRes.status}`);

    const contentType = fileRes.headers.get('content-type') || '';
    const buffer = await fileRes.arrayBuffer();

    let csvText;

    if (contentType.includes('zip') || file_url.endsWith('.zip')) {
      // Arquivo ZIP
      csvText = await extractCSVFromZip(buffer);
    } else {
      // CSV direto
      csvText = new TextDecoder().decode(new Uint8Array(buffer));
    }

    const total = await parseAndImportCSV(base44, csvText, year, state);

    // Atualizar status
    const statusRec = await base44.asServiceRole.entities.TSESyncStatus.filter({ ano: year, uf: state, tipo_dataset: 'votacao' });
    if (statusRec.length > 0) {
      await base44.asServiceRole.entities.TSESyncStatus.update(statusRec[0].id, {
        status: 'importado',
        total_linhas: total,
        data_ultima_sincronizacao: new Date().toISOString(),
        mensagem_erro: '',
      });
    }

    return Response.json({ success: true, total_importado: total, uf: state, ano: year, fonte: 'arquivo_usuario' });
  } catch (error) {
    const statusRec = await base44.asServiceRole.entities.TSESyncStatus.filter({ ano: year, uf: state, tipo_dataset: 'votacao' });
    if (statusRec.length > 0) {
      await base44.asServiceRole.entities.TSESyncStatus.update(statusRec[0].id, { status: 'erro', mensagem_erro: error.message });
    }
    return Response.json({ success: false, error: error.message });
  }
}

// ============ ZIP PARSER INLINE ============
function findCSVInZip(buf) {
  const data = new Uint8Array(buf);
  let cdOffset = -1;
  for (let i = data.length - 4; i >= 0; i--) {
    if (data[i] === 0x50 && data[i+1] === 0x4b && data[i+2] === 0x01 && data[i+3] === 0x02) {
      cdOffset = i; break;
    }
  }
  if (cdOffset === -1) throw new Error('ZIP inválido.');

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
    const uncompSize = view.getUint32(pos + 24, true);

    const nameBytes = data.slice(pos + 46, pos + 46 + fileNameLen);
    const fileName = new TextDecoder().decode(nameBytes);

    if (fileName.endsWith('.csv')) {
      const lhPos = localHeaderOff;
      const lhNameLen = view.getUint16(lhPos + 26, true);
      const lhExtraLen = view.getUint16(lhPos + 28, true);
      const dataStart = lhPos + 30 + lhNameLen + lhExtraLen;

      const compressed = data.slice(dataStart, dataStart + compSize);
      files.push({ name: fileName, data: compressed, size: uncompSize, method: compMethod === 8 ? 'deflate' : 'store' });
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

// ============ CSV PARSER ============
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === ';' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

async function parseAndImportCSV(base44, csvText, year, state) {
  const lines = csvText.split('\n');
  if (lines.length < 2) throw new Error('CSV vazio.');

  const header = parseCSVLine(lines[0]);
  const sgUfIdx = header.findIndex(h => h === 'SG_UF');
  if (sgUfIdx === -1) throw new Error('Coluna SG_UF não encontrada no CSV.');

  let batch = [];
  let total = 0;
  let imported = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);
    if (values[sgUfIdx] !== state) continue;

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

// ============ HELPERS ============
function mapTSEFieldNames(records, year, state, cargo) {
  return records.map(r => ({
    ano: year,
    turno: 1,
    uf: state,
    municipio: r.nm_municipio || r.NM_MUNICIPIO || '',
    zona: String(r.nr_zona || r.NR_ZONA || ''),
    secao: String(r.nr_secao || r.NR_SECAO || ''),
    cargo: cargo,
    numero_candidato: String(r.nr_candidato || r.NR_CANDIDATO || ''),
    nome_candidato: r.nm_candidato || r.NM_CANDIDATO || '',
    partido: r.nm_partido || r.NM_PARTIDO || r.sg_partido || r.SG_PARTIDO || '',
    votos: parseInt(r.qt_votos_nominais || r.QT_VOTOS_NOMINAIS) || 0,
    local_votacao: r.nm_local_votacao || r.NM_LOCAL_VOTACAO || '',
  }));
}

function buildRecordFromCSV(header, values, year, state) {
  const get = (name) => {
    const idx = header.findIndex(h => h === name);
    return idx >= 0 ? values[idx] || '' : '';
  };

  const cargoCd = get('CD_CARGO');
  const cargoName = get('DS_CARGO') ||
    Object.entries(CARGO_MAP).find(([_, v]) => v === cargoCd)?.[0] || cargoCd;

  const numero = get('NR_VOTAVEL') || get('NR_CANDIDATO') || '';
  const nome = get('NM_VOTAVEL') || get('NM_CANDIDATO') || '';
  const votos = parseInt(get('QT_VOTOS')) || parseInt(get('QT_VOTOS_NOMINAIS')) || 0;
  const local = get('NM_LOCAL_VOTACAO') || '';

  return {
    ano: year,
    turno: parseInt(get('NR_TURNO')) || 1,
    uf: state,
    municipio: get('NM_MUNICIPIO'),
    codigo_municipio: get('CD_MUNICIPIO') || '',
    zona: get('NR_ZONA') || '',
    secao: get('NR_SECAO') || '',
    cargo: cargoName,
    numero_candidato: String(numero),
    nome_candidato: nome,
    partido: get('SG_PARTIDO') || get('NM_PARTIDO') || '',
    votos: votos,
    local_votacao: local,
  };
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