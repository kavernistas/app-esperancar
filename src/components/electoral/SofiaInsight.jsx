import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Brain, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function SofiaInsight({ tseData, filters, isSynced }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    setAnalysis(null);
    const response = await base44.functions.invoke("sofiaAnalysis", {
      tseData: tseData.slice(0, 50),
      ano: filters.ano,
      uf: filters.uf,
      cargo: filters.cargo,
      candidato: filters.candidato,
    });
    setLoading(false);
    if (response.data?.analysis) {
      setAnalysis(response.data.analysis);
      setExpanded(true);
    }
  };

  return (
    <Card className="border-0 shadow-sm bg-gradient-to-br from-slate-900 to-blue-950 text-white overflow-hidden relative">
      {/* Decorative glow */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <CardHeader className="pb-3 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center shadow-lg">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-white flex items-center gap-2 text-lg">
                Sofia IA
                <Badge className="bg-blue-500/30 text-blue-200 border-blue-400/30 text-xs">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Inteligência Estratégica
                </Badge>
              </CardTitle>
              <p className="text-slate-400 text-xs mt-0.5">
                Análise automática dos dados do TSE
              </p>
            </div>
          </div>

          {analysis && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="text-slate-300 hover:text-white hover:bg-white/10"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="relative">
{!analysis && !loading && isSynced === false && (
          <div className="flex items-center gap-3">
            <Brain className="w-5 h-5 text-slate-400" />
            <p className="text-slate-400 text-sm">
              Sofia não encontrou dados oficiais sincronizados para esta consulta.
            </p>
          </div>
        )}

        {!analysis && !loading && isSynced !== false && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <p className="text-slate-300 text-sm flex-1">
              Após consultar os dados, peça à Sofia para identificar <strong className="text-white">redutos eleitorais</strong>, 
              <strong className="text-white"> zonas de risco</strong> e gerar recomendações estratégicas com base nos números do TSE.
            </p>
            <Button
              onClick={handleAnalyze}
              disabled={!tseData || tseData.length === 0}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 shadow-lg whitespace-nowrap flex-shrink-0"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Gerar Relatório de Insight
            </Button>
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-3 py-4">
            <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
            <div>
              <p className="text-white font-medium text-sm">Sofia está analisando os dados...</p>
              <p className="text-slate-400 text-xs mt-0.5">Identificando padrões eleitorais e oportunidades estratégicas</p>
            </div>
          </div>
        )}

        {analysis && expanded && (
          <div className="mt-2">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-blue-300 font-semibold uppercase tracking-wide mb-2">
                    Análise da Sofia
                  </p>
                  <p className="text-slate-100 text-sm leading-relaxed whitespace-pre-wrap">
                    {analysis}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-3">
              <Button
                onClick={handleAnalyze}
                variant="ghost"
                size="sm"
                className="text-slate-400 hover:text-white hover:bg-white/10 text-xs"
              >
                <Sparkles className="w-3 h-3 mr-1" />
                Nova análise
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}