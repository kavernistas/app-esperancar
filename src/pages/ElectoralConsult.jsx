import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Database, Wifi, WifiOff } from "lucide-react";
import SearchFilters from "@/components/electoral/SearchFilters";
import ResultsTable from "@/components/electoral/ResultsTable";
import ResultsCharts from "@/components/electoral/ResultsCharts";
import SofiaInsight from "@/components/electoral/SofiaInsight";
import EmptyState from "@/components/electoral/EmptyState";

export default function ElectoralConsult() {
  const [filters, setFilters] = useState({
    ano: "",
    uf: "",
    cargo: "",
    candidato: "",
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
        <div className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}
        />
        <div className="relative">
          <div className="flex flex-wrap items-start justify-between gap-4">
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
              <h1 className="text-2xl lg:text-3xl font-bold mb-2">
                Mapa de Votos Brasil
              </h1>
              <p className="text-blue-100 text-sm lg:text-base max-w-xl">
                Acesse o histórico detalhado de votação de qualquer candidato, em qualquer seção do Brasil, via API oficial do Tribunal Superior Eleitoral.
              </p>
            </div>
            <div className="hidden lg:grid grid-cols-3 gap-4 text-center">
              {[
                { label: "Anos de dados", value: "13" },
                { label: "Estados", value: "27" },
                { label: "Cargos", value: "7" },
              ].map((stat) => (
                <div key={stat.label} className="bg-white/10 rounded-xl px-4 py-3">
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-blue-200 text-xs mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Search Filters */}
      <SearchFilters
        filters={filters}
        onFiltersChange={setFilters}
        onSearch={handleSearch}
        loading={loading}
      />

      {/* Data source notice */}
      {usedMockData && results && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm">
          <WifiOff className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <div>
            <span className="font-semibold text-amber-800">Modo de demonstração: </span>
            <span className="text-amber-700">
              A API do TSE está temporariamente indisponível. Os dados exibidos são simulados para demonstração da interface.
            </span>
          </div>
        </div>
      )}

      {results && !usedMockData && (
        <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          <Wifi className="w-4 h-4" />
          Dados obtidos em tempo real da API do TSE
        </div>
      )}

      {/* Results */}
      {results && results.data?.length > 0 && (
        <div className="space-y-6">
          {/* Sofia IA */}
          <SofiaInsight tseData={results.data} filters={filters} />

          {/* Charts */}
          <ResultsCharts data={results.data} />

          {/* Table */}
          <ResultsTable
            data={results.data}
            total={results.total}
            loading={loading}
          />
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