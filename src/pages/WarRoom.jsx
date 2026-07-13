import React, { useState, useEffect, useCallback } from "react";
import { listContacts } from "@/api/contacts";
import { listLeaders } from "@/api/leaders";
import { listMissions } from "@/api/missions";
import { listDemands } from "@/api/demands";
import { normalizeList } from "@/lib/normalizeList";
import { Users, Target, AlertTriangle, MapPin, RefreshCw } from "lucide-react";
import KpiCard from "@/components/warroom/KpiCard";
import AlertPanel from "@/components/warroom/AlertPanel";
import SofiaBriefing from "@/components/warroom/SofiaBriefing";
import DailyPlan from "@/components/warroom/DailyPlan";

export default function WarRoom() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [missions, setMissions] = useState([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [contactsRes, leadersRes, missionsRes, demandsRes] = await Promise.all([
        listContacts({ limit: 500 }).catch(() => []),
        listLeaders({ limit: 500 }).catch(() => []),
        listMissions({ limit: 100 }).catch(() => ({ data: [] })),
        listDemands({ limit: 100 }).catch(() => []),
      ]);

      const contacts = normalizeList(contactsRes);
      const leaders = normalizeList(leadersRes);
      const missionsData = missionsRes?.data || normalizeList(missionsRes);
      const demands = normalizeList(demandsRes);

      const activeLeaders = leaders.filter(l => l.status === "active");
      const activeMissions = missionsData.filter(m => m.status === "in_progress" || m.status === "pending");
      const overdueMissions = missionsData.filter(m => m.status === "overdue");
      const criticalDemands = demands.filter(d => d.priority === "urgent" || d.priority === "high");
      const openDemands = demands.filter(d => d.status === "open" || d.status === "in_progress");

      const newStats = {
        totalContacts: contacts.length,
        activeMissions: activeMissions.length,
        criticalDemands: criticalDemands.length,
        totalLeaders: activeLeaders.length,
        overdueMissions: overdueMissions.length,
        openDemands: openDemands.length,
      };
      setStats(newStats);
      setMissions(missionsData);

      const newAlerts = [];
      if (overdueMissions.length > 0) {
        newAlerts.push({ severity: "warning", title: `${overdueMissions.length} missões atrasadas`, message: "Equipes de campo com prazo vencido" });
      }
      if (criticalDemands.length > 0) {
        newAlerts.push({ severity: "critical", title: `${criticalDemands.length} demandas críticas`, message: "Requerem atenção imediata" });
      }
      if (activeLeaders.length > 0 && activeLeaders.length < 5) {
        newAlerts.push({ severity: "warning", title: "Poucas lideranças ativas", message: `${activeLeaders.length} lideranças ativas cadastradas` });
      }
      if (openDemands.length > 10) {
        newAlerts.push({ severity: "info", title: `${openDemands.length} demandas em aberto`, message: "Volume alto de demandas pendentes" });
      }
      setAlerts(newAlerts);
    } catch (e) {}
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-[#7AC943] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0A2540]">War Room</h1>
          <p className="text-sm text-slate-500">Central de Comando — Visão Executiva da Campanha</p>
        </div>
        <button onClick={loadData} className="p-2 hover:bg-slate-100 rounded-xl transition">
          <RefreshCw className="w-5 h-5 text-slate-500" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Contatos Totais" value={stats.totalContacts || 0} icon={Users} color="blue" subtitle="Base de apoiadores" />
        <KpiCard label="Missões Ativas" value={stats.activeMissions || 0} icon={Target} color="purple" subtitle={`${stats.overdueMissions || 0} atrasadas`} />
        <KpiCard label="Demandas Críticas" value={stats.criticalDemands || 0} icon={AlertTriangle} color="red" subtitle={`${stats.openDemands || 0} em aberto`} />
        <KpiCard label="Lideranças Ativas" value={stats.totalLeaders || 0} icon={MapPin} color="green" subtitle="Coordenadores de território" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AlertPanel alerts={alerts} />
        </div>
        <DailyPlan missions={missions} />
      </div>

      <SofiaBriefing stats={stats} />
    </div>
  );
}