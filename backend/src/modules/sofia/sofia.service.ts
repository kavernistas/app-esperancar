import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/common/prisma.service';
import { AuditService } from '../audit/audit.service';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  provider: string;
  model: string;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

export interface PromptHistoryEntry {
  id: string;
  userId: string;
  module: string;
  prompt: string;
  response: string;
  provider: string;
  model: string;
  duration: number;
  createdAt: Date;
}

@Injectable()
export class SofiaService {
  private readonly provider: string;
  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseUrl: string;

  // In-memory cache (use Redis in production)
  private readonly cache = new Map<string, { response: LLMResponse; expires: number }>();
  private readonly promptHistory: PromptHistoryEntry[] = [];

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
    private audit: AuditService,
  ) {
    this.provider = config.get('LLM_PROVIDER', 'openai');
    this.apiKey = config.get('LLM_API_KEY', '');
    this.model = config.get('LLM_MODEL', 'gpt-4o-mini');
    this.baseUrl = config.get('LLM_BASE_URL', '');
  }

  // ============ MAIN ANALYSIS ============

  async analyze(options: {
    prompt: string;
    context?: string;
    systemPrompt?: string;
    userId?: string;
    module?: string;
    useCache?: boolean;
    temperature?: number;
    maxTokens?: number;
  }): Promise<LLMResponse> {
    const { prompt, context, systemPrompt, userId, module = 'general', useCache = true, temperature = 0.7, maxTokens = 2000 } = options;

    if (!prompt) {
      throw new BadRequestException('Prompt e obrigatorio');
    }

    // Build messages
    const messages: LLMMessage[] = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    if (context) {
      messages.push({ role: 'user', content: `Contexto:\n${context}` });
    }
    messages.push({ role: 'user', content: prompt });

    // Check cache
    const cacheKey = this.buildCacheKey(messages);
    if (useCache) {
      const cached = this.cache.get(cacheKey);
      if (cached && cached.expires > Date.now()) {
        return { ...cached.response, provider: cached.response.provider + ' (cached)' };
      }
    }

    // Call provider
    const startTime = Date.now();
    let response: LLMResponse;

    try {
      switch (this.provider) {
        case 'openai':
        case 'openrouter':
        case 'nvidia':
          response = await this.callOpenAICompatible(messages, temperature, maxTokens);
          break;
        case 'ollama':
          response = await this.callOllama(messages, temperature, maxTokens);
          break;
        case 'hermes':
          response = await this.callHermes(messages, temperature, maxTokens);
          break;
        default:
          throw new BadRequestException(`Provider ${this.provider} nao suportado`);
      }
    } catch (error) {
      await this.audit.log({
        action: 'error',
        entity: 'SofiaAI',
        entity_label: this.provider,
        user_id: userId,
        module,
        severity: 'ERROR',
        metadata: { error: error.message, prompt: prompt.substring(0, 200) },
      });
      throw error;
    }

    const duration = Date.now() - startTime;

    // Cache response (1 hour)
    if (useCache) {
      this.cache.set(cacheKey, {
        response,
        expires: Date.now() + 3600000,
      });
    }

    // Log to history
    const historyEntry: PromptHistoryEntry = {
      id: `sofia_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      userId: userId || 'anonymous',
      module,
      prompt: prompt.substring(0, 500),
      response: response.content.substring(0, 500),
      provider: response.provider,
      model: response.model,
      duration,
      createdAt: new Date(),
    };
    this.promptHistory.push(historyEntry);

    // Keep only last 1000 entries in memory
    if (this.promptHistory.length > 1000) {
      this.promptHistory.splice(0, this.promptHistory.length - 1000);
    }

    await this.audit.log({
      action: 'analyze',
      entity: 'SofiaAI',
      entity_label: `${this.provider}/${this.model}`,
      user_id: userId,
      module,
      metadata: { duration, tokens: response.usage?.total_tokens },
    });

    return response;
  }

  // ============ TSE ANALYSIS ============

  async analyzeTseData(options: {
    tseData: any[];
    ano: number;
    uf: string;
    cargo: string;
    candidato?: string;
    userId?: string;
  }): Promise<LLMResponse> {
    const { tseData, ano, uf, cargo, candidato, userId } = options;

    if (!tseData || tseData.length === 0) {
      throw new BadRequestException('Nenhum dado para analisar');
    }

    const totalVotes = tseData.reduce((s, c) => s + (c.votos || c.qt_votos_nominais || 0), 0);
    const sorted = [...tseData].sort((a, b) => (b.votos || b.qt_votos_nominais || 0) - (a.votos || a.qt_votos_nominais || 0));
    const topCandidate = sorted[0];
    const top5 = sorted.slice(0, 5);

    const candidateData = candidato
      ? tseData.filter(c =>
          (c.nome_candidato || c.nm_candidato || '').toLowerCase().includes(candidato.toLowerCase()) ||
          (c.numero_candidato || c.nr_candidato) === candidato
        )
      : [];

    const systemPrompt = `Voce e Sofia, uma analista de inteligencia politica especializada em dados eleitorais brasileiros. Analise os dados do TSE e forneca insights estrategicos em portugues brasileiro. Seja concisa, objetiva e focada em acoes praticas.`;

    const prompt = `Analise os seguintes dados eleitorais:

DADOS DA CONSULTA:
- Ano: ${ano}
- Estado (UF): ${uf}
- Cargo: ${cargo}
- Candidato buscado: ${candidato || 'Todos'}
- Total de votos computados: ${totalVotes.toLocaleString('pt-BR')}
- Total de candidatos: ${tseData.length}

CANDIDATO MAIS VOTADO:
- Nome: ${topCandidate?.nome_candidato || topCandidate?.nm_candidato || 'N/A'}
- Partido: ${topCandidate?.partido || topCandidate?.sg_partido || 'N/A'}
- Votos: ${(topCandidate?.votos || topCandidate?.qt_votos_nominais || 0).toLocaleString('pt-BR')}

TOP 5 CANDIDATOS:
${top5.map((c, i) => `${i + 1}. ${c.nome_candidato || c.nm_candidato || 'N/A'} (${c.partido || c.sg_partido || 'N/A'}): ${(c.votos || c.qt_votos_nominais || 0).toLocaleString('pt-BR')} votos`).join('\n')}

${candidateData.length > 0 ? `
DADOS DO CANDIDATO BUSCADO (${candidato}):
${candidateData.slice(0, 10).map(c => `- ${c.municipio || c.nm_municipio || 'Geral'} | Zona ${c.zona || c.nr_zona || '-'}: ${(c.votos || c.qt_votos_nominais || 0).toLocaleString('pt-BR')} votos`).join('\n')}
` : ''}

Forneca:
1. Resumo executivo (2-3 frases)
2. Analise de desempenho
3. Insights estrategicos
4. Recomendacoes de acao`;

    return this.analyze({
      prompt,
      systemPrompt,
      userId,
      module: 'tse',
      useCache: true,
      temperature: 0.5,
      maxTokens: 3000,
    });
  }

  // ============ GAMIFICATION INSIGHTS ============

  async getGamificationInsight(options: {
    profile: any;
    recentActivity?: any[];
    userId?: string;
  }): Promise<LLMResponse> {
    const { profile, recentActivity, userId } = options;

    const systemPrompt = `Voce e Sofia, especialista em gamificacao e engajamento de liderancas politicas. Analise o perfil e forneca recomendacoes personalizadas em portugues brasileiro.`;

    const prompt = `Analise o seguinte perfil de gamificacao:

PERFIL:
- Nome: ${profile.leader_name || 'N/A'}
- Nivel atual: ${profile.current_level || 'semente'}
- Pontos totais: ${profile.total_points || 0}
- Missoes completadas: ${profile.missions_completed || 0}
- Missoes pendentes: ${profile.missions_pending || 0}
- Apoiadores cadastrados: ${profile.supporters_registered || 0}
- Liderancas convertidas: ${profile.leaders_converted || 0}
- Pontos semanais: ${profile.weekly_points || 0}
- Pontos mensais: ${profile.monthly_points || 0}

Forneca:
1. Analise do nivel atual e progresso
2. 3 recomendacoes de missoes prioritarias
3. Dicas para proximo nivel
4. Reconhecimento de conquistas`;

    return this.analyze({
      prompt,
      systemPrompt,
      userId,
      module: 'gamification',
      useCache: false,
      temperature: 0.7,
      maxTokens: 2000,
    });
  }

  // ============ MISSION RECOMMENDATIONS ============

  async recommendMissions(options: {
    leaderProfile: any;
    availableContacts?: any[];
    recentDemands?: any[];
    userId?: string;
  }): Promise<LLMResponse> {
    const { leaderProfile, availableContacts, recentDemands, userId } = options;

    const systemPrompt = `Voce e Sofia, estrategista de campanhas politicas. Recomende missoes especificas e acionaveis com base no perfil da lideranca e contexto local. Responda em portugues brasileiro.`;

    const prompt = `Recomende 5 missoes prioritarias para a seguinte lideranca:

LIDERANCA:
- Nome: ${leaderProfile.name || 'N/A'}
- Bairro: ${leaderProfile.neighborhood || 'N/A'}
- Cidade: ${leaderProfile.city || 'N/A'}
- Forca politica: ${leaderProfile.political_strength || 'media'}
- Apoiadores: ${leaderProfile.supporters_count || 0}
- Meta mensal: ${leaderProfile.monthly_goal || 0}

${availableContacts ? `CONTATOS DISPONIVEIS: ${availableContacts.length} contatos na base` : ''}
${recentDemands ? `DEMANDAS RECENTES: ${recentDemands.length} demandas abertas` : ''}

Para cada missao, fornecca:
- Titulo
- Tipo (register_supporters, visit_region, mobilize_meeting, collect_demands, etc)
- Prioridade (low, medium, high, urgent)
- Pontos sugeridos
- Justificativa breve`;

    return this.analyze({
      prompt,
      systemPrompt,
      userId,
      module: 'missions',
      useCache: false,
      temperature: 0.8,
      maxTokens: 2500,
    });
  }

  // ============ PROVIDER CALLS ============

  private async callOpenAICompatible(messages: LLMMessage[], temperature: number, maxTokens: number): Promise<LLMResponse> {
    const url = this.baseUrl || 'https://api.openai.com/v1';
    const response = await fetch(`${url}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new BadRequestException(`Erro na API ${this.provider}: ${error}`);
    }

    const data = await response.json();
    return {
      content: data.choices[0]?.message?.content || '',
      provider: this.provider,
      model: data.model || this.model,
      usage: data.usage,
    };
  }

  private async callOllama(messages: LLMMessage[], temperature: number, maxTokens: number): Promise<LLMResponse> {
    const url = this.baseUrl || 'http://localhost:11434';
    const response = await fetch(`${url}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model || 'llama3',
        messages,
        stream: false,
        options: { temperature, num_predict: maxTokens },
      }),
    });

    if (!response.ok) {
      throw new BadRequestException(`Erro na API Ollama: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.message?.content || '',
      provider: 'ollama',
      model: this.model || 'llama3',
    };
  }

  private async callHermes(messages: LLMMessage[], temperature: number, maxTokens: number): Promise<LLMResponse> {
    // Hermes uses OpenAI-compatible API
    const url = this.baseUrl || 'http://localhost:1234/v1';
    return this.callOpenAICompatible(messages, temperature, maxTokens);
  }

  // ============ HISTORY & CACHE ============

  async getHistory(query: { userId?: string; module?: string; page?: number; limit?: number }) {
    const { userId, module, page = 1, limit = 50 } = query;
    let filtered = this.promptHistory;

    if (userId) filtered = filtered.filter(h => h.userId === userId);
    if (module) filtered = filtered.filter(h => h.module === module);

    const total = filtered.length;
    const start = (page - 1) * limit;
    const data = filtered.reverse().slice(start, start + limit);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  clearCache() {
    this.cache.clear();
    return { cleared: true };
  }

  getProviders() {
    return {
      current: this.provider,
      model: this.model,
      available: ['openai', 'ollama', 'openrouter', 'nvidia', 'hermes'],
    };
  }

  // ============ HELPERS ============

  private buildCacheKey(messages: LLMMessage[]): string {
    const content = messages.map(m => `${m.role}:${m.content}`).join('|');
    // Simple hash
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `sofia_${hash}`;
  }
}
