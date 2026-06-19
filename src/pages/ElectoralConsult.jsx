import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Database, Download, Search, BarChart3, TrendingUp, Users, Heart, Trophy,
  FileText, Building2, MapPin, Filter
} from "lucide-react";

import SyncStatusBanner from "@/components/electoral/SyncStatusBanner";
import ImportPanel from "@/components/electoral/ImportPanel";
import SummaryStats from "@/components/electoral/SummaryStats";
import ResultsTable from "@/components/electoral/ResultsTable";
import ResultsCharts from "@/components/electoral/ResultsCharts";
import SofiaInsight from "@/components/electoral/SofiaInsight";
import ExportActions from "@/components/electoral/ExportActions";

const ESTADOS = [
  { sigla: "AC", nome: "Acre" },{ sigla: "AL", nome: "Alagoas" },{ sigla: "AM", nome: "Amazonas" },
  { sigla: "AP", nome: "Amapá" },{ sigla: "BA", nome: "Bahia" },{ sigla: "CE", nome: "Ceará" },
  { sigla: "DF", nome: "Distrito Federal" },{ sigla: "ES", nome: "Espírito Santo" },{ sigla: "GO", nome: "Goiás" },
  { sigla: "MA", nome: "Maranhão" },{ sigla: "MG", nome: "Minas Gerais" },{ sigla: "MS", nome: "Mato Grosso do Sul" },
  { sigla: "MT", nome: "Mato Grosso" },{ sigla: "PA", nome: "Pará" },{ sigla: "PB", nome: "Paraíba" },
  { sigla: "PE", nome: "Pernambuco" },{ sigla: "PI", nome: "Piauí" },{ sigla: "PR", nome: "Paraná" },
  { sigla: "RJ", nome: "Rio de Janeiro" },{ sigla: "RN", nome: "Rio Grande do Norte" },{ sigla: "RO", nome: "Rondônia" },
  { sigla: "RR", nome: "Roraima" },{ sigla: "RS", nome: "Rio Grande do Sul" },{ sigla: "SC", nome: "Santa Catarina" },
  { sigla: "SE", nome: "Sergipe" },{ sigla: "SP", nome: "São Paulo" },{ sigla: "TO", nome: "Tocantins" },
];

const ANOS = [2012, 2014, 2016, 2018, 2020, 2022, 2024];
const CARGOS = [
  { value: "prefeito", label: "Prefeito" },
  { value: "vereador", label: "Vereador" },
  { value: "governador", label: "Governador" },
  { value: "deputado_estadual", label: "Deputado Estadual" },
  { value: "deputado_federal", label: "Deputado Federal" },
  { value: "senador", label: "Senador" },
  { value: "presidente", label: "Presidente" },
];

