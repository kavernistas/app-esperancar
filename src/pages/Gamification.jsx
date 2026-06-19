import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trophy, Target, Brain, MessageSquare, ListFilter } from "lucide-react";
import StatsCards from "@/components/gamification/StatsCards";
import MissionCard from "@/components/gamification/MissionCard";
import MissionForm from "@/components/gamification/MissionForm";
import RankingSection from "@/components/gamification/RankingSection";
import SofiaGamificationInsight from "@/components/gamification/SofiaGamificationInsight";
import WhatsAppMissionModal from "@/components/gamification/WhatsAppMissionModal";

export default function Gamification() {
  const [missions, setMissions] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [neighborhoodFilter, setNeighborhoodFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [whatsappMission, setWhatsappMission] = useState(null);
  const [whatsappLeader, setWhatsappLeader] = useState(null);
  const [rankingPeriod, setRankingPeriod] = useState("geral");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [missionsData, profilesData, leadersData] = await Promise.all([
        base44.entities.Mission.list("-created_date", 100),
        base44.entities.GamificationProfile.list("-total_points", 100),
        base44.entities.Leader.filter({ status: "active" }, "name", 200),
      ]);
      setMissions(missionsData);
      setProfiles(profilesData);
      setLeaders(leadersData);
    } catch (e) {
      console.error("Erro ao carregar dados:", e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const stats = {
    totalPoints: profiles.reduce((s, p) => s + (p.total_points || 0), 0),
    missionsCompleted: missions.filter((m) => m.status === "completed").length,
    missionsPending: missions.filter((m) => m.status === "pending").length,
    missionsOverdue: missions.filter((m) => m.status === "overdue").length,
    completionRate: missions.length > 0 ? Math.round((missions.filter((m) => m.status === "completed").length / missions.length) * 100) : 0,
    activeLeaders: profiles.length,
  };

  const filteredMissions = missions.filter((m) => {
    if (statusFilter !== "all" && m.status !== statusFilter) return false;
    if (neighborhoodFilter !== "all" && m.neighborhood !== neighborhoodFilter) return false;
    return true;
  });

  const neighborhoods = [...new Set(missions.map((m) => m.neighborhood).filter(Boolean))];

  const getRankings = () => {
    let source = [...profiles];
    if (rankingPeriod === "semana") {
      return source.sort((a, b) => (b.weekly_points || 0) - (a.weekly_points || 0));
    }
    if (rankingPeriod === "mes") {
      return source.sort((a, b) => (b.monthly_points || 0) - (a.monthly_points || 0));
    }
    return source.sort((a, b) => (b.total_points || 0) - (a.total_points || 0));
  };

  const handleCreateMission = async (data) => {
    await base44.entities.Mission.create(data);
    await base44.entities.GamificationProfile.filter({ leader_id: data.leader_id }).then(async (profs) => {
      if (profs.length > 0) {
        await base44.entities.GamificationProfile.update(profs[0].id, {
          missions_pending: (profs[0].missions_pending || 0) + 1,
        });
      }
    });
    setFormOpen(false);
    loadData();
  };

  const handleCompleteMission = async (mission) => {
    await base44.entities.Mission.update(mission.id, {
      status: "completed",
      completed_date: new Date().toISOString().split("T")[0],
    });
    await base44.functions.invoke("gamificationEngine", {
      action: "mission_completed",
      leader_id: mission.leader_id,
      leader_name: mission.leader_name,
      neighborhood: mission.neighborhood,
      city: mission.city,
      mission_points: mission.points || 30,
    });
    const profs = await base44.entities.GamificationProfile.filter({ leader_id: mission.leader_id });
    if (profs.length > 0) {
      await base44.entities.GamificationProfile.update(profs[0].id, {
        missions_completed: (profs[0].missions_completed || 0) + 1,
        missions_pending: Math.max(0, (profs[0].missions_pending || 0) - 1),
      });
    }
    loadData();
  };

  const handleSendWhatsApp = (mission) => {
    const leader = leaders.find((l) => l.id === mission.leader_id);
    setWhatsappMission(mission);
    setWhatsappLeader(leader || { name: mission.leader_name, phone: null });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Engajamento & Gamificação</h2>
          <p className="text-sm text-slate-500 mt-0.5">Missões, ranking e produtividade das lideranças</p>
        </div>
        <Button onClick={() => setFormOpen(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Nova Missão
        </Button>
      </div>

      <StatsCards stats={stats} />

      <Tabs defaultValue="missions" className="w-full">
        <TabsList>
          <TabsTrigger value="missions" className="flex items-center gap-1.5">
            <Target className="w-4 h-4" /> Missões
          </TabsTrigger>
          <TabsTrigger value="ranking" className="flex items-center gap-1.5">
            <Trophy className="w-4 h-4" /> Ranking
          </TabsTrigger>
          <TabsTrigger value="sofia" className="flex items-center gap-1.5">
            <Brain className="w-4 h-4" /> Sofia IA
          </TabsTrigger>
        </TabsList>

        <TabsContent value="missions" className="space-y-4 mt-4">
          <div className="flex flex-wrap items-center gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 h-9 text-sm"><ListFilter className="w-4 h-4 mr-1" /><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="in_progress">Em Andamento</SelectItem>
                <SelectItem value="completed">Concluídas</SelectItem>
                <SelectItem value="overdue">Vencidas</SelectItem>
              </SelectContent>
            </Select>
            <Select value={neighborhoodFilter} onValueChange={setNeighborhoodFilter}>
              <SelectTrigger className="w-44 h-9 text-sm"><SelectValue placeholder="Bairro" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os bairros</SelectItem>
                {neighborhoods.map((n) => (
                  <SelectItem key={n} value={n}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filteredMissions.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Target className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Nenhuma missão encontrada</p>
              <p className="text-xs mt-1">Crie a primeira missão para suas lideranças</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {filteredMissions.map((mission) => (
                <MissionCard
                  key={mission.id}
                  mission={mission}
                  onComplete={handleCompleteMission}
                  onSendWhatsApp={handleSendWhatsApp}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="ranking" className="mt-4">
          <RankingSection
            rankings={getRankings()}
            onFilterChange={({ period }) => setRankingPeriod(period)}
          />
        </TabsContent>

        <TabsContent value="sofia" className="mt-4">
          <SofiaGamificationInsight missions={missions} leaders={leaders} profiles={profiles} />
        </TabsContent>
      </Tabs>

      <MissionForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleCreateMission}
        leaders={leaders}
      />

      {whatsappMission && (
        <WhatsAppMissionModal
          open={!!whatsappMission}
          onClose={() => { setWhatsappMission(null); setWhatsappLeader(null); }}
          mission={whatsappMission}
          leader={whatsappLeader}
        />
      )}
    </div>
  );
}