import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Fontes TSE: primária = CKAN datastore; secundária = CSV ZIP via CDN
// URLs por UF: relatórios de totalização (~2-8MB cada)
// Formato: {ano}_{uf} → URL do ZIP
// Para anos sem URL por UF, use o dataset nacional com atenção ao tamanho
const PER_UF_CSV_URLS = {
  '2024_AC': 'https://cdn.tse.jus.br/estatistica/sead/odsele/relatorio_resultado_totalizacao/Relatorio_Resultado_Totalizacao_2024_AC.zip',
  '2024_AL': 'https://cdn.tse.jus.br/estatistica/sead/odsele/relatorio_resultado_totalizacao/Relatorio_Resultado_Totalizacao_2024_AL.zip',
  '2024_AM': 'https://cdn.tse.jus.br/estatistica/sead/odsele/relatorio_resultado_totalizacao/Relatorio_Resultado_Totalizacao_2024_AM.zip',
  '2024_AP': 'https://cdn.tse.jus.br/estatistica/sead/odsele/relatorio_resultado_totalizacao/Relatorio_Resultado_Totalizacao_2024_AP.zip',
  '2024_BA': 'https://cdn.tse.jus.br/estatistica/sead/odsele/relatorio_resultado_totalizacao/Relatorio_Resultado_Totalizacao_2024_BA.zip',
  '2024_CE': 'https://cdn.tse.jus.br/estatistica/sead/odsele/relatorio_resultado_totalizacao/Relatorio_Resultado_Totalizacao_2024_CE.zip',
  '2024_ES': 'https://cdn.tse.jus.br/estatistica/sead/odsele/relatorio_resultado_totalizacao/Relatorio_Resultado_Totalizacao_2024_ES.zip',
  '2024_GO': 'https://cdn.tse.jus.br/estatistica/sead/odsele/relatorio_resultado_totalizacao/Relatorio_Resultado_Totalizacao_2024_GO.zip',
  '2024_MA': 'https://cdn.tse.jus.br/estatistica/sead/odsele/relatorio_resultado_totalizacao/Relatorio_Resultado_Totalizacao_2024_MA.zip',
  '2024_MG': 'https://cdn.tse.jus.br/estatistica/sead/odsele/relatorio_resultado_totalizacao/Relatorio_Resultado_Totalizacao_2024_MG.zip',
  '2024_MS': 'https://cdn.tse.jus.br/estatistica/sead/odsele/relatorio_resultado_totalizacao/Relatorio_Resultado_Totalizacao_2024_MS.zip',
  '2024_MT': 'https://cdn.tse.jus.br/estatistica/sead/odsele/relatorio_resultado_totalizacao/Relatorio_Resultado_Totalizacao_2024_MT.zip',
  '2024_PA': 'https://cdn.tse.jus.br/estatistica/sead/odsele/relatorio_resultado_totalizacao/Relatorio_Resultado_Totalizacao_2024_PA.zip',
  '2024_PB': 'https://cdn.tse.jus.br/estatistica/sead/odsele/relatorio_resultado_totalizacao/Relatorio_Resultado_Totalizacao_2024_PB.zip',
  '2024_PE': 'https://cdn.tse.jus.br/estatistica/sead/odsele/relatorio_resultado_totalizacao/Relatorio_Resultado_Totalizacao_2024_PE.zip',
  '2024_PI': 'https://cdn.tse.jus.br/estatistica/sead/odsele/relatorio_resultado_totalizacao/Relatorio_Resultado_Totalizacao_2024_PI.zip',
  '2024_PR': 'https://cdn.tse.jus.br/estatistica/sead/odsele/relatorio_resultado_totalizacao/Relatorio_Resultado_Totalizacao_2024_PR.zip',
  '2024_RJ': 'https://cdn.tse.jus.br/estatistica/sead/odsele/relatorio_resultado_totalizacao/Relatorio_Resultado_Totalizacao_2024_RJ.zip',
  '2024_RN': 'https://cdn.tse.jus.br/estatistica/sead/odsele/relatorio_resultado_totalizacao/Relatorio_Resultado_Totalizacao_2024_RN.zip',
  '2024_RO': 'https://cdn.tse.jus.br/estatistica/sead/odsele/relatorio_resultado_totalizacao/Relatorio_Resultado_Totalizacao_2024_RO.zip',
  '2024_RR': 'https://cdn.tse.jus.br/estatistica/sead/odsele/relatorio_resultado_totalizacao/Relatorio_Resultado_Totalizacao_2024_RR.zip',
  '2024_RS': 'https://cdn.tse.jus.br/estatistica/sead/odsele/relatorio_resultado_totalizacao/Relatorio_Resultado_Totalizacao_2024_RS.zip',
  '2024_SC': 'https://cdn.tse.jus.br/estatistica/sead/odsele/relatorio_resultado_totalizacao/Relatorio_Resultado_Totalizacao_2024_SC.zip',
  '2024_SE': 'https://cdn.tse.jus.br/estatistica/sead/odsele/relatorio_resultado_totalizacao/Relatorio_Resultado_Totalizacao_2024_SE.zip',
  '2024_SP': 'https://cdn.tse.jus.br/estatistica/sead/odsele/relatorio_resultado_totalizacao/Relatorio_Resultado_Totalizacao_2024_SP.zip',
  '2024_TO': 'https://cdn.tse.jus.br/estatistica/sead/odsele/relatorio_resultado_totalizacao/Relatorio_Resultado_Totalizacao_2024_TO.zip',
};

