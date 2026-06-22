import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Endpoint chamado pelo serviço externo de ETL (esperancar-tse-etl)
// Recebe lotes de registros já normalizados e os insere no Base44.
// NUNCA faz download, descompressão ou parsing de CSV/ZIP.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Validação por segredo compartilhado (não exige autenticação de usuário)
    const SECRET = Deno.env.get('TSE_ETL_SHARED_SECRET');
    const authHeader = req.headers.get('Authorization') || '';
    const expectedAuth = `Bearer ${SECRET}`;
    if (!SECRET || authHeader !== expectedAuth) {
      return Response.json({ error: 'Unauthorized — shared secret mismatch' }, { status: 401 });
    }

    const body = await req.json();
    const { ano, uf, dataset_tipo, records, final_batch, source_url, total_registros } = body;

    if (!ano || !uf || !records || !Array.isArray(records)) {
      return Response.json({ error: 'Campos obrigatórios: ano, uf, records (array)' }, { status: 400 });
    }
    if (records.length === 0) {
      return Response.json({ success: true, imported: 0, message: 'Lote vazio — nada a importar.' });
    }

    const year = parseInt(ano);
    const state = uf.toUpperCase();
    const dsTipo = dataset_tipo || 'votacao_secao';

    // Normalizar registros para o schema TSEVoteResult
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

    // Inserir em lotes de 1000
    const BATCH_SIZE = 1000;
    let imported = 0;
    let errors = 0;

    for (let i = 0; i < normalized.length; i += BATCH_SIZE) {
      const batch = normalized.slice(i, i + BATCH_SIZE);
      try {
        await base44.asServiceRole.entities.TSEVoteResult.bulkCreate(batch);
        imported += batch.length;
      } catch (e) {
        errors += batch.length;
        console.error('[receiveTSEBatch] Erro no bulkCreate:', e.message);
      }
    }

    // Atualizar TSESyncStatus
    if (final_batch) {
      const count = total_registros || imported;
      await upsertSyncStatus(base44, year, state, 'importado', count, '');
    } else {
      await upsertSyncStatus(base44, year, state, 'importando', 0, '');
    }

    // Atualizar TSEDataSourceMap se source_url informado
    if (source_url && final_batch) {
      const cached = await base44.asServiceRole.entities.TSEDataSourceMap.filter({ ano: year, uf: state, dataset_tipo: dsTipo });
      if (cached.length > 0) {
        await base44.asServiceRole.entities.TSEDataSourceMap.update(cached[0].id, {
          fonte_url: source_url, status: 'disponivel',
        });
      }
    }

    return Response.json({
      success: true,
      imported,
      errors,
      total_received: normalized.length,
      final_batch: final_batch || false,
      message: final_batch
        ? `Importação concluída: ${imported} registros (${errors} erros).`
        : `Lote recebido: ${imported} registros (${errors} erros).`,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function upsertSyncStatus(base44, year, state, status, totalLinhas, mensagemErro) {
  const recs = await base44.asServiceRole.entities.TSESyncStatus.filter({
    ano: year, uf: state, tipo_dataset: 'votacao',
  });
  const data = { status, mensagem_erro: mensagemErro || '' };
  if (status === 'importado') {
    data.total_linhas = totalLinhas || 0;
    data.data_ultima_sincronizacao = new Date().toISOString();
  }
  if (recs.length > 0) {
    await base44.asServiceRole.entities.TSESyncStatus.update(recs[0].id, data);
  }
}