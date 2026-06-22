import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Loader2, Sparkles } from "lucide-react";
import * as sofiaApi from '@/api/sofia';

export default function SofiaGamificationInsight({ missions, leaders, profiles }) {
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateInsight = async () => {
    setLoading(true);
    try {
      const missionsData = (missions || []).slice(0, 50);
      const leadersData = (leaders || []).slice(0, 30);
      const profilesData = (profiles || []).slice(0, 30);

      const prompt = `Você é Sofia, analista de engajamento político do app Esperançar. Analise os dados de gamificação abaixo e forneça insights em português (máx 250 palavras).

PERFIS DAS LIDERANÇAS:
${profilesData.map(p => `- ${p.leader_name}: ${p.total_points} pts | ${p.missions_completed} missões concluídas | ${p.missions_pending || 0} pendentes | Nível: ${p.current_level} | Bairro: ${p.neighborhood || 'N/A'}`).join('\n')}

MISSÕES RECENTES:
${missionsData.map(m => `- ${m.title} | Status: ${m.status} | ${m.leader_name} | ${m.neighborhood || ''} | Prazo: ${m.deadline || 'Sem prazo'}`).join('\n')}

Com base nesses dados:
1. Identifique as 3 lideranças MAIS ATIVAS
2. Identifique lideranças PARADAS (sem atividade recente)
3. Sugira quem deve receber nova missão e por quê
4. Identifique regiões/baixos com baixa mobilização
5. Alerte sobre riscos de desmobilização
6. Recomende um plano de ação semanal com até 3 tarefas`;

      const result = await sofiaApi.analyze({ prompt, model: "claude_sonnet_4_6" });
      setInsight(result);
    } catch (e) {
      setInsight("Não foi possível gerar a análise no momento.");
    }
    setLoading(false);
  };

  return (
    <Card className="border-slate-200 bg-gradient-to-br from-white to-purple-50/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-600" />
          Sofia IA — Análise de Engajamento
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!insight && !loading && (
          <div className="text-center py-6">
            <Sparkles className="w-10 h-10 text-purple-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500 mb-3">
              A Sofia pode analisar suas lideranças e sugerir ações estratégicas para aumentar o engajamento.
            </p>
            <Button onClick={generateInsight} variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-50">
              <Brain className="w-4 h-4 mr-2" />
              Gerar Análise
            </Button>
          </div>
        )}
        {loading && (
          <div className="flex items-center justify-center py-8 gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
            <span className="text-sm text-slate-500">Sofia está analisando os dados...</span>
          </div>
        )}
        {insight && (
          <div>
            <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap mb-3">
              {insight}
            </div>
            <Button onClick={generateInsight} variant="ghost" size="sm" className="text-purple-600 hover:text-purple-700">
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              Atualizar análise
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}