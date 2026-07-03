import { tseApi } from "@/api/client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import * as missionsApi from '@/api/missions';
import * as demandsApi from '@/api/demands';
import * as leadersApi from '@/api/leaders';
import * as contactsApi from '@/api/contacts';
import { TrendingUp, Target, Users, MapPin,

const normalizeList = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.data?.data)) return value.data.data;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.results)) return value.results;
  return [];
};

  Zap, CheckCircle2, AlertTriangle, Loader2, Star, Flag, Database
} from "lucide-react";

export default function InteligenciaDashboard({ syncStatuses, filters }) {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [syncStatus, leaders, missions, contacts, demands] = await Promise.all([
        tseApi.getSyncStatus(0, ""),
        leadersApi.listLeaders({ limit: 200 }),
        missionsApi.listMissions({ sort: "-created_at", limit: 200 }),
        contactsApi.listContacts({ sort: "-created_at", limit: 200 }),
        demandsApi.listDemands({ sort: "-created_at", limit: 200 }),
      ]);

      const statuses = syncStatus.data?.statuses || [];
      const imported = statuses.filter(s => (s.status || "").toUpperCase() === "IMPORTADO");

      setDashboard({
        basesImportadas: imported.length,
        totalBases: 27 * 7, // 27 UFs × 7 anos
        totalRegistros: imported.reduce((sum, s) => sum + (s.total_linhas || 0), 0),
        liderancasAtivas: normalizeList(leaders).filter(l => (l.status || "").toUpperCase() === "ACTIVE").length,
        liderancasTotal: normalizeList(leaders).length,
        missoesConcluidas: normalizeList(missions).filter(m => m.status === "completed").length,
        missoesPendentes: normalizeList(missions).filter(m => m.status === "pending" || m.status === "in_progress").length,
        missoesTotal: normalizeList(missions).length,
        contatosTotal: normalizeList(contacts).length,
        demandasAbertas: normalizeList(demands).filter(d => d.status === "open" || d.status === "in_progress").length,
        demandasResolvidas: normalizeList(demands).filter(d => d.status === "resolved").length,
        coberturaTerritorial: new Set(normalizeList(contacts).filter(c => c.neighborhood).map(c => c.neighborhood)).size,
        // Calculate growth from completed missions vs total
        taxaConclusao: normalizeList(missions).length > 0 ? Math.round((normalizeList(missions).filter(m => m.status === "completed").length / normalizeList(missions).length) * 100) : 0,
        taxaImportacao: Math.round((imported.length / (27 * 7)) * 100),
      });
    } catch (e) {
      console.error("Erro ao carregar dashboard:", e);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs Principais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: TrendingUp, label: "Bases Importadas", value: `${dashboard?.basesImportadas || 0}/${dashboard?.totalBases || 189}`, sub: `${dashboard?.taxaImportacao || 0}% cobertura`, color: "text-blue-600", bg: "bg-blue-50" },
          { icon: Users, label: "Lideranças Ativas", value: dashboard?.liderancasAtivas || 0, sub: `de ${dashboard?.liderancasTotal || 0} cadastradas`, color: "text-emerald-600", bg: "bg-emerald-50" },
          { icon: Target, label: "Missões", value: `${dashboard?.missoesConcluidas || 0} concluídas`, sub: `${dashboard?.missoesPendentes || 0} pendentes`, color: "text-purple-600", bg: "bg-purple-50" },
          { icon: MapPin, label: "Cobertura Territorial", value: dashboard?.coberturaTerritorial || 0, sub: "bairros cobertos", color: "text-orange-600", bg: "bg-orange-50" },
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

      {/* KPIs Secundários */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Database, label: "Registros TSE", value: dashboard?.totalRegistros?.toLocaleString() || "0", sub: "dados oficiais", color: "text-indigo-600", bg: "bg-indigo-50" },
          { icon: Users, label: "Contatos CRM", value: dashboard?.contatosTotal || 0, sub: "base de relacionamento", color: "text-sky-600", bg: "bg-sky-50" },
          { icon: CheckCircle2, label: "Demandas Resolvidas", value: dashboard?.demandasResolvidas || 0, sub: `${dashboard?.demandasAbertas || 0} abertas`, color: "text-emerald-600", bg: "bg-emerald-50" },
          { icon: Star, label: "Taxa de Conclusão", value: `${dashboard?.taxaConclusao || 0}%`, sub: "missões concluídas", color: "text-amber-600", bg: "bg-amber-50" },
        ].map((kpi, i) => (
          <Card key={i} className="border-slate-200">
            <CardContent className="p-4">
              <kpi.icon className={`w-5 h-5 ${kpi.color} mb-2`} />
              <p className="text-2xl font-bold text-slate-800">{kpi.value}</p>
              <p className="text-xs text-slate-500">{kpi.label}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{kpi.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Regiões Prioritárias */}
      <Card className="border-slate-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Flag className="w-5 h-5 text-red-500" />
            Regiões Prioritárias
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <p className="font-semibold text-sm text-red-800">Alta Prioridade</p>
              </div>
              <p className="text-xs text-red-600">
                Regiões com queda de votos ou baixa cobertura de lideranças.
                Exige atenção imediata da coordenação de campanha.
              </p>
            </div>
            <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <p className="font-semibold text-sm text-amber-800">Potencial de Crescimento</p>
              </div>
              <p className="text-xs text-amber-600">
                Territórios com alto potencial eleitoral e baixa penetração atual.
                Oportunidade de expansão com alocação estratégica de recursos.
              </p>
            </div>
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <p className="font-semibold text-sm text-emerald-800">Redutos Consolidados</p>
              </div>
              <p className="text-xs text-emerald-600">
                Regiões com alta fidelidade eleitoral histórica.
                Manter engajamento com missões de fidelização.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Potencial Eleitoral */}
      <Card className="border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Potencial Eleitoral
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-3xl font-bold text-blue-700">{dashboard?.contatosTotal || 0}</p>
              <p className="text-sm text-slate-500">Contatos mobilizáveis</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-purple-700">{dashboard?.liderancasAtivas || 0}</p>
              <p className="text-sm text-slate-500">Lideranças em campo</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-emerald-700">{dashboard?.coberturaTerritorial || 0}</p>
              <p className="text-sm text-slate-500">Bairros cobertos</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