const MAX_ZIP_BYTES = 30 * 1024 * 1024; // 30MB máximo

const DATASTORE_RESOURCES = {
  '2024': { prefeito: 'c5e1bff9-98f1-4d3b-b944-37cd22c84112', vereador: 'c5e1bff9-98f1-4d3b-b944-37cd22c84112' },
  '2022': { presidente: null, governador: null },
  '2020': { prefeito: null, vereador: null },
  '2018': { presidente: null },
  '2016': { prefeito: null },
  '2014': { presidente: null },
  '2012': { prefeito: null },
};

const CARGO_MAP = {
  prefeito: '11',
  vereador: '13',
  governador: '3',
  deputado_estadual: '7',
  deputado_federal: '6',
  senador: '5',
  presidente: '1',
};

const DATASTORE_URL = 'https://dadosabertos.tse.jus.br/api/3/action/datastore_search';

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

    return Response.json({ error: 'Ação inválida. Use: query, sync, sync_status' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// ============ CONSULTA LOCAL ============
async function handleLocalQuery(base44, body) {
  const { ano, uf, cargo, municipio, zona, secao, candidato } = body;
  if (!ano || !uf) return Response.json({ error: 'Parâmetros obrigatórios: ano, uf' }, { status: 400 });

  const syncStatus = await base44.asServiceRole.entities.TSESyncStatus.filter({
    ano: parseInt(ano),
    uf: uf.toUpperCase(),
    status: 'importado',
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
    query[/^\d+$/.test(candidato) ? 'numero_candidato' : 'nome_candidato'] = /^\d+$/.test(candidato) ? candidato : candidato.toUpperCase();
  }

  const results = await base44.asServiceRole.entities.TSEVoteResult.filter(query, '-votos', 200);
  return Response.json({ success: true, isSynced: true, data: results, total: results.length, syncInfo: syncStatus[0] });
}

// ============ SINCRONIZAÇÃO ============
async function handleSync(base44, body) {
  const { ano, uf } = body;
  if (!ano || !uf) return Response.json({ error: 'Parâmetros obrigatórios: ano, uf' }, { status: 400 });

  const year = parseInt(ano);
  const state = uf.toUpperCase();
  const yearStr = String(year);

  // Verificar status
  const existing = await base44.asServiceRole.entities.TSESyncStatus.filter({ ano: year, uf: state, tipo_dataset: 'votacao' });
  if (existing.length > 0 && existing[0].status === 'importando') {
    return Response.json({ success: false, message: 'Importação já em andamento.' });
  }

  // Marcar importando
  if (existing.length > 0) {
    await base44.asServiceRole.entities.TSESyncStatus.update(existing[0].id, { status: 'importando', mensagem_erro: '' });
  } else {
    await base44.asServiceRole.entities.TSESyncStatus.create({ ano: year, uf: state, tipo_dataset: 'votacao', status: 'importando', fonte_url: `https://dadosabertos.tse.jus.br/dataset/resultados-${year}` });
  }

  let totalImported = 0;
  let sourceUsed = 'unknown';

  try {
    // Etapa 1: Tentar via CKAN Datastore
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

    // Etapa 2: Fallback via CSV download por UF
    if (!dsSuccess) {
      const ufKey = `${yearStr}_${state}`;
      const csvUrl = PER_UF_CSV_URLS[ufKey];
      if (!csvUrl) throw new Error(`URL por UF não configurada para ${ufKey}.`);

      const count = await importFromCSV(base44, csvUrl, year, state);
      totalImported += count;
      sourceUsed = 'csv_per_uf';
    }

    // Atualizar status
    const statusRec = await base44.asServiceRole.entities.TSESyncStatus.filter({ ano: year, uf: state, tipo_dataset: 'votacao' });
    if (statusRec.length > 0) {
      await base44.asServiceRole.entities.TSESyncStatus.update(statusRec[0].id, {
        status: 'importado',
        total_linhas: totalImported,
        data_ultima_sincronizacao: new Date().toISOString(),
        mensagem_erro: '',
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

      // Indexar candidatos
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

// ============ ZIP PARSER MÍNIMO (sem dependências) ============
// Lê estrutura ZIP: Local File Headers + Central Directory
function findCSVInZip(buf) {
  const data = new Uint8Array(buf);
  // Procura assinatura do Central Directory (0x02014b50) de trás pra frente
  let cdOffset = -1;
  for (let i = data.length - 4; i >= 0; i--) {
    if (data[i] === 0x50 && data[i+1] === 0x4b && data[i+2] === 0x01 && data[i+3] === 0x02) {
      cdOffset = i;
      break;
    }
  }
  if (cdOffset === -1) throw new Error('ZIP inválido: Central Directory não encontrado.');

  // Lê o Central Directory para encontrar arquivos .csv
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

    const nameBytes = data.slice(pos + 46, pos + 46 + fileNameLen);
    const fileName = new TextDecoder().decode(nameBytes);

    if (fileName.endsWith('.csv')) {
      // Pula para o Local File Header
      const lhPos = localHeaderOff;
      const lhNameLen = view.getUint16(lhPos + 26, true);
      const lhExtraLen = view.getUint16(lhPos + 28, true);
      const dataStart = lhPos + 30 + lhNameLen + lhExtraLen;

      // Tamanho do arquivo comprimido
      const compSize = view.getUint32(pos + 20, true);
      const uncompSize = view.getUint32(pos + 24, true);

      const compressed = data.slice(dataStart, dataStart + compSize);

      if (compMethod === 0) {
        // Sem compressão
        files.push({ name: fileName, data: compressed, size: uncompSize, method: 'store' });
      } else if (compMethod === 8) {
        // Deflate
        files.push({ name: fileName, data: compressed, size: uncompSize, method: 'deflate' });
      }
    }

    pos += 46 + fileNameLen + extraLen + commentLen;
  }

  return files;
}

// Descompressão Deflate inline (implementação mínima via DecompressionStream)
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
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

// ============ IMPORTAÇÃO VIA CSV DOWNLOAD (parser ZIP inline) ============
async function importFromCSV(base44, zipUrl, year, state) {
  // Baixar ZIP
  const zipRes = await fetch(zipUrl, { signal: AbortSignal.timeout(120000) });
  if (!zipRes.ok) throw new Error(`Falha ao baixar TSE: HTTP ${zipRes.status}`);

  const zipBuffer = await zipRes.arrayBuffer();
  if (zipBuffer.byteLength > MAX_ZIP_BYTES) {
    throw new Error(`Arquivo muito grande (${(zipBuffer.byteLength/1024/1024).toFixed(0)}MB). Limite: 30MB.`);
  }

  // Extrair CSV do ZIP com parser inline
  const files = findCSVInZip(zipBuffer);
  if (files.length === 0) throw new Error('Nenhum CSV encontrado no ZIP.');

  const csvFile = files[0];
  let csvData;

  if (csvFile.method === 'deflate') {
    csvData = await inflateData(csvFile.data);
  } else {
    csvData = csvFile.data;
  }

  const csvText = new TextDecoder().decode(csvData);
  const lines = csvText.split('\n');
  if (lines.length < 2) throw new Error('CSV vazio.');

  // Parse header
  const header = parseCSVLine(lines[0]);
  const sgUfIdx = header.findIndex(h => h === 'SG_UF');
  if (sgUfIdx === -1) throw new Error('Coluna SG_UF não encontrada.');

  // Filtrar por UF e importar em lotes
  let batch = [];
  let total = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);
    if (values[sgUfIdx] !== state) continue;

    const record = buildRecordFromCSV(header, values, year, state);
    batch.push(record);

    if (batch.length >= 100) {
      await base44.asServiceRole.entities.TSEVoteResult.bulkCreate(batch);
      total += batch.length;
      batch = [];
    }
  }

  if (batch.length > 0) {
    await base44.asServiceRole.entities.TSEVoteResult.bulkCreate(batch);
    total += batch.length;
  }

  return total;
}

// ============ HELPERS ============
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

  // Suporta tanto Votação Nominal quanto Relatório de Totalização
  const cargoCd = get('CD_CARGO');
  const cargoName = get('DS_CARGO') ||
    Object.entries(CARGO_MAP).find(([_, v]) => v === cargoCd)?.[0] ||
    cargoCd;

  const numero = get('NR_VOTAVEL') || get('NR_CANDIDATO') || '';
  const nome = get('NM_VOTAVEL') || get('NM_CANDIDATO') || '';
  const votos = parseInt(get('QT_VOTOS')) || parseInt(get('QT_VOTOS_NOMINAIS')) || 0;
  const local = get('NM_LOCAL_VOTACAO') || '';

  return {
    ano: year,
    turno: parseInt(get('NR_TURNO')) || 1,
    uf: state,
    municipio: get('NM_MUNICIPIO') || get('NM_MUNICIPIO'),
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