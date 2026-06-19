import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// TSE Dados Abertos — CKAN resource IDs do portal https://dadosabertos.tse.jus.br
// Os IDs abaixo são reais. Atualize no portal conforme necessidade.
const TSE_RESOURCES = {
  '2024': {
    prefeito: 'c5e1bff9-98f1-4d3b-b944-37cd22c84112',  // Votação nominal por município e zona
    vereador: 'c5e1bff9-98f1-4d3b-b944-37cd22c84112',
  },
  '2022': {
    presidente: null,  // IDs precisam ser obtidos no portal TSE
    governador: null,
  },
  '2020': { prefeito: null, vereador: null },
  '2018': { presidente: null },
  '2016': { prefeito: null },
  '2014': { presidente: null },
  '2012': { prefeito: null },
};

const CARGO_MAP = {
  prefeito: 11,
  vereador: 13,
  governador: 3,
  deputado_estadual: 7,
  deputado_federal: 6,
  senador: 5,
  presidente: 1,
};

const BASE_URL = 'https://dadosabertos.tse.jus.br/api/3/action/datastore_search';

async function fetchTSEPage(resourceId, filters, offset = 0) {
  const params = new URLSearchParams({
    resource_id: resourceId,
    limit: '200',
    offset: String(offset),
    filters: JSON.stringify(filters),
  });
  const res = await fetch(`${BASE_URL}?${params}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`TSE HTTP ${res.status}`);
  return await res.json();
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action } = body;

    if (action === 'query') {
      return handleLocalQuery(base44, body);
    } else if (action === 'sync') {
      return handleSync(base44, body);
    } else if (action === 'sync_status') {
      return handleStatusCheck(base44, body);
    }

    return Response.json({ error: 'Ação inválida. Use: query, sync, sync_status' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// ============ CONSULTA LOCAL ============
async function handleLocalQuery(base44, body) {
  const { ano, uf, cargo, municipio, zona, secao, candidato } = body;
  if (!ano || !uf) return Response.json({ error: 'Parâmetros obrigatórios: ano, uf' }, { status: 400 });

  // Check if data is synced
  const syncStatus = await base44.asServiceRole.entities.TSESyncStatus.filter({
    ano: parseInt(ano),
    uf: uf.toUpperCase(),
    status: 'importado',
  }, '', 5);

  const isSynced = syncStatus.length > 0;

  if (!isSynced) {
    return Response.json({
      success: true,
      isSynced: false,
      data: [],
      total: 0,
      message: 'Base não sincronizada. Importe os dados primeiro.',
    });
  }

  // Query local database
  const query = { ano: parseInt(ano), uf: uf.toUpperCase() };
  if (cargo) query.cargo = cargo;
  if (municipio) query.municipio = municipio;
  if (zona) query.zona = zona;
  if (secao) query.secao = secao;
  if (candidato) {
    if (/^\d+$/.test(candidato)) {
      query.numero_candidato = candidato;
    } else {
      query.nome_candidato = candidato.toUpperCase();
    }
  }

  const results = await base44.asServiceRole.entities.TSEVoteResult.filter(query, '-votos', 200);

  return Response.json({
    success: true,
    isSynced: true,
    data: results,
    total: results.length,
    syncInfo: syncStatus[0],
  });
}

// ============ SINCRONIZAÇÃO ============
async function handleSync(base44, body) {
  const { ano, uf } = body;
  if (!ano || !uf) return Response.json({ error: 'Parâmetros obrigatórios: ano, uf' }, { status: 400 });

  const year = parseInt(ano);
  const state = uf.toUpperCase();

  // Check current status
  const existing = await base44.asServiceRole.entities.TSESyncStatus.filter({
    ano: year,
    uf: state,
    tipo_dataset: 'votacao',
  });

  if (existing.length > 0 && existing[0].status === 'importando') {
    return Response.json({ success: false, message: 'Importação já em andamento para este ano/UF.' });
  }

  // Mark as importing
  if (existing.length > 0) {
    await base44.asServiceRole.entities.TSESyncStatus.update(existing[0].id, {
      status: 'importando',
      mensagem_erro: '',
    });
  } else {
    await base44.asServiceRole.entities.TSESyncStatus.create({
      ano: year,
      uf: state,
      tipo_dataset: 'votacao',
      status: 'importando',
      fonte_url: `https://dadosabertos.tse.jus.br/dataset/resultados-${year}`,
    });
  }

  try {
    const resourceMap = TSE_RESOURCES[String(year)] || {};
    const cargos = Object.keys(resourceMap).filter(k => resourceMap[k]);
    let totalImported = 0;

    for (const cargo of cargos) {
      const resourceId = resourceMap[cargo];
      if (!resourceId) continue;

      const filters = { sg_uf: state, cd_cargo: CARGO_MAP[cargo] };
      let offset = 0;
      let hasMore = true;

      while (hasMore) {
        const page = await fetchTSEPage(resourceId, filters, offset);
        const records = page?.result?.records || [];

        if (records.length === 0) { hasMore = false; break; }

        // Map records to TSEVoteResult format
        const mapped = records.map(r => ({
          ano: year,
          turno: 1,
          uf: state,
          municipio: r.nm_municipio || '',
          zona: String(r.nr_zona || ''),
          secao: String(r.nr_secao || ''),
          cargo: cargo,
          numero_candidato: String(r.nr_candidato || ''),
          nome_candidato: r.nm_candidato || '',
          partido: r.nm_partido || r.sg_partido || '',
          votos: parseInt(r.qt_votos_nominais) || 0,
          local_votacao: r.nm_local_votacao || '',
        }));

        if (mapped.length > 0) {
          await base44.asServiceRole.entities.TSEVoteResult.bulkCreate(mapped);
          totalImported += mapped.length;
        }

        // Also index candidates
        const candidates = [...new Map(mapped.map(m => [m.numero_candidato, m])).values()]
          .map(c => ({
            ano: year,
            uf: state,
            municipio: c.municipio,
            cargo: c.cargo,
            numero: c.numero_candidato,
            nome: c.nome_candidato,
            partido: c.partido,
            situacao: 'concorrendo',
            tse_resource_id: resourceId,
          }));

        if (candidates.length > 0) {
          await base44.asServiceRole.entities.TSECandidate.bulkCreate(candidates);
        }

        offset += records.length;
        if (records.length < 200) hasMore = false;
      }
    }

    // Update sync status
    const statusRecord = await base44.asServiceRole.entities.TSESyncStatus.filter({
      ano: year,
      uf: state,
      tipo_dataset: 'votacao',
    });
    if (statusRecord.length > 0) {
      await base44.asServiceRole.entities.TSESyncStatus.update(statusRecord[0].id, {
        status: 'importado',
        total_linhas: totalImported,
        data_ultima_sincronizacao: new Date().toISOString(),
      });
    }

    return Response.json({
      success: true,
      total_importado: totalImported,
      uf: state,
      ano: year,
    });
  } catch (error) {
    // Mark as error
    const statusRecord = await base44.asServiceRole.entities.TSESyncStatus.filter({
      ano: year,
      uf: state,
      tipo_dataset: 'votacao',
    });
    if (statusRecord.length > 0) {
      await base44.asServiceRole.entities.TSESyncStatus.update(statusRecord[0].id, {
        status: 'erro',
        mensagem_erro: error.message,
      });
    }
    return Response.json({ success: false, error: error.message });
  }
}

// ============ STATUS CHECK ============
async function handleStatusCheck(base44, body) {
  const { ano, uf } = body;

  let query = {};
  if (ano) query.ano = parseInt(ano);
  if (uf) query.uf = uf.toUpperCase();

  const statuses = await base44.asServiceRole.entities.TSESyncStatus.filter(query, '-data_ultima_sincronizacao', 50);

  return Response.json({
    success: true,
    statuses,
  });
}