export default function ElectoralConsult() {
  const [filters, setFilters] = useState({ ano: "2024", uf: "GO", cargo: "", municipio: "", candidato: "" });
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncStatuses, setSyncStatuses] = useState([]);

  const loadSyncStatus = useCallback(async () => {
    try {
      const res = await base44.functions.invoke("tseDataSync", { action: "sync_status", ano: "", uf: "" });
      if (res.data?.success) setSyncStatuses(res.data.statuses || []);
    } catch (e) {
      console.error("Erro ao carregar status:", e);
    }
  }, []);

  useEffect(() => { loadSyncStatus(); }, [loadSyncStatus]);

  const handleSync = async (ano, uf, dataset_tipo = "votacao_secao") => {
    setSyncing(true);
    let result = null;
    try {
      const res = await base44.functions.invoke("tseDataSync", { action: "sync", ano, uf, dataset_tipo });
      result = res.data;
      await loadSyncStatus();
    } catch (e) {
      console.error("Erro na sincronização:", e);
    }
    setSyncing(false);
    return result;
  };

  const handleSearch = async () => {
    if (!filters.ano || !filters.uf) return;
    setLoading(true);
    setResults(null);

    try {
      const res = await base44.functions.invoke("tseDataSync", {
        action: "query",
        ano: filters.ano,
        uf: filters.uf,
        cargo: filters.cargo || undefined,
        municipio: filters.municipio || undefined,
        candidato: filters.candidato || undefined,
      });

      if (res.data?.success) {
        setResults(res.data);
      }
    } catch (e) {
      console.error("Erro na consulta:", e);
    }
    setLoading(false);
  };

  const currentSync = syncStatuses.find(s => s.ano === parseInt(filters.ano) && s.uf === filters.uf?.toUpperCase());
  const isSynced = currentSync?.status === "importado";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 rounded-2xl p-6 lg:p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}
        />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-white/20 text-white border-white/20 text-xs">
                <Database className="w-3 h-3 mr-1" />Dados Públicos TSE
              </Badge>
              <Badge className="bg-blue-500/30 text-blue-100 border-blue-400/30 text-xs">2012 – 2024</Badge>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold mb-1">Consulta Eleitoral Brasil</h1>
            <p className="text-blue-100 text-sm max-w-xl">
              Dados oficiais do TSE importados diretamente do CDN ou por upload de arquivo. Consulte apenas bases já sincronizadas.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" className="bg-white/10 text-white border-white/20 hover:bg-white/20" onClick={() => document.getElementById("import-section")?.scrollIntoView({ behavior: "smooth" })}>
              <Download className="w-4 h-4 mr-1.5" />Sincronizar Base
            </Button>
          </div>
        </div>
      </div>

      {/* Sync Status Banner */}
      <SyncStatusBanner syncStatuses={syncStatuses} ano={filters.ano} uf={filters.uf} onSync={handleSync} />

      {!isSynced && !syncing && (
        <div id="import-section">
          <ImportPanel syncStatuses={syncStatuses} onSync={handleSync} syncing={syncing} />
        </div>
      )}

      {/* Filtros de consulta */}
      {isSynced && (
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
              <div>
                <Label className="text-xs">Ano *</Label>
                <select value={filters.ano} onChange={(e) => setFilters({ ...filters, ano: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm mt-1">
                  {ANOS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-xs">UF *</Label>
                <select value={filters.uf} onChange={(e) => setFilters({ ...filters, uf: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm mt-1">
                  {ESTADOS.map(e => <option key={e.sigla} value={e.sigla}>{e.sigla} - {e.nome}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-xs">Cargo</Label>
                <select value={filters.cargo} onChange={(e) => setFilters({ ...filters, cargo: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm mt-1">
                  <option value="">Todos</option>
                  {CARGOS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-xs">Município</Label>
                <Input value={filters.municipio} onChange={(e) => setFilters({ ...filters, municipio: e.target.value })} placeholder="Nome do município" className="mt-1 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Candidato</Label>
                <Input value={filters.candidato} onChange={(e) => setFilters({ ...filters, candidato: e.target.value })} placeholder="Nome ou número" className="mt-1 text-sm" />
              </div>
            </div>
            <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-100">
              <p className="text-xs text-slate-400">
                Filtros obrigatórios: <strong>Ano</strong> e <strong>UF</strong>
              </p>
              <Button onClick={handleSearch} disabled={loading || !filters.ano || !filters.uf} className="bg-blue-600 hover:bg-blue-700">
                <Search className="w-4 h-4 mr-1.5" />
                {loading ? "Consultando..." : "Consultar"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      )}

      {/* Results */}
      {results && results.data?.length > 0 && (
        <div className="space-y-6">
          <SummaryStats data={results.data} ano={filters.ano} uf={filters.uf} cargo={filters.cargo} />

          <SofiaInsight tseData={results.data} filters={filters} isSynced={results.isSynced} />

          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              <strong className="text-slate-700">{results.total}</strong> registro(s) encontrado(s)
            </p>
            <ExportActions data={results.data} filters={filters} />
          </div>

          <Tabs defaultValue="ranking">
            <TabsList className="bg-white border border-slate-200 p-1 h-auto flex-wrap gap-1">
              <TabsTrigger value="ranking" className="text-xs gap-1.5"><Trophy className="w-3.5 h-3.5" />Ranking</TabsTrigger>
              <TabsTrigger value="charts" className="text-xs gap-1.5"><BarChart3 className="w-3.5 h-3.5" />Gráficos</TabsTrigger>
            </TabsList>
            <TabsContent value="ranking" className="mt-4">
              <ResultsTable data={results.data} total={results.total} />
            </TabsContent>
            <TabsContent value="charts" className="mt-4">
              <ResultsCharts data={results.data} />
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Empty state */}
      {results && !loading && results.isSynced === false && (
        <Card className="border-slate-200 bg-slate-50">
          <CardContent className="p-12 text-center">
            <Database className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">Base não sincronizada</h3>
            <p className="text-slate-500 text-sm mb-4">
              Dados oficiais ainda não importados para {filters.uf}/{filters.ano}.
              Use o painel de sincronização acima para importar os dados do TSE e começar a consultar.
            </p>
            <Button onClick={() => handleSync(filters.ano, filters.uf)} className="bg-blue-600 hover:bg-blue-700">
              <Download className="w-4 h-4 mr-1.5" />Importar Dados
            </Button>
          </CardContent>
        </Card>
      )}

      {results && !loading && results.isSynced && results.data?.length === 0 && (
        <Card className="border-slate-200">
          <CardContent className="p-12 text-center">
            <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">Nenhum resultado</h3>
            <p className="text-slate-500 text-sm">
              Nenhum registro encontrado para os filtros selecionados. Tente ajustar os filtros.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Cards de acesso rápido */}
      {!results && !loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { icon: Building2, title: "Por Município", desc: "Resultados por cidade" },
            { icon: MapPin, title: "Por Zona Eleitoral", desc: "Dados por zona" },
            { icon: Filter, title: "Por Seção", desc: "Votação por seção eleitoral" },
            { icon: TrendingUp, title: "Comparação Histórica", desc: "Evolução entre pleitos" },
            { icon: Users, title: "Perfil do Eleitorado", desc: "Gênero, faixa etária, escolaridade" },
            { icon: FileText, title: "Exportar Dados", desc: "CSV, PDF, relatório Sofia" },
          ].map((card, i) => (
            <Card key={i} className="border-slate-200 hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <card.icon className="w-8 h-8 text-blue-600 mb-2" />
                <h4 className="font-semibold text-sm text-slate-800">{card.title}</h4>
                <p className="text-xs text-slate-400 mt-0.5">{card.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}