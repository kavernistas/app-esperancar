import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link as RouterLink } from "react-router-dom";
import {
  MapPin, Users, UserCheck, ClipboardList, Target, Trophy,
  Brain, Search, Database, BarChart3, TrendingUp, TrendingDown,
  Globe, Sparkles, Activity, Zap, PieChart, Building2, ShieldAlert,
  Lightbulb, GitCompare, FileSpreadsheet, FileDown, Link2, Filter,
  Star, CheckCircle2, AlertTriangle, Phone, Flag, MessageCircle, Play
} from "lucide-react";

import SyncStatusBanner from "@/components/electoral/SyncStatusBanner";
import ImportPanel from "@/components/electoral/ImportPanel";
import SummaryStats from "@/components/electoral/SummaryStats";
import ResultsTable from "@/components/electoral/ResultsTable";
import ResultsCharts from "@/components/electoral/ResultsCharts";
import SofiaInsight from "@/components/electoral/SofiaInsight";
import ExportActions from "@/components/electoral/ExportActions";
import ComparativoPanel from "@/components/electoral/ComparativoPanel";

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
  { value: "prefeito", label: "Prefeito" },{ value: "vereador", label: "Vereador" },
  { value: "governador", label: "Governador" },{ value: "deputado_estadual", label: "Deputado Estadual" },
  { value: "deputado_federal", label: "Deputado Federal" },{ value: "senador", label: "Senador" },
  { value: "presidente", label: "Presidente" },
];

const ABA_TERRITORIOS = "territorios";
const ABA_LIDERANCAS = "liderancas";
const ABA_DEMANDAS = "demandas";
const ABA_MISSOES = "missoes";
const ABA_GAMIFICACAO = "gamificacao";
const ABA_ELEITORAL = "eleitoral";
const ABA_SOFIA = "sofia";

const MODULOS = [
  { id: ABA_TERRITORIOS, label: "Territórios", icon: MapPin, desc: "Cobertura, bairros, demandas por região" },
  { id: ABA_LIDERANCAS, label: "Lideranças", icon: UserCheck, desc: "Ativas, performance, região" },
  { id: ABA_DEMANDAS, label: "Demandas", icon: ClipboardList, desc: "Abertas, resolvidas, por tipo" },
  { id: ABA_MISSOES, label: "Missões", icon: Target, desc: "Concluídas, pendentes, em andamento" },
  { id: ABA_GAMIFICACAO, label: "Gamificação", icon: Trophy, desc: "Níveis, pontos, badges" },
  { id: ABA_ELEITORAL, label: "Inteligência Eleitoral", icon: Database, desc: "Consulta TSE, comparativos, mapas, relatórios" },
  { id: ABA_SOFIA, label: "Sofia IA", icon: Brain, desc: "Redutos, zonas de risco, recomendações" },
];

