// src/api/sofia.js — Sofia IA API (Base44 InvokeLLM)
import { base44 } from "@/api/base44Client";

export async function analyze(prompt, options = {}) {
  const { add_context_from_internet, response_json_schema, file_urls, model } = options;
  return await base44.integrations.Core.InvokeLLM({
    prompt,
    add_context_from_internet: add_context_from_internet || false,
    response_json_schema: response_json_schema || null,
    file_urls: file_urls || null,
    model: model || null,
  });
}

export async function analyzeTseData(tseData, ano, uf, cargo, candidato) {
  const prompt = `Você é Sofia, uma analista política especializada em inteligência eleitoral.
Analise os seguintes dados eleitorais do TSE e forneça insights estratégicos:

Ano: ${ano}
UF: ${uf}
Cargo: ${cargo}
Candidato: ${candidato || "Todos"}

Dados:
${JSON.stringify(tseData, null, 2)}

Forneça:
1. Análise de desempenho por região/zona
2. Áreas de força e fragilidade
3. Recomendações estratégicas de mobilização
4. Tendências observadas`;

  return await base44.integrations.Core.InvokeLLM({ prompt });
}

export async function getGamificationInsight(profile, recentActivity) {
  const prompt = `Você é Sofia, uma analista de gamificação política.
Analise o perfil de gamificação e atividades recentes de uma liderança:

Perfil:
${JSON.stringify(profile, null, 2)}

Atividades recentes:
${JSON.stringify(recentActivity, null, 2)}

Forneça:
1. Avaliação do desempenho atual
2. Sugestões para próximo nível
3. Reconhecimento de conquistas
4. Motivação personalizada`;

  return await base44.integrations.Core.InvokeLLM({ prompt });
}

export async function recommendMissions(leaderProfile, availableContacts, recentDemands) {
  const prompt = `Você é Sofia, uma analista política especializada em mobilização territorial.
Com base no perfil da liderança e dados territoriais, recomende missões estratégicas:

Perfil da Liderança:
${JSON.stringify(leaderProfile, null, 2)}

Contatos disponíveis:
${JSON.stringify(availableContacts?.slice(0, 50), null, 2)}

Demandas recentes:
${JSON.stringify(recentDemands?.slice(0, 20), null, 2)}

Recomende 3-5 missões específicas e acionáveis com:
- Tipo de missão
- Descrição clara
- Prioridade (alta/média/baixa)
- Justificativa estratégica`;

  return await base44.integrations.Core.InvokeLLM({ prompt });
}

export async function getHistory(params = {}) {
  return [];
}

export async function getProviders() {
  return [
    { id: "gemini_3_flash", name: "Gemini 3 Flash (com busca web)" },
    { id: "claude_sonnet_4_6", name: "Claude Sonnet 4.6" },
    { id: "gpt_5_mini", name: "GPT-5 Mini" },
  ];
}

export async function clearCache() {
  return { success: true };
}