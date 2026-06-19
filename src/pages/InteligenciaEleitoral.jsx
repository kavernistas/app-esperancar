import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Database, Search, BarChart3, TrendingUp, Users, Trophy,
  FileText, MapPin, Sparkles, Brain, Target, Activity,
  Globe, GitCompare, FileSpreadsheet, FileDown, Link2,
  ArrowLeftRight, History, Lightbulb, ShieldAlert, TrendingDown,
  Zap, PieChart, Building2, Phone, ClipboardList, Filter
} from "lucide-react";
import { Link as RouterLink } from "react-router-dom";

import SyncStatusBanner from "@/components/electoral/SyncStatusBanner";
import ImportPanel from "@/components/electoral/ImportPanel";
import SummaryStats from "@/components/electoral/SummaryStats";
import ResultsTable from "@/components/electoral/ResultsTable";
import ResultsCharts from "@/components/electoral/ResultsCharts";
import SofiaInsight from "@/components/electoral/SofiaInsight";
import ExportActions from "@/components/electoral/ExportActions";
import ComparativoPanel from "@/components/electoral/ComparativoPanel";
import IntegracaoCRMPanel from "@/components/electoral/IntegracaoCRMPanel";
import InteligenciaDashboard from "@/components/electoral/InteligenciaDashboard";

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

const MODULOS = [
  { id: "consulta", label: "Consulta Eleitoral", icon: Search, desc: "Candidatos, partidos, municípios, zonas e seções" },
  { id: "comparativos", label: "Comparativos", icon: GitCompare, desc: "Candidato x Candidato, Partido x Partido, evolução histórica" },
  { id: "sofia", label: "Sofia IA", icon: Brain, desc: "Redutos, zonas de risco, recomendações territoriais" },
  { id: "relatorios", label: "Relatórios", icon: FileSpreadsheet, desc: "PDF, Excel, Link Web, Dashboard executivo" },
  { id: "mapas", label: "Mapas", icon: Globe, desc: "Município, bairro, zona, seção e heatmaps" },
  { id: "integracao", label: "Integração CRM", icon: Link2, desc: "Lideranças, missões, contatos, demandas e WhatsApp" },
  { id: "dashboard", label: "Dashboard Executivo", icon: PieChart, desc: "KPIs, crescimento, regiões prioritárias" },
];

