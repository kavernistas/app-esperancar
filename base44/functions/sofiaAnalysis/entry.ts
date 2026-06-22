import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!['admin', 'coordenador'].includes(user.role)) {
      return Response.json({ error: 'Acesso restrito a admin e coordenador' }, { status: 403 });
    }

    const { tseData, ano, uf, cargo, candidato } = await req.json();

    if (!tseData || tseData.length === 0) {
      return Response.json({ error: 'Nenhum dado para analisar' }, { status: 400 });
    }

    // Prepare data summary for Sofia
    const totalVotes = tseData.reduce((s, c) => s + (c.qt_votos_nominais || 0), 0);
    const topCandidate = tseData.sort((a, b) => (b.qt_votos_nominais || 0) - (a.qt_votos_nominais || 0))[0];
    const candidateData = candidato
      ? tseData.filter(c => c.nm_candidato?.toLowerCase().includes(candidato.toLowerCase()) || c.nr_candidato === candidato)
      : [];

    const prompt = `Você é Sofia, uma analista de inteligência política especializada em dados eleitorais brasileiros. Analise os seguintes dados do TSE e forneça insights estratégicos em português.

DADOS DA CONSULTA:
- Ano: ${ano}
- Estado (UF): ${uf}
- Cargo: ${cargo}
- Candidato buscado: ${candidato || 'Todos'}
- Total de votos computados: ${totalVotes.toLocaleString('pt-BR')}
- Total de candidatos: ${tseData.length}

CANDIDATO MAIS VOTADO:
- Nome: ${topCandidate?.nm_candidato}
- Partido: ${topCandidate?.sg_partido}
- Votos: ${topCandidate?.qt_votos_nominais?.toLocaleString('pt-BR')}

TOP 5 CANDIDATOS:
${tseData.slice(0, 5).map((c, i) => `${i + 1}. ${c.nm_candidato} (${c.sg_partido}): ${(c.qt_votos_nominais || 0).toLocaleString('pt-BR')} votos`).join('\n')}

${candidateData.length > 0 ? `
DADOS DO CANDIDATO BUSCADO (${candidato}):
${candidateData.map(c => `- ${c.nm_municipio || 'Geral'} | Zona ${c.nr_zona || '-'}: ${(c.qt_votos_nominais || 0).toLocaleString('pt-BR')} votos`).join('\n')}
` : ''}

Com base nesses dados, forneça:
1. Um parágrafo de RESUMO EXECUTIVO (máx 3 frases) do cenário eleitoral
2. Identifique os REDUTOS ELEITORAIS (zonas/municípios com concentração de votos acima da média)
3. Identifique ZONAS DE RISCO ou oportunidades de crescimento
4. Uma RECOMENDAÇÃO ESTRATÉGICA prática para campanha futura

Seja direto, analítico e use linguagem política profissional. Limite sua resposta a 300 palavras.`;

    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt,
      model: 'claude_sonnet_4_6',
    });

    // Parse the analysis into sections
    return Response.json({
      success: true,
      analysis,
      summary: {
        totalVotes,
        topCandidate: topCandidate?.nm_candidato,
        topVotes: topCandidate?.qt_votos_nominais,
        candidatesCount: tseData.length,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});