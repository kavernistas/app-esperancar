import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import {
  Link2, Users, UserCheck, ClipboardList, Target, Phone, Database,
  TrendingUp, MapPin, Loader2, BarChart3
} from "lucide-react";

export default function IntegracaoCRMPanel({ syncStatuses, filters }) {
  const [crmData, setCrmData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCRMData();
  }, []);

  const loadCRMData = async () => {
    setLoading(true);
    try {
      const [leaders, missions, contacts, demands] = await Promise.all([
        base44.entities.Leader.list("-created_date", 100),
        base44.entities.Mission.list("-created_date", 100),
        base44.entities.Contact.list("-created_date", 100),
        base44.entities.Demand.list("-created_date", 100),
      ]);
      setCrmData({
        totalLeaders: leaders.length,
        activeLeaders: leaders.filter(l => l.status === "active").length,
        totalMissions: missions.length,
        completedMissions: missions.filter(m => m.status === "completed").length,
        pendingMissions: missions.filter(m => m.status === "pending").length,
        totalContacts: contacts.length,
        totalDemands: demands.length,
        openDemands: demands.filter(d => d.status === "open").length,
        demandsByType: demands.reduce((acc, d) => { acc[d.type] = (acc[d.type] || 0) + 1; return acc; }, {}),
        contactsByNeighborhood: contacts.reduce((acc, c) => { if (c.neighborhood) { acc[c.neighborhood] = (acc[c.neighborhood] || 0) + 1; } return acc; }, {}),
      });
    } catch (e) {
      console.error("Erro ao carregar dados CRM:", e);
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
      {/* Overview */}
      <Card className="border-slate-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Link2 className="w-5 h-5 text-blue-600" />
            Integração CRM Político
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500 mb-6">
            Cruzamento de dados eleitorais do TSE com sua base de relacionamento político:
            lideranças, missões, contatos, demandas e WhatsApp.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { icon: UserCheck, label: "Lideranças", value: crmData?.totalLeaders || 0, sub: `${crmData?.activeLeaders || 0} ativas`, color: "text-blue-600", bg: "bg-blue-50" },
              { icon: Target, label: "Missões", value: crmData?.totalMissions || 0, sub: `${crmData?.completedMissions || 0} concluídas`, color: "text-emerald-600", bg: "bg-emerald-50" },
              { icon: Users, label: "Contatos", value: crmData?.totalContacts || 0, sub: `CRM`, color: "text-purple-600", bg: "bg-purple-50" },
              { icon: ClipboardList, label: "Demandas", value: crmData?.totalDemands || 0, sub: `${crmData?.openDemands || 0} abertas`, color: "text-orange-600", bg: "bg-orange-50" },
            ].map((stat, i) => (
              <div key={i} className={`${stat.bg} rounded-xl p-4`}>
                <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
                <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.label}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{stat.sub}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cruzamentos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-purple-600" />
              Demandas por Tipo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(crmData?.demandsByType || {}).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] capitalize">{type}</Badge>
                  </div>
                  <span className="font-semibold text-sm text-slate-700">{count}</span>
                </div>
              ))}
              {Object.keys(crmData?.demandsByType || {}).length === 0 && (
                <p className="text-sm text-slate-400 text-center py-4">Nenhuma demanda cadastrada</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              Contatos por Bairro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {Object.entries(crmData?.contactsByNeighborhood || {}).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([neigh, count]) => (
                <div key={neigh} className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">{neigh}</span>
                  <Badge className="text-[10px]">{count}</Badge>
                </div>
              ))}
              {Object.keys(crmData?.contactsByNeighborhood || {}).length === 0 && (
                <p className="text-sm text-slate-400 text-center py-4">Nenhum contato cadastrado</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* WhatsApp + Votação */}
      <Card className="border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Phone className="w-4 h-4 text-green-600" />
            WhatsApp + Dados Eleitorais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded-lg border border-slate-200">
              <p className="text-sm font-medium text-slate-700 mb-1">Disparo Segmentado</p>
              <p className="text-xs text-slate-500">
                Envie mensagens para contatos por zona eleitoral ou bairro, cruzando base CRM com dados de votação.
              </p>
            </div>
            <div className="p-4 bg-white rounded-lg border border-slate-200">
              <p className="text-sm font-medium text-slate-700 mb-1">Missões por Região</p>
              <p className="text-xs text-slate-500">
                Distribua missões para lideranças com base na performance eleitoral de cada território.
              </p>
            </div>
            <div className="p-4 bg-white rounded-lg border border-slate-200">
              <p className="text-sm font-medium text-slate-700 mb-1">Priorização Inteligente</p>
              <p className="text-xs text-slate-500">
                Cruze zonas de risco eleitoral com demandas abertas para priorizar ações de campanha.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}