export default function InteligenciaEleitoral() {
  const [filters, setFilters] = useState({ ano: "2024", uf: "GO", cargo: "", municipio: "", candidato: "" });
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [syncStatuses, setSyncStatuses] = useState([]);
  const [activeTab, setActiveTab] = useState("consulta");

  const loadSyncStatus = useCallback(async () => {
    try {
      const res = await base44.functions.invoke("tseDataSync", { action: "status", ano: "", uf: "" });
      if (res.data?.success) setSyncStatuses(res.data.statuses || []);
    } catch (e) {
      console.error("Erro ao carregar status:", e);
    }
  }, []);

  useEffect(() => { loadSyncStatus(); }, [loadSyncStatus]);

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
      if (res.data?.success) setResults(res.data);
    } catch (e) {
      console.error("Erro na consulta:", e);
    }
    setLoading(false);
  };

  const currentSync = syncStatuses.find(s => s.ano === parseInt(filters.ano) && s.uf === filters.uf?.toUpperCase());
  const isSynced = currentSync?.status === "importado";

  const activeModulo = MODULOS.find(m => m.id === activeTab);

  return (
    <div className="space-y-6">
      {/* ===== HEADER ===== */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 rounded-2xl p-6 lg:p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 pointer-events-none"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff'%3E%3Ccircle cx='40' cy='40' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}
        />
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-20 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl" />

        <div className="relative">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-white/20 text-white border-white/20 text-xs">
                  <Brain className="w-3 h-3 mr-1" />Plataforma Esperançar
                </Badge>
                <Badge className="bg-blue-500/30 text-blue-100 border-blue-400/30 text-xs">2012 – 2024</Badge>
                <Badge className="bg-emerald-500/30 text-emerald-100 border-emerald-400/30 text-xs">
                  <Zap className="w-3 h-3 mr-1" />Sofia IA
                </Badge>
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold mb-1">Central de Inteligência Eleitoral</h1>
              <p className="text-blue-100 text-sm max-w-2xl">
                Dados eleitorais oficiais do TSE • CRM político integrado • Inteligência artificial Sofia •
                Gestão territorial e comparativos avançados em um único ambiente.
              </p>
            </div>
            <RouterLink to="/DiagnosticoTSE">
              <Button variant="secondary" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                <Activity className="w-4 h-4 mr-1.5" />Status da Base
              </Button>
            </RouterLink>
          </div>

          {/* Módulos de navegação rápida */}
          <div className="flex flex-wrap gap-1.5 mt-4">
            {MODULOS.map(mod => (
              <button
                key={mod.id}
                onClick={() => setActiveTab(mod.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === mod.id
                    ? "bg-white/20 text-white shadow-sm"
                    : "text-blue-200 hover:text-white hover:bg-white/10"
                }`}
              >
                <mod.icon className="w-3.5 h-3.5" />
                {mod.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Active module indicator */}
      {activeModulo && (
        <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 rounded-lg px-4 py-2">
          <activeModulo.icon className="w-4 h-4 text-blue-600" />
          <span className="font-medium text-slate-700">{activeModulo.label}</span>
          <span className="text-slate-400">—</span>
          <span>{activeModulo.desc}</span>
        </div>
      )}

      {/* ===== MÓDULO 1: CONSULTA ELEITORAL ===== */}
      {activeTab === "consulta" && (
        <div className="space-y-6">
          <SyncStatusBanner syncStatuses={syncStatuses} ano={filters.ano} uf={filters.uf} />
          {!isSynced && <ImportPanel syncStatuses={syncStatuses} />}

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
                  <p className="text-xs text-slate-400">Filtros obrigatórios: <strong>Ano</strong> e <strong>UF</strong></p>
                  <Button onClick={handleSearch} disabled={loading || !filters.ano || !filters.uf} className="bg-blue-600 hover:bg-blue-700">
                    <Search className="w-4 h-4 mr-1.5" />
                    {loading ? "Consultando..." : "Consultar base local"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {loading && (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
            </div>
          )}

          {results && results.data?.length > 0 && (
            <div className="space-y-6">
              <SummaryStats data={results.data} ano={filters.ano} uf={filters.uf} cargo={filters.cargo} />
              <SofiaInsight tseData={results.data} filters={filters} isSynced={results.isSynced} />
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500"><strong className="text-slate-700">{results.total}</strong> registro(s) encontrado(s)</p>
                <ExportActions data={results.data} filters={filters} isSynced={results.isSynced} />
              </div>
              <Tabs defaultValue="ranking">
                <TabsList className="bg-white border border-slate-200 p-1 h-auto flex-wrap gap-1">
                  <TabsTrigger value="ranking" className="text-xs gap-1.5"><Trophy className="w-3.5 h-3.5" />Ranking</TabsTrigger>
                  <TabsTrigger value="charts" className="text-xs gap-1.5"><BarChart3 className="w-3.5 h-3.5" />Gráficos</TabsTrigger>
                </TabsList>
                <TabsContent value="ranking" className="mt-4"><ResultsTable data={results.data} total={results.total} /></TabsContent>
                <TabsContent value="charts" className="mt-4"><ResultsCharts data={results.data} /></TabsContent>
              </Tabs>
            </div>
          )}

          {results && !loading && results.isSynced === false && (
            <Card className="border-slate-200 bg-slate-50">
              <CardContent className="p-12 text-center">
                <Database className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-slate-700 mb-2">Base não sincronizada</h3>
                <p className="text-slate-500 text-sm mb-4">Dados ainda não importados para {filters.uf}/{filters.ano}. Consulte o painel de diagnóstico.</p>
                <RouterLink to="/DiagnosticoTSE">
                  <Button className="bg-blue-600 hover:bg-blue-700"><Activity className="w-4 h-4 mr-1.5" />Ver Status</Button>
                </RouterLink>
              </CardContent>
            </Card>
          )}

          {results && !loading && results.isSynced && results.data?.length === 0 && (
            <Card className="border-slate-200">
              <CardContent className="p-12 text-center">
                <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-slate-700 mb-2">Nenhum resultado</h3>
                <p className="text-slate-500 text-sm">Nenhum registro encontrado. Tente ajustar os filtros.</p>
              </CardContent>
            </Card>
          )}

          {!results && !loading && isSynced && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { icon: Building2, title: "Por Município", desc: "Resultados por cidade" },
                { icon: MapPin, title: "Por Zona Eleitoral", desc: "Dados por zona" },
                { icon: Target, title: "Por Seção", desc: "Votação por seção eleitoral" },
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
      )}

      {/* ===== MÓDULO 2: COMPARATIVOS ===== */}
      {activeTab === "comparativos" && (
        <ComparativoPanel syncStatuses={syncStatuses} />
      )}

      {/* ===== MÓDULO 3: SOFIA IA ===== */}
      {activeTab === "sofia" && (
        <div className="space-y-6">
          <SyncStatusBanner syncStatuses={syncStatuses} ano={filters.ano} uf={filters.uf} />
          <Card className="border-0 shadow-sm bg-gradient-to-br from-slate-900 to-blue-950 text-white overflow-hidden relative">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
            <CardContent className="p-6 lg:p-8 relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center shadow-lg">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Sofia IA — Inteligência Estratégica</h2>
                  <p className="text-slate-400 text-sm">Análises avançadas sobre dados oficiais do TSE</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                {[
                  { icon: Target, title: "Redutos Eleitorais", desc: "Identifica regiões de alta concentração de votos e fidelidade histórica." },
                  { icon: ShieldAlert, title: "Zonas de Risco", desc: "Detecta áreas com queda de apoio ou alta volatilidade eleitoral." },
                  { icon: TrendingUp, title: "Crescimento", desc: "Projeta tendências de evolução com base no histórico de pleitos." },
                  { icon: Lightbulb, title: "Oportunidades", desc: "Aponta regiões subexploradas com alto potencial de conversão." },
                  { icon: Zap, title: "Potencial Eleitoral", desc: "Estima teto de votos por região com dados demográficos." },
                  { icon: MapPin, title: "Recomendações Territoriais", desc: "Sugere alocação de recursos e priorização de territórios." },
                ].map((item, i) => (
                  <div key={i} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors">
                    <item.icon className="w-5 h-5 text-blue-400 mb-2" />
                    <h4 className="font-semibold text-white text-sm mb-1">{item.title}</h4>
                    <p className="text-slate-400 text-xs">{item.desc}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-xl">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-blue-400 mt-0.5" />
                  <div>
                    <p className="text-white font-medium text-sm mb-1">Como usar a Sofia IA</p>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      Acesse o módulo <strong className="text-slate-300">Consulta Eleitoral</strong>, selecione ano, UF e cargo,
                      execute a consulta e clique em <strong className="text-slate-300">Gerar Relatório de Insight</strong>.
                      A Sofia analisará os dados oficiais sincronizados e retornará recomendações estratégicas personalizadas.
                    </p>
                  </div>
                </div>
              </div>

              {!isSynced && (
                <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-amber-400 mt-0.5" />
                  <div>
                    <p className="text-amber-200 font-medium text-sm">Base não sincronizada</p>
                    <p className="text-amber-300/70 text-xs">Importe dados oficiais via serviço externo de ETL para ativar as análises da Sofia.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ===== MÓDULO 4: RELATÓRIOS ===== */}
      {activeTab === "relatorios" && (
        <div className="space-y-6">
          <SyncStatusBanner syncStatuses={syncStatuses} ano={filters.ano} uf={filters.uf} />
          <Card className="border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <FileSpreadsheet className="w-8 h-8 text-blue-600" />
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">Central de Relatórios</h2>
                  <p className="text-sm text-slate-500">Exporte dados eleitorais em múltiplos formatos</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { icon: FileDown, title: "PDF Executivo", desc: "Relatório completo com gráficos, ranking e análise Sofia IA em formato PDF.", badge: "Disponível na consulta", disabled: false },
                  { icon: FileSpreadsheet, title: "Planilha Excel", desc: "Exportação dos dados brutos em CSV para análise em Excel ou Google Sheets.", badge: "Disponível na consulta", disabled: false },
                  { icon: Link2, title: "Link Web Compartilhável", desc: "Gere um link público para compartilhar os resultados com lideranças e equipe.", badge: "Em breve", disabled: true },
                  { icon: PieChart, title: "Dashboard Executivo", desc: "Painel interativo com KPIs, mapas de calor e evolução temporal.", badge: "Acesse o módulo Dashboard", disabled: false },
                ].map((item, i) => (
                  <div key={i} className={`p-4 rounded-xl border ${item.disabled ? "bg-slate-50 border-slate-200 opacity-60" : "bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm transition-all"}`}>
                    <div className="flex items-start justify-between mb-2">
                      <item.icon className={`w-6 h-6 ${item.disabled ? "text-slate-400" : "text-blue-600"}`} />
                      <Badge variant="outline" className="text-[10px]">{item.badge}</Badge>
                    </div>
                    <h4 className="font-semibold text-sm text-slate-800 mb-1">{item.title}</h4>
                    <p className="text-xs text-slate-500">{item.desc}</p>
                  </div>
                ))}
              </div>

              {!isSynced && (
                <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
                  Sincronize dados oficiais na <strong>Consulta Eleitoral</strong> para gerar relatórios completos.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ===== MÓDULO 5: MAPAS ===== */}
      {activeTab === "mapas" && (
        <div className="space-y-6">
          <SyncStatusBanner syncStatuses={syncStatuses} ano={filters.ano} uf={filters.uf} />
          <Card className="border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Globe className="w-8 h-8 text-blue-600" />
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">Mapas Eleitorais</h2>
                  <p className="text-sm text-slate-500">Visualização geoespacial dos resultados eleitorais</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { icon: Building2, title: "Por Município", desc: "Mapa de votação agregado por cidade" },
                  { icon: MapPin, title: "Por Bairro", desc: "Distribuição de votos com marcadores de calor" },
                  { icon: Target, title: "Por Zona Eleitoral", desc: "Resultados por zona com indicadores de performance" },
                  { icon: Filter, title: "Por Seção", desc: "Microtargeting com dados por seção eleitoral" },
                  { icon: Activity, title: "Heatmap de Votos", desc: "Mapa de calor com intensidade de votação" },
                ].map((item, i) => (
                  <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer">
                    <item.icon className="w-6 h-6 text-blue-600 mb-2" />
                    <h4 className="font-semibold text-sm text-slate-800 mb-1">{item.title}</h4>
                    <p className="text-xs text-slate-500">{item.desc}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex justify-end">
                <RouterLink to="/ElectoralMap">
                  <Button variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                    <Globe className="w-4 h-4 mr-1.5" />
                    Abrir Mapa Completo
                  </Button>
                </RouterLink>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ===== MÓDULO 6: INTEGRAÇÃO CRM ===== */}
      {activeTab === "integracao" && (
        <IntegracaoCRMPanel syncStatuses={syncStatuses} filters={filters} />
      )}

      {/* ===== MÓDULO 7: DASHBOARD EXECUTIVO ===== */}
      {activeTab === "dashboard" && (
        <InteligenciaDashboard syncStatuses={syncStatuses} filters={filters} />
      )}
    </div>
  );
}