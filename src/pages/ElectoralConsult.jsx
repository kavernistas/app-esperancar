import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Database, Wifi, WifiOff, BarChart3, TrendingUp, Users, Heart, Trophy } from "lucide-react";

import SearchFilters from "@/components/electoral/SearchFilters";
import SummaryStats from "@/components/electoral/SummaryStats";
import ResultsTable from "@/components/electoral/ResultsTable";
import ResultsCharts from "@/components/electoral/ResultsCharts";
import SofiaInsight from "@/components/electoral/SofiaInsight";
import HistoricalEvolution from "@/components/electoral/HistoricalEvolution";
import FidelityIndicator from "@/components/electoral/FidelityIndicator";
import ElectorateProfile from "@/components/electoral/ElectorateProfile";
import ExportActions from "@/components/electoral/ExportActions";
import EmptyState from "@/components/electoral/EmptyState";

export default function ElectoralConsult() {
  const [filters, setFilters] = useState({
    ano: "",
    uf: "",
    cargo: "",
    candidato: "",
    municipio: "",
    zona: "",
    secao: "",
  });
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [usedMockData, setUsedMockData] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    setResults(null);
    setUsedMockData(false);

    const response = await base44.functions.invoke("tseApiQuery", {
      ano: filters.ano,
      uf: filters.uf,
      cargo: filters.cargo,
      candidato: filters.candidato,
      municipio: filters.municipio,
      zona: filters.zona,
      secao: filters.secao,
    });

    setLoading(false);

    if (response.data?.success) {
      setResults(response.data);
      setUsedMockData(response.data.usedMockData || false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 rounded-2xl p-6 lg:p-8 text-white relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-white/20 text-white border-white/20 text-xs">
                <Database className="w-3 h-3 mr-1" />
                API Repositório TSE
              </Badge>
              <Badge className="bg-green-500/30 text-green-100 border-green-400/30 text-xs">
                2012 – 2024
              </Badge>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold mb-1">
              Consulta Eleitoral Brasil
            </h1>
            <p className="text-blue-100 text-sm max-w-xl">
              Histórico completo de votação por candidato, município, zona e seção eleitoral — via API oficial do TSE.
            </p>
          </div>
          <div className="hidden lg:grid grid-cols-3 gap-3 text-center">
            {[
              { label: "Anos de dados", value: "13" },
              { label: "Estados", value: "27" },
              { label: "Cargos", value: "7" },
            ].map((s) => (
              <div key={s.label} className="bg-white/10 rounded-xl px-4 py-3">
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-blue-200 text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <SearchFilters
        filters={filters}
        onFiltersChange={setFilters}
        onSearch={handleSearch}
        loading={loading}
      />

      {/* Status banners */}
      {usedMockData && results && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm">
          <WifiOff className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <div>
            <span className="font-semibold text-amber-800">Modo demonstração: </span>
            <span className="text-amber-700">
              A API do TSE está temporariamente indisponível. Dados simulados para fins de demonstração.
            </span>
          </div>
        </div>
      )}
      {results && !usedMockData && (
        <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          <Wifi className="w-4 h-4" />
          Dados obtidos em tempo real da API oficial do TSE
        </div>
      )}

      {/* Results */}
      {results && results.data?.length > 0 && (
        <div className="space-y-6">
          {/* Summary KPIs */}
          <SummaryStats data={results.data} ano={filters.ano} uf={filters.uf} cargo={filters.cargo} />

          {/* Sofia IA */}
          <SofiaInsight tseData={results.data} filters={filters} />

          {/* Export */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              <strong className="text-slate-700">{results.total}</strong> registro(s) encontrado(s)
            </p>
            <ExportActions data={results.data} filters={filters} />
          </div>

          {/* Tabs with all analysis modules */}
          <Tabs defaultValue="ranking">
            <TabsList className="bg-white border border-slate-200 p-1 h-auto flex-wrap gap-1">
              <TabsTrigger value="ranking" className="text-xs gap-1.5">
                <Trophy className="w-3.5 h-3.5" />Ranking
              </TabsTrigger>
              <TabsTrigger value="charts" className="text-xs gap-1.5">
                <BarChart3 className="w-3.5 h-3.5" />Gráficos
              </TabsTrigger>
              <TabsTrigger value="historico" className="text-xs gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />Evolução Histórica
              </TabsTrigger>
              <TabsTrigger value="fidelidade" className="text-xs gap-1.5">
                <Heart className="w-3.5 h-3.5" />Redutos e Riscos
              </TabsTrigger>
              <TabsTrigger value="perfil" className="text-xs gap-1.5">
                <Users className="w-3.5 h-3.5" />Perfil do Eleitorado
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ranking" className="mt-4">
              <ResultsTable data={results.data} total={results.total} />
            </TabsContent>

            <TabsContent value="charts" className="mt-4">
              <ResultsCharts data={results.data} />
            </TabsContent>

            <TabsContent value="historico" className="mt-4">
              <HistoricalEvolution filters={filters} />
            </TabsContent>

            <TabsContent value="fidelidade" className="mt-4">
              <FidelityIndicator data={results.data} ano={filters.ano} />
            </TabsContent>

            <TabsContent value="perfil" className="mt-4">
              <ElectorateProfile data={results.data} />
            </TabsContent>
          </Tabs>
        </div>
      )}

      {results && results.data?.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
          <p className="text-slate-500">Nenhum resultado encontrado para os filtros selecionados.</p>
          <p className="text-slate-400 text-sm mt-1">Tente ajustar os filtros ou buscar por outro candidato.</p>
        </div>
      )}

      {!results && !loading && <EmptyState />}
    </div>
  );
}