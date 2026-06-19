import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, Loader2, Sparkles, MapPin, Users, Tag, AlertTriangle, Lightbulb } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function SofiaMissionRecommendation({ leaders, missions, profiles }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const leadersSummary = (leaders || []).slice(0, 30).map((l) =>
        `- ${l.name} | Bairro: ${l.neighborhood || "N/A"} | Segmento: ${l.segment || "N/A"} | Apoiadores: ${l.supporters_count || 0}`
      ).join("\n");

      const missionsSummary = (missions || []).slice(0, 30).map((m) =>
        `- ${m.title} | Status: ${m.status} | ${m.leader_name} | Bairro: ${m.neighborhood || "N/A"} | ${m.is_group_mission ? "Grupo" : "Individual"}`
      ).join("\n");

      const profilesSummary = (profiles || []).slice(0, 20).map((p) =>
        `- ${p.leader_name}: ${p.total_points}pts | ${p.missions_completed}/${(p.missions_completed||0)+(p.missions_pending||0)} concluídas | Nível: ${p.current_level}`
      ).join("\n");

      const prompt = `Você é Sofia, analista de inteligência política do app Esperançar. Analise os dados abaixo e forneça recomendações para distribuição de missões. Responda em português com no máximo 300 palavras.

LIDERANÇAS:
${leadersSummary}

MISSÕES ATUAIS:
${missionsSummary}

PERFIS (PONTUAÇÃO):
${profilesSummary}

Forneça:
1. Melhor GRUPO para receber nova missão (bairro ou segmento) e por quê
2. BAIRROS com baixa execução de missões
3. SEGMENTOS desmobilizados que precisam de ação
4. Lideranças SOBRECARREGADAS (muitas pendentes)
5. Lideranças INDICADAS para missão (alta performance)
6. Risco de não conclusão das missões atuais
7. Sugestão de REDISTRIBUIÇÃO se necessário`;

      const result = await base44.integrations.Core.InvokeLLM({ prompt, model: "claude_sonnet_4_6" });
      setAnalysis(result);
    } catch (e) {
      setAnalysis("Análise indisponível no momento.");
    }
    setLoading(false);
  };

  return (
    <Card className="border-slate-200 bg-gradient-to-br from-white to-indigo-50/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-indigo-600" />
          Sofia IA — Recomendações de Missões
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!analysis && !loading && (
          <div className="text-center py-8">
            <Brain className="w-12 h-12 text-indigo-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500 mb-4">
              A Sofia analisa seus dados e sugere os melhores grupos para receber missões, identifica lideranças sobrecarregadas e bairros com baixa mobilização.
            </p>
            <Button onClick={generate} className="bg-indigo-600 hover:bg-indigo-700">
              <Sparkles className="w-4 h-4 mr-2" />Gerar Recomendações
            </Button>
          </div>
        )}
        {loading && (
          <div className="flex items-center justify-center py-8 gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
            <span className="text-sm text-slate-500">Sofia está analisando padrões...</span>
          </div>
        )}
        {analysis && (
          <div>
            <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap mb-4">{analysis}</div>
            <div className="flex flex-wrap gap-2 mb-3">
              {["🏆 Melhor grupo", "📍 Bairros fracos", "🏷️ Segmentos parados", "⚠️ Sobrecarga", "⭐ Indicados"].map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
              ))}
            </div>
            <Button onClick={generate} variant="ghost" size="sm" className="text-indigo-600">
              <Sparkles className="w-3.5 h-3.5 mr-1" />Atualizar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}