export default function InteligenciaEleitoral() {
  // --- Electoral state ---
  const [filters, setFilters] = useState({ ano: "2024", uf: "GO", cargo: "", municipio: "", candidato: "" });
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [syncStatuses, setSyncStatuses] = useState([]);
  const [electoralSubtab, setElectoralSubtab] = useState("consulta");

  // --- CRM data ---
  const [crmData, setCrmData] = useState(null);
  const [crmLoading, setCrmLoading] = useState(true);

  const [activeTab, setActiveTab] = useState(ABA_TERRITORIOS);

  const loadSyncStatus = useCallback(async () => {
    try {
      const res = await base44.functions.invoke("tseDataSync", { action: "status", ano: "", uf: "" });
      if (res.data?.success) setSyncStatuses(res.data.statuses || []);
    } catch (e) { console.error("Erro ao carregar status:", e); }
  }, []);

  const loadCRMData = useCallback(async () => {
    setCrmLoading(true);
    try {
      const [leaders, missions, contacts, demands, gamificationProfiles] = await Promise.all([
        base44.entities.Leader.list("-created_date", 200),
        base44.entities.Mission.list("-created_date", 200),
        base44.entities.Contact.list("-created_date", 500),
        base44.entities.Demand.list("-created_date", 200),
        base44.entities.GamificationProfile.list("-total_points", 100),
      ]);

      const activeLeaders = leaders.filter(l => l.status === "active");
      const completedMissions = missions.filter(m => m.status === "completed");
      const pendingMissions = missions.filter(m => m.status === "pending" || m.status === "in_progress");
      const overdueMissions = missions.filter(m => m.status === "overdue");
      const openDemands = demands.filter(d => d.status === "open" || d.status === "in_progress");
      const resolvedDemands = demands.filter(d => d.status === "resolved");

      const contactsByNeighborhood = {};
      contacts.forEach(c => {
        if (c.neighborhood) contactsByNeighborhood[c.neighborhood] = (contactsByNeighborhood[c.neighborhood] || 0) + 1;
      });

      const demandsByType = {};
      demands.forEach(d => { demandsByType[d.type] = (demandsByType[d.type] || 0) + 1; });

      const demandsByNeighborhood = {};
      demands.forEach(d => {
        if (d.neighborhood) demandsByNeighborhood[d.neighborhood] = (demandsByNeighborhood[d.neighborhood] || 0) + 1;
      });

      setCrmData({
        leaders: { total: leaders.length, active: activeLeaders.length, inactive: leaders.length - activeLeaders.length },
        missions: { total: missions.length, completed: completedMissions.length, pending: pendingMissions.length, overdue: overdueMissions.length },
        contacts: { total: contacts.length },
        demands: { total: demands.length, open: openDemands.length, resolved: resolvedDemands.length },
        gamification: gamificationProfiles || [],
        contactsByNeighborhood,
        demandsByType,
        demandsByNeighborhood,
        totalNeighborhoods: Object.keys(contactsByNeighborhood).length,
        taxaConclusao: missions.length > 0 ? Math.round((completedMissions.length / missions.length) * 100) : 0,
      });
    } catch (e) { console.error("Erro ao carregar dados CRM:", e); }
    setCrmLoading(false);
  }, []);

  useEffect(() => { loadSyncStatus(); loadCRMData(); }, [loadSyncStatus, loadCRMData]);

  // --- Electoral search ---
  const handleSearch = async () => {
    if (!filters.ano || !filters.uf) return;
    setLoading(true);
    setResults(null);
    try {
      const res = await base44.functions.invoke("tseDataSync", {
        action: "query", ano: filters.ano, uf: filters.uf,
        cargo: filters.cargo || undefined, municipio: filters.municipio || undefined,
        candidato: filters.candidato || undefined,
      });
      if (res.data?.success) setResults(res.data);
    } catch (e) { console.error("Erro na consulta:", e); }
    setLoading(false);
  };

  const currentSync = syncStatuses.find(s => s.ano === parseInt(filters.ano) && s.uf === filters.uf?.toUpperCase());
  const isSynced = currentSync?.status === "importado";
  const activeModulo = MODULOS.find(m => m.id === activeTab);

  // --- Helper for gamification level ---
  const levelLabels = {
    semente: "Semente", mobilizador: "Mobilizador", lideranca_local: "Liderança Local",
    coordenador_territorial: "Coordenador Territorial", referencia_esperancar: "Referência Esperançar",
  };
  const levelColors = {
    semente: "bg-slate-100 text-slate-600", mobilizador: "bg-blue-100 text-blue-700",
    lideranca_local: "bg-emerald-100 text-emerald-700", coordenador_territorial: "bg-purple-100 text-purple-700",
    referencia_esperancar: "bg-amber-100 text-amber-700",
  };

  // ========================================================================
  // RENDER
  // ========================================================================
  return (
    <div className="space-y-6">
      {/* ===== HEADER ===== */}
      <div className="bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 rounded-2xl p-6 lg:p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 pointer-events-none"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none'%3E%3Cg fill='%23ffffff'%3E%3Ccircle cx='40' cy='40' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}
        />
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-20 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl" />

        <div className="relative">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-white/20 text-white border-white/20 text-xs">
                  <MapPin className="w-3 h-3 mr-1" />Plataforma Esperançar
                </Badge>
                <Badge className="bg-emerald-500/30 text-emerald-100 border-emerald-400/30 text-xs">CRM Político</Badge>
                <Badge className="bg-amber-500/30 text-amber-100 border-amber-400/30 text-xs">
                  <Brain className="w-3 h-3 mr-1" />Sofia IA
                </Badge>
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold mb-1">Central de Inteligência Territorial</h1>
              <p className="text-emerald-100 text-sm max-w-2xl">
                CRM Político • Gestão Territorial • Mobilização • Inteligência Eleitoral • Sofia IA
              </p>
            </div>
            <RouterLink to="/DiagnosticoTSE">
              <Button variant="secondary" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                <Activity className="w-4 h-4 mr-1.5" />Status da Base TSE
              </Button>
            </RouterLink>
          </div>

          <div className="flex flex-wrap gap-1.5 mt-4">
            {MODULOS.map(mod => (
              <button
                key={mod.id}
                onClick={() => setActiveTab(mod.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === mod.id
                    ? "bg-white/20 text-white shadow-sm"
                    : "text-emerald-200 hover:text-white hover:bg-white/10"
                }`}
              >
                <mod.icon className="w-3.5 h-3.5" />
                {mod.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {activeModulo && (
        <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 rounded-lg px-4 py-2">
          <activeModulo.icon className="w-4 h-4 text-emerald-600" />
          <span className="font-medium text-slate-700">{activeModulo.label}</span>
          <span className="text-slate-400">—</span>
          <span>{activeModulo.desc}</span>
        </div>
      )}

      {/* ================================================================ */}
      {/* ABA 1: TERRITÓRIOS                                                */}
      {/* ================================================================ */}
      {activeTab === ABA_TERRITORIOS && (
        <div className="space-y-6">
          {crmLoading ? (
            <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin" /></div>
          ) : (
            <>
              {/* KPIs de Cobertura */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: MapPin, label: "Bairros Cobertos", value: crmData?.totalNeighborhoods || 0, sub: "com contatos cadastrados", color: "text-emerald-600", bg: "bg-emerald-50" },
                  { icon: UserCheck, label: "Lideranças Ativas", value: crmData?.leaders?.active || 0, sub: `de ${crmData?.leaders?.total || 0} cadastradas`, color: "text-blue-600", bg: "bg-blue-50" },
                  { icon: ClipboardList, label: "Demandas Abertas", value: crmData?.demands?.open || 0, sub: `${crmData?.demands?.resolved || 0} resolvidas`, color: "text-orange-600", bg: "bg-orange-50" },
                  { icon: Target, label: "Missões Pendentes", value: crmData?.missions?.pending || 0, sub: `${crmData?.missions?.completed || 0} concluídas`, color: "text-purple-600", bg: "bg-purple-50" },
                ].map((kpi, i) => (
                  <Card key={i} className={`border-slate-200 ${kpi.bg} border-none`}>
                    <CardContent className="p-4">
                      <kpi.icon className={`w-5 h-5 ${kpi.color} mb-2`} />
                      <p className="text-2xl font-bold text-slate-800">{kpi.value}</p>
                      <p className="text-xs text-slate-500">{kpi.label}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{kpi.sub}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Contatos por Bairro + Demandas por Tipo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-slate-200">
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-sm text-slate-800 mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4 text-emerald-600" />Contatos por Bairro
                    </h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {Object.entries(crmData?.contactsByNeighborhood || {}).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([n, c]) => (
                        <div key={n} className="flex justify-between items-center text-sm">
                          <span className="text-slate-600 truncate mr-2">{n}</span>
                          <Badge variant="outline" className="text-[10px] flex-shrink-0">{c}</Badge>
                        </div>
                      ))}
                      {Object.keys(crmData?.contactsByNeighborhood || {}).length === 0 && (
                        <p className="text-sm text-slate-400 text-center py-4">Nenhum contato cadastrado</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-200">
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-sm text-slate-800 mb-3 flex items-center gap-2">
                      <ClipboardList className="w-4 h-4 text-orange-600" />Demandas por Tipo
                    </h3>
                    <div className="space-y-2">
                      {Object.entries(crmData?.demandsByType || {}).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
                        <div key={type} className="flex justify-between items-center text-sm">
                          <Badge variant="outline" className="text-[10px] capitalize">{type}</Badge>
                          <span className="font-semibold text-slate-700">{count}</span>
                        </div>
                      ))}
                      {Object.keys(crmData?.demandsByType || {}).length === 0 && (
                        <p className="text-sm text-slate-400 text-center py-4">Nenhuma demanda cadastrada</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Potencial Eleitoral */}
              <Card className="border-slate-200 bg-gradient-to-r from-slate-50 to-emerald-50/30">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Zap className="w-6 h-6 text-emerald-600" />
                    <div>
                      <h3 className="font-semibold text-slate-800">Potencial Eleitoral Estimado</h3>
                      <p className="text-sm text-slate-500">Capacidade de mobilização territorial</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                    <div className="p-4 bg-white rounded-lg border border-slate-100">
                      <p className="text-3xl font-bold text-emerald-700">{crmData?.contacts?.total || 0}</p>
                      <p className="text-sm text-slate-500">Contatos mobilizáveis</p>
                    </div>
                    <div className="p-4 bg-white rounded-lg border border-slate-100">
                      <p className="text-3xl font-bold text-blue-700">{crmData?.leaders?.active || 0}</p>
                      <p className="text-sm text-slate-500">Lideranças em campo</p>
                    </div>
                    <div className="p-4 bg-white rounded-lg border border-slate-100">
                      <p className="text-3xl font-bold text-purple-700">{crmData?.totalNeighborhoods || 0}</p>
                      <p className="text-sm text-slate-500">Bairros cobertos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Links rápidos */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { icon: Globe, label: "Mapa Territorial", to: "/ElectoralMap" },
                  { icon: Phone, label: "WhatsApp", to: "/Contacts" },
                  { icon: Building2, label: "Planejamento", to: "/StrategicPlanning" },
                  { icon: FileSpreadsheet, label: "Relatórios", to: "/Reports" },
                ].map((link, i) => (
                  <RouterLink key={i} to={link.to}>
                    <Card className="border-slate-200 hover:border-emerald-300 hover:shadow-sm transition-all cursor-pointer h-full">
                      <CardContent className="p-4 text-center">
                        <link.icon className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                        <p className="text-sm font-medium text-slate-700">{link.label}</p>
                      </CardContent>
                    </Card>
                  </RouterLink>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ================================================================ */}
      {/* ABA 2: LIDERANÇAS                                                 */}
      {/* ================================================================ */}
      {activeTab === ABA_LIDERANCAS && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Card className="border-slate-200 bg-blue-50 border-none">
              <CardContent className="p-4 text-center">
                <UserCheck className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <p className="text-3xl font-bold text-slate-800">{crmData?.leaders?.total || 0}</p>
                <p className="text-sm text-slate-500">Cadastradas</p>
              </CardContent>
            </Card>
            <Card className="border-slate-200 bg-emerald-50 border-none">
              <CardContent className="p-4 text-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                <p className="text-3xl font-bold text-slate-800">{crmData?.leaders?.active || 0}</p>
                <p className="text-sm text-slate-500">Ativas</p>
              </CardContent>
            </Card>
            <Card className="border-slate-200 bg-slate-50 border-none">
              <CardContent className="p-4 text-center">
                <AlertTriangle className="w-6 h-6 text-slate-500 mx-auto mb-2" />
                <p className="text-3xl font-bold text-slate-800">{crmData?.leaders?.inactive || 0}</p>
                <p className="text-sm text-slate-500">Inativas</p>
              </CardContent>
            </Card>
          </div>
          <div className="flex justify-center">
            <RouterLink to="/Leaders">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Users className="w-4 h-4 mr-2" />Gerenciar Lideranças
              </Button>
            </RouterLink>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* ABA 3: DEMANDAS                                                   */}
      {/* ================================================================ */}
      {activeTab === ABA_DEMANDAS && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Card className="border-slate-200 bg-orange-50 border-none">
              <CardContent className="p-4 text-center">
                <ClipboardList className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                <p className="text-3xl font-bold text-slate-800">{crmData?.demands?.open || 0}</p>
                <p className="text-sm text-slate-500">Abertas</p>
              </CardContent>
            </Card>
            <Card className="border-slate-200 bg-emerald-50 border-none">
              <CardContent className="p-4 text-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                <p className="text-3xl font-bold text-slate-800">{crmData?.demands?.resolved || 0}</p>
                <p className="text-sm text-slate-500">Resolvidas</p>
              </CardContent>
            </Card>
            <Card className="border-slate-200 bg-slate-50 border-none">
              <CardContent className="p-4 text-center">
                <BarChart3 className="w-6 h-6 text-slate-600 mx-auto mb-2" />
                <p className="text-3xl font-bold text-slate-800">{crmData?.demands?.total || 0}</p>
                <p className="text-sm text-slate-500">Total</p>
              </CardContent>
            </Card>
          </div>
          <div className="flex justify-center">
            <RouterLink to="/Demands">
              <Button className="bg-orange-600 hover:bg-orange-700">
                <ClipboardList className="w-4 h-4 mr-2" />Gerenciar Demandas
              </Button>
            </RouterLink>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* ABA 4: MISSÕES                                                    */}
      {/* ================================================================ */}
      {activeTab === ABA_MISSOES && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-slate-200 bg-emerald-50 border-none">
              <CardContent className="p-4 text-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                <p className="text-3xl font-bold text-slate-800">{crmData?.missions?.completed || 0}</p>
                <p className="text-sm text-slate-500">Concluídas</p>
              </CardContent>
            </Card>
            <Card className="border-slate-200 bg-amber-50 border-none">
              <CardContent className="p-4 text-center">
                <Play className="w-6 h-6 text-amber-600 mx-auto mb-2" />
                <p className="text-3xl font-bold text-slate-800">{crmData?.missions?.pending || 0}</p>
                <p className="text-sm text-slate-500">Pendentes</p>
              </CardContent>
            </Card>
            <Card className="border-slate-200 bg-red-50 border-none">
              <CardContent className="p-4 text-center">
                <AlertTriangle className="w-6 h-6 text-red-500 mx-auto mb-2" />
                <p className="text-3xl font-bold text-slate-800">{crmData?.missions?.overdue || 0}</p>
                <p className="text-sm text-slate-500">Atrasadas</p>
              </CardContent>
            </Card>
            <Card className="border-slate-200 bg-purple-50 border-none">
              <CardContent className="p-4 text-center">
                <TrendingUp className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                <p className="text-3xl font-bold text-slate-800">{crmData?.taxaConclusao || 0}%</p>
                <p className="text-sm text-slate-500">Taxa de conclusão</p>
              </CardContent>
            </Card>
          </div>
          <div className="flex justify-center">
            <RouterLink to="/MissionCenter">
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Target className="w-4 h-4 mr-2" />Central de Missões
              </Button>
            </RouterLink>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* ABA 5: GAMIFICAÇÃO                                                */}
      {/* ================================================================ */}
      {activeTab === ABA_GAMIFICACAO && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Card className="border-slate-200 bg-amber-50 border-none">
              <CardContent className="p-4 text-center">
                <Trophy className="w-6 h-6 text-amber-600 mx-auto mb-2" />
                <p className="text-3xl font-bold text-slate-800">{crmData?.gamification?.length || 0}</p>
                <p className="text-sm text-slate-500">Perfis gamificados</p>
              </CardContent>
            </Card>
            <Card className="border-slate-200 bg-purple-50 border-none">
              <CardContent className="p-4 text-center">
                <Star className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                <p className="text-3xl font-bold text-slate-800">
                  {crmData?.gamification?.reduce((sum, g) => sum + (g.total_points || 0), 0)?.toLocaleString() || 0}
                </p>
                <p className="text-sm text-slate-500">Pontos totais</p>
              </CardContent>
            </Card>
            <Card className="border-slate-200 bg-emerald-50 border-none">
              <CardContent className="p-4 text-center">
                <Zap className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                <p className="text-3xl font-bold text-slate-800">
                  {crmData?.gamification?.reduce((sum, g) => sum + (g.missions_completed || 0), 0) || 0}
                </p>
                <p className="text-sm text-slate-500">Missões concluídas</p>
              </CardContent>
            </Card>
          </div>

          {/* Ranking */}
          <Card className="border-slate-200">
            <CardContent className="p-4">
              <h3 className="font-semibold text-sm text-slate-800 mb-3 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />Ranking de Lideranças
              </h3>
              <div className="space-y-2">
                {(crmData?.gamification || []).sort((a, b) => (b.total_points || 0) - (a.total_points || 0)).slice(0, 5).map((g, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 text-sm">
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? "bg-amber-500 text-white" : i === 1 ? "bg-slate-400 text-white" : i === 2 ? "bg-amber-700 text-white" : "bg-slate-200 text-slate-600"}`}>{i + 1}</span>
                      <span className="text-slate-700">{g.leader_name || "—"}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={`text-[10px] ${levelColors[g.current_level] || "bg-slate-100 text-slate-600"}`}>{levelLabels[g.current_level] || g.current_level}</Badge>
                      <span className="font-semibold text-slate-700">{g.total_points || 0} pts</span>
                    </div>
                  </div>
                ))}
                {(crmData?.gamification || []).length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-4">Nenhum perfil gamificado</p>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <RouterLink to="/Gamification">
              <Button className="bg-amber-600 hover:bg-amber-700">
                <Trophy className="w-4 h-4 mr-2" />Painel de Gamificação
              </Button>
            </RouterLink>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* ABA 6: INTELIGÊNCIA ELEITORAL — apenas um módulo entre sete      */}
      {/* ================================================================ */}
      {activeTab === ABA_ELEITORAL && (
        <div className="space-y-6">
          <SyncStatusBanner syncStatuses={syncStatuses} ano={filters.ano} uf={filters.uf} />

          {/* Sub-navegação eleitoral */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: "consulta", label: "Consulta", icon: Search },
              { id: "comparativos", label: "Comparativos", icon: GitCompare },
              { id: "mapas", label: "Mapas", icon: Globe },
              { id: "relatorios", label: "Relatórios", icon: FileSpreadsheet },
            ].map(sub => (
              <button
                key={sub.id}
                onClick={() => setElectoralSubtab(sub.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                  electoralSubtab === sub.id
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                }`}
              >
                <sub.icon className="w-3.5 h-3.5" />{sub.label}
              </button>
            ))}
          </div>

          {/* Sub-aba: CONSULTA */}
          {electoralSubtab === "consulta" && (
            <div className="space-y-6">
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
                      <div><Label className="text-xs">Cargo</Label><select value={filters.cargo} onChange={(e) => setFilters({ ...filters, cargo: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm mt-1"><option value="">Todos</option>{CARGOS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</select></div>
                      <div><Label className="text-xs">Município</Label><Input value={filters.municipio} onChange={(e) => setFilters({ ...filters, municipio: e.target.value })} placeholder="Nome" className="mt-1 text-sm" /></div>
                      <div><Label className="text-xs">Candidato</Label><Input value={filters.candidato} onChange={(e) => setFilters({ ...filters, candidato: e.target.value })} placeholder="Nome ou número" className="mt-1 text-sm" /></div>
                    </div>
                    <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-100">
                      <p className="text-xs text-slate-400">Filtros obrigatórios: <strong>Ano</strong> e <strong>UF</strong></p>
                      <Button onClick={handleSearch} disabled={loading || !filters.ano || !filters.uf} className="bg-blue-600 hover:bg-blue-700">
                        <Search className="w-4 h-4 mr-1.5" />{loading ? "Consultando..." : "Consultar base local"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {loading && <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" /></div>}

              {results && results.data?.length > 0 && (
                <div className="space-y-6">
                  <SummaryStats data={results.data} ano={filters.ano} uf={filters.uf} cargo={filters.cargo} />
                  <SofiaInsight tseData={results.data} filters={filters} isSynced={results.isSynced} />
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-500"><strong className="text-slate-700">{results.total}</strong> registro(s)</p>
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
                <Card className="border-slate-200 bg-slate-50"><CardContent className="p-12 text-center">
                  <Database className="w-12 h-12 text-slate-300 mx-auto mb-3" /><h3 className="text-lg font-semibold text-slate-700 mb-2">Base não sincronizada</h3>
                  <p className="text-slate-500 text-sm mb-4">Dados ainda não importados para {filters.uf}/{filters.ano}.</p>
                  <RouterLink to="/DiagnosticoTSE"><Button className="bg-blue-600 hover:bg-blue-700"><Activity className="w-4 h-4 mr-1.5" />Ver Status</Button></RouterLink>
                </CardContent></Card>
              )}
            </div>
          )}

          {/* Sub-aba: COMPARATIVOS */}
          {electoralSubtab === "comparativos" && <ComparativoPanel syncStatuses={syncStatuses} />}

          {/* Sub-aba: MAPAS */}
          {electoralSubtab === "mapas" && (
            <Card className="border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6"><Globe className="w-8 h-8 text-blue-600" /><div><h2 className="text-lg font-semibold text-slate-800">Mapas Eleitorais</h2><p className="text-sm text-slate-500">Visualização geoespacial</p></div></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[{ icon: Building2, title: "Por Município", desc: "Agregado por cidade" },{ icon: MapPin, title: "Por Bairro", desc: "Marcadores de calor" },{ icon: Target, title: "Por Zona", desc: "Performance por zona" },{ icon: Filter, title: "Por Seção", desc: "Microtargeting" },{ icon: Activity, title: "Heatmap", desc: "Intensidade de votação" }].map((item, i) => (
                    <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"><item.icon className="w-6 h-6 text-blue-600 mb-2" /><h4 className="font-semibold text-sm text-slate-800 mb-1">{item.title}</h4><p className="text-xs text-slate-500">{item.desc}</p></div>
                  ))}
                </div>
                <div className="mt-4 flex justify-end"><RouterLink to="/ElectoralMap"><Button variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50"><Globe className="w-4 h-4 mr-1.5" />Abrir Mapa Completo</Button></RouterLink></div>
              </CardContent>
            </Card>
          )}

          {/* Sub-aba: RELATÓRIOS */}
          {electoralSubtab === "relatorios" && (
            <Card className="border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6"><FileSpreadsheet className="w-8 h-8 text-blue-600" /><div><h2 className="text-lg font-semibold text-slate-800">Relatórios Eleitorais</h2><p className="text-sm text-slate-500">Exporte dados em múltiplos formatos</p></div></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[{ icon: FileDown, title: "PDF Executivo", desc: "Gráficos, ranking e análise Sofia IA", badge: "Na consulta" },{ icon: FileSpreadsheet, title: "CSV / Excel", desc: "Dados brutos para análise externa", badge: "Na consulta" },{ icon: Link2, title: "Link Compartilhável", desc: "Compartilhe com a equipe", badge: "Em breve", disabled: true },{ icon: PieChart, title: "Dashboard", desc: "KPIs e evolução temporal", badge: "Nesta central" }].map((item, i) => (
                    <div key={i} className={`p-4 rounded-xl border ${item.disabled ? "bg-slate-50 border-slate-200 opacity-60" : "bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm transition-all"}`}>
                      <div className="flex items-start justify-between mb-2"><item.icon className={`w-6 h-6 ${item.disabled ? "text-slate-400" : "text-blue-600"}`} /><Badge variant="outline" className="text-[10px]">{item.badge}</Badge></div>
                      <h4 className="font-semibold text-sm text-slate-800 mb-1">{item.title}</h4><p className="text-xs text-slate-500">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ================================================================ */}
      {/* ABA 7: SOFIA IA                                                    */}
      {/* ================================================================ */}
      {activeTab === ABA_SOFIA && (
        <div className="space-y-6">
          <Card className="border-0 shadow-sm bg-gradient-to-br from-slate-900 to-indigo-950 text-white overflow-hidden relative">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
            <CardContent className="p-6 lg:p-8 relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center shadow-lg"><Brain className="w-6 h-6 text-white" /></div>
                <div><h2 className="text-xl font-bold text-white">Sofia IA — Inteligência Estratégica</h2><p className="text-slate-400 text-sm">Análises sobre dados oficiais do TSE e dados do CRM político</p></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                {[
                  { icon: Target, title: "Redutos Eleitorais", desc: "Regiões de alta concentração de votos e fidelidade histórica." },
                  { icon: ShieldAlert, title: "Zonas de Risco", desc: "Áreas com queda de apoio ou alta volatilidade." },
                  { icon: TrendingUp, title: "Crescimento", desc: "Projeção de tendências com base no histórico." },
                  { icon: Lightbulb, title: "Oportunidades", desc: "Regiões subexploradas com alto potencial." },
                  { icon: Zap, title: "Potencial Eleitoral", desc: "Teto de votos estimado por região." },
                  { icon: MapPin, title: "Recomendações Territoriais", desc: "Alocação de recursos e priorização." },
                ].map((item, i) => (
                  <div key={i} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors">
                    <item.icon className="w-5 h-5 text-indigo-400 mb-2" /><h4 className="font-semibold text-white text-sm mb-1">{item.title}</h4><p className="text-slate-400 text-xs">{item.desc}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-xl flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-indigo-400 mt-0.5" />
                <div><p className="text-white font-medium text-sm mb-1">Como usar a Sofia IA</p><p className="text-slate-400 text-xs leading-relaxed">Acesse a aba <strong className="text-slate-300">Inteligência Eleitoral</strong>, selecione ano, UF e cargo, execute a consulta e clique em <strong className="text-slate-300">Gerar Relatório de Insight</strong>. A Sofia cruza dados oficiais do TSE com sua base de CRM político.</p></div>
              </div>
              {!isSynced && (
                <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-amber-400 mt-0.5" /><div><p className="text-amber-200 font-medium text-sm">Base TSE não sincronizada</p><p className="text-amber-300/70 text-xs">Importe dados oficiais para ativar as análises da Sofia.</p></div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}