import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['admin', 'coordenador'].includes(user.role)) {
      return Response.json({ error: 'Acesso restrito a admin e coordenador' }, { status: 403 });
    }

    const body = await req.json();
    const { ano, uf, cargo, candidato, municipio, zona, secao, page = 0 } = body;

    if (!ano || !uf || !cargo) {
      return Response.json({ error: 'Parâmetros obrigatórios: ano, uf, cargo' }, { status: 400 });
    }

    const year = parseInt(ano);
    const state = uf.toUpperCase();

    // Verificar se há base sincronizada
    const syncStatus = await base44.asServiceRole.entities.TSESyncStatus.filter({
      ano: year, uf: state, status: 'importado',
    }, '', 5);

    if (syncStatus.length === 0) {
      return Response.json({
        success: true,
        isSynced: false,
        data: [],
        total: 0,
        message: `Dados oficiais ainda não importados para ${state}/${year}.`,
      });
    }

    // Construir query local
    const query = { ano: year, uf: state, cargo };
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

    const limit = 200;
    const results = await base44.asServiceRole.entities.TSEVoteResult.filter(query, '-votos', limit);

    return Response.json({
      success: true,
      data: results,
      total: results.length,
      page,
      ano,
      uf,
      cargo,
      isSynced: true,
      message: null,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});