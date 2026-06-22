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
    const { ano, uf, cargo, municipio, zona, secao, candidato, page = 0, limit = 100 } = body;

    if (!ano || !uf) {
      return Response.json({ error: 'Parâmetros obrigatórios: ano, uf' }, { status: 400 });
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
        resumo: null,
        message: `Dados oficiais ainda não importados para ${state}/${year}.`,
      });
    }

    // Construir query
    const query = { ano: year, uf: state };
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

    // Consultar dados
    const results = await base44.asServiceRole.entities.TSEVoteResult.filter(query, '-votos', limit);

    // Gerar resumo agregado
    const resumo = gerarResumo(results, year, state, cargo);

    return Response.json({
      success: true,
      isSynced: true,
      data: results,
      total: results.length,
      resumo,
      page,
      syncInfo: syncStatus[0],
      message: `Base oficial TSE sincronizada localmente para ${state}/${year}.`,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function gerarResumo(results, year, state, cargo) {
  if (!results || results.length === 0) return null;

  // Agrupar por candidato para ranking
  const porCandidato = {};
  const municipios = new Set();
  let totalVotos = 0;

  for (const r of results) {
    const chave = `${r.nome_candidato || 'NÃO INFORMADO'}|${r.numero_candidato || ''}|${r.partido || ''}`;
    if (!porCandidato[chave]) {
      porCandidato[chave] = { nome: r.nome_candidato, numero: r.numero_candidato, partido: r.partido, votos: 0 };
    }
    porCandidato[chave].votos += r.votos || 0;
    totalVotos += r.votos || 0;
    if (r.municipio) municipios.add(r.municipio);
  }

  const ranking = Object.values(porCandidato)
    .sort((a, b) => b.votos - a.votos)
    .slice(0, 20)
    .map((c, i) => ({ ...c, posicao: i + 1 }));

  return {
    ano: year,
    uf: state,
    cargo: cargo || 'Todos',
    total_registros: results.length,
    total_votos: totalVotos,
    total_municipios: municipios.size,
    ranking,
  };
}