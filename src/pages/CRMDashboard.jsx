import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Link as RouterLink } from "react-router-dom";
import {
  Users, TrendingUp, Target, AlertTriangle, UserCheck, Clock, Trophy,
  Phone, MapPin, Star, Loader2, BarChart3, Zap, CheckCircle2
} from "lucide-react";

const ENGAGEMENT_BANDS = [
  { min: 0, max: 20, label: "0–20%", color: "bg-red-500" },
  { min: 21, max: 40, label: "21–40%", color: "bg-orange-500" },
  { min: 41, max: 60, label: "41–60%", color: "bg-amber-500" },
  { min: 61, max: 80, label: "61–80%", color: "bg-emerald-500" },
  { min: 81, max: 100, label: "81–100%", color: "bg-blue-600" },
];

export default function CRMDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [contacts, leaders, missions, gamificationProfiles] = await Promise.all([
        base44.entities.Contact.list("-created_date", 500),
        base44.entities.Leader.list("-created_date", 200),
        base44.entities.Mission.list("-created_date", 200),
        base44.entities.GamificationProfile.list("-total_points", 100),
      ]);

      // Engagement distribution
      const engagementDist = ENGAGEMENT_BANDS.map(band => ({
        ...band,
        count: contacts.filter(c => {
          const lvl = c.engagement_level || 0;
          return lvl >= band.min && lvl <= band.max;
        }).length,
      }));
      const maxBand = Math.max(...engagementDist.map(b => b.count), 1);

      // Leaders needing attention
      const inactiveLeaders = leaders.filter(l => l.status !== "active");
      const activeLeaders = leaders.filter(l => l.status === "active");

      // Leaders with overdue missions
      const overdueMissions = missions.filter(m => m.status === "overdue");
      const leaderIdsWithOverdue = new Set(overdueMissions.map(m => m.leader_id).filter(Boolean));
      const leadersWithOverdue = leaders.filter(l => leaderIdsWithOverdue.has(l.id));

      // Leaders with low supporters count (bottom 25%)
      const sortedBySupporters = [...activeLeaders].sort((a, b) => (a.supporters_count || 0) - (b.supporters_count || 0));
      const lowSupportersThreshold = sortedBySupporters.length > 3 ? sortedBySupporters[Math.floor(sortedBySupporters.length * 0.25)]?.supporters_count || 0 : 0;
      const leadersLowSupporters = activeLeaders.filter(l => (l.supporters_count || 0) <= lowSupportersThreshold && (l.supporters_count || 0) >= 0).slice(0, 5);

      // Combine attention items
      const attentionItems = [
        ...inactiveLeaders.map(l => ({ ...l, reason: "Inativa", reasonColor: "text-red-600", reasonBg: "bg-red-50" })),
        ...leadersWithOverdue.map(l => ({ ...l, reason: "Missões atrasadas", reasonColor: "text-amber-600", reasonBg: "bg-amber-50" })),
        ...leadersLowSupporters.map(l => ({ ...l, reason: "Poucos apoiadores", reasonColor: "text-orange-600", reasonBg: "bg-orange-50" })),
      ].slice(0, 8);

      // Top gamification
      const topGamification = (gamificationProfiles || []).sort((a, b) => (b.total_points || 0) - (a.total_points || 0)).slice(0, 5);

      setData({
        totalContacts: contacts.length,
        totalLeaders: leaders.length,
        activeLeaders: activeLeaders.length,
        totalMissions: missions.length,
        activeMissions: missions.filter(m => m.status === "pending" || m.status === "in_progress").length,
        completedMissions: missions.filter(m => m.status === "completed").length,
        engagementDist,
        maxBand,
        attentionItems,
        topGamification,
        avgEngagement: contacts.length > 0 ? Math.round(contacts.reduce((s, c) => s + (c.engagement_level || 0), 0) / contacts.length) : 0,
        highEngagement: contacts.filter(c => (c.engagement_level || 0) >= 61).length,
      });
    } catch (e) { console.error("Erro ao carregar dashboard CRM:", e); }
    setLoading(false);
  };

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="w-10 h-10 text-emerald-600 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-700 rounded-2xl p-6 lg:p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-400/10 rounded-full blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Badge className="bg-white/20 text-white border-white/20 text-xs"><Users className="w-3 h-3 mr-1" />CRM Político</Badge>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold mb-1">Dashboard CRM</h1>
          <p className="text-emerald-100 text-sm">Visão geral do relacionamento político, engajamento e lideranças</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Users, label: "Contatos", value: data?.totalContacts || 0, sub: "cadastrados", color: "text-blue-600", bg: "bg-blue-50" },
          { icon: UserCheck, label: "Lideranças Ativas", value: data?.activeLeaders || 0, sub: `de ${data?.totalLeaders || 0}`, color: "text-emerald-600", bg: "bg-emerald-50" },
          { icon: Target, label: "Missões Ativas", value: data?.activeMissions || 0, sub: `${data?.completedMissions || 0} concluídas`, color: "text-purple-600", bg: "bg-purple-50" },
          { icon: TrendingUp, label: "Engajamento Médio", value: `${data?.avgEngagement || 0}%`, sub: `${data?.highEngagement || 0} alto`, color: "text-amber-600", bg: "bg-amber-50" },
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Engajamento */}
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
              Contatos por Nível de Engajamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(data?.engagementDist || []).map((band, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600">{band.label}</span>
                    <span className="font-semibold text-slate-700">{band.count} contatos</span>
                  </div>
                  <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${band.color}`}
                      style={{ width: `${(band.count / (data?.maxBand || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-center">
              <div className="bg-red-50 rounded-lg p-3">
                <p className="text-lg font-bold text-red-700">{(data?.engagementDist || []).slice(0, 2).reduce((s, b) => s + b.count, 0)}</p>
                <p className="text-[11px] text-red-600">Baixo engajamento</p>
              </div>
              <div className="bg-emerald-50 rounded-lg p-3">
                <p className="text-lg font-bold text-emerald-700">{(data?.engagementDist || []).slice(3, 5).reduce((s, b) => s + b.count, 0)}</p>
                <p className="text-[11px] text-emerald-600">Alto engajamento</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Atenção */}
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Lideranças que Precisam de Atenção
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[380px] overflow-y-auto">
              {data?.attentionItems?.length > 0 ? data.attentionItems.map((item, i) => (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-lg ${item.reasonBg} hover:opacity-90 transition-opacity`}>
                  <Avatar className="w-9 h-9 flex-shrink-0">
                    <AvatarFallback className="bg-slate-300 text-slate-600 text-xs">{item.name?.charAt(0)?.toUpperCase() || "L"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{item.name || "—"}</p>
                    <p className="text-[11px] text-slate-500 truncate">{item.city || item.neighborhood || "—"}</p>
                  </div>
                  <Badge className={`text-[10px] ${item.reasonBg} ${item.reasonColor} border-none`}>{item.reason}</Badge>
                </div>
              )) : (
                <p className="text-sm text-slate-400 text-center py-8">Todas as lideranças estão em dia</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Gamificação */}
      <Card className="border-slate-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            Top Lideranças em Gamificação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
            {(data?.topGamification || []).map((g, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  i === 0 ? "bg-amber-500 text-white" : i === 1 ? "bg-slate-400 text-white" : i === 2 ? "bg-amber-700 text-white" : "bg-slate-200 text-slate-600"
                }`}>{i + 1}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{g.leader_name || "—"}</p>
                  <p className="text-[11px] text-slate-400">{g.total_points || 0} pts</p>
                </div>
              </div>
            ))}
            {!data?.topGamification?.length && (
              <p className="text-sm text-slate-400 col-span-full text-center py-4">Nenhum perfil gamificado</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Links rápidos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Users, label: "Contatos", to: "/Contacts" },
          { icon: UserCheck, label: "Lideranças", to: "/Leaders" },
          { icon: Target, label: "Missões", to: "/MissionCenter" },
          { icon: MapPin, label: "Inteligência Territorial", to: "/InteligenciaEleitoral" },
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
    </div>
  );
}