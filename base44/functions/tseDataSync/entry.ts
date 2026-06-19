import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Função enxuta — apenas consulta local e verificação de status.
// NENHUM download, descompressão ou parsing de CSV/ZIP.
// O processamento pesado (ETL) fica em serviço externo (esperancar-tse-etl),
// que envia dados normalizados via receiveTSEBatch.

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
const CARGO_MAP_CD = {
  '1': 'presidente', '3': 'governador', '5': 'senador',
  '6': 'deputado_federal', '7': 'deputado_estadual',
  '11': 'prefeito', '13': 'vereador',
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action } = body;

    if (action === 'query') return handleLocalQuery(base44, body);
    if (action === 'status') return handleStatusCheck(base44, body);
    if (action === 'resolve_source') return handleResolveSource(base44, body);
    if (action === 'dedup') return handleDedup(base44, body);

    return Response.json({ error: 'Ação inválida. Use: query, status, resolve_source, dedup' }, { status: 400 });
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
    const field = /^\d+$/.test(candidato) ? 'numero_candidato' : 'nome_candidato';
    query[field] = /^\d+$/.test(candidato) ? candidato : candidato.toUpperCase();
  }

  const results = await base44.asServiceRole.entities.TSEVoteResult.filter(query, '-votos', limit);

  return Response.json({
    success: true, isSynced: true, data: results, total: results.length,
    syncInfo: syncStatus[0],
    message: `Base oficial TSE sincronizada localmente para ${state}/${year}.`,
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

// ============ RESOLVE SOURCE (URL CDN) ============
// Útil para o serviço externo de ETL saber de onde baixar os dados.
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

  // Verificar cache
  const cached = await base44.asServiceRole.entities.TSEDataSourceMap.filter({ ano: year, uf: state, dataset_tipo });
  if (cached.length > 0) {
    return Response.json({
      success: true,
      fonte: cached[0],
      cdn_url: url,
      nacional: isNacional,
    });
  }

  // HEAD request para verificar disponibilidade
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
    ? 'Dataset nacional — arquivo único com todos os estados. O ETL externo fará o particionamento.'
    : (status === 'indisponivel' ? 'URL não encontrada no CDN do TSE.' : null);

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

// ============ DEDUP ============
async function handleDedup(base44, body) {
  const { ano, uf } = body;
  if (!ano || !uf) return Response.json({ error: 'Parâmetros obrigatórios: ano, uf' }, { status: 400 });

  const year = parseInt(ano);
  const state = uf.toUpperCase();

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