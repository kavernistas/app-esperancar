import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trophy, Target, Brain, MessageSquare, ListFilter, Edit, Copy, UserPlus } from "lucide-react";
import StatsCards from "@/components/gamification/StatsCards";
import MissionCard from "@/components/gamification/MissionCard";
import MissionForm from "@/components/gamification/MissionForm";
import MissionEditForm from "@/components/gamification/MissionEditForm";
import MissionDuplicationModal from "@/components/gamification/MissionDuplicationModal";
import MissionReassignModal from "@/components/gamification/MissionReassignModal";
import RankingSection from "@/components/gamification/RankingSection";
import SofiaGamificationInsight from "@/components/gamification/SofiaGamificationInsight";
import SofiaMissionRecommendation from "@/components/gamification/SofiaMissionRecommendation";
import WhatsAppMissionModal from "@/components/gamification/WhatsAppMissionModal";

export default function Gamification() {
  const [missions, setMissions] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [neighborhoodFilter, setNeighborhoodFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editMission, setEditMission] = useState(null);
  const [dupMission, setDupMission] = useState(null);
  const [reassignMission, setReassignMission] = useState(null);
  const [whatsappMission, setWhatsappMission] = useState(null);
  const [whatsappLeader, setWhatsappLeader] = useState(null);
  const [rankingPeriod, setRankingPeriod] = useState("geral");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [missionsData, profilesData, leadersData] = await Promise.all([
        base44.entities.Mission.list("-created_date", 200),
        base44.entities.GamificationProfile.list("-total_points", 100),
        base44.entities.Leader.filter({ status: "active" }, "name", 200),
      ]);
      setMissions(missionsData);
      setProfiles(profilesData);
      setLeaders(leadersData);
    } catch (e) { console.error("Erro ao carregar dados:", e); }
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
    if (rankingPeriod === "semana") return source.sort((a, b) => (b.weekly_points || 0) - (a.weekly_points || 0));
    if (rankingPeriod === "mes") return source.sort((a, b) => (b.monthly_points || 0) - (a.monthly_points || 0));
    return source.sort((a, b) => (b.total_points || 0) - (a.total_points || 0));
  };

  const handleCreateMission = async (data, recipients = []) => {
    if (data.is_group_mission && recipients.length > 1) {
      // Criar missão principal
      const parent = await base44.entities.Mission.create({
        ...data,
        leader_id: recipients[0]?.id || "",
        leader_name: recipients[0]?.name || "Grupo",
        total_recipients: recipients.length,
        neighborhood: data.assignment_filters?.neighborhoods?.[0] || "",
      });

      // Criar subtarefas individuais
      const subMissions = recipients.map((leader) => ({
        title: data.title,
        description: data.description,
        type: data.type,
        priority: data.priority,
        deadline: data.deadline,
        points: data.points,
        status: "pending",
        leader_id: leader.id,
        leader_name: leader.name,
        neighborhood: leader.neighborhood || "",
        city: leader.city || "",
        segment: leader.segment || "",
        parent_mission_id: parent.id,
        is_group_mission: false,
        checklist: data.checklist || [],
      }));

      await base44.entities.Mission.bulkCreate(subMissions);

      // Atualizar pending count
      for (const leader of recipients) {
        const profs = await base44.entities.GamificationProfile.filter({ leader_id: leader.id });
        if (profs.length > 0) {
          await base44.entities.GamificationProfile.update(profs[0].id, {
            missions_pending: (profs[0].missions_pending || 0) + 1,
          });
        }
      }
    } else {
      // Missão individual
      await base44.entities.Mission.create(data);
      if (data.leader_id) {
        const profs = await base44.entities.GamificationProfile.filter({ leader_id: data.leader_id });
        if (profs.length > 0) {
          await base44.entities.GamificationProfile.update(profs[0].id, {
            missions_pending: (profs[0].missions_pending || 0) + 1,
          });
        }
      }
    }

    setFormOpen(false);
    loadData();
  };

  const handleCompleteMission = async (mission) => {
    await base44.entities.Mission.update(mission.id, {
      status: "completed",
      completed_date: new Date().toISOString().split("T")[0],
    });

    if (mission.parent_mission_id) {
      // Atualizar contador da missão pai
      const parent = await base44.entities.Mission.get(mission.parent_mission_id);
      const subs = await base44.entities.Mission.filter({ parent_mission_id: mission.parent_mission_id }, "", 500);
      await base44.entities.Mission.update(mission.parent_mission_id, {
        completed_recipients: subs.filter((s) => s.status === "completed").length,
      });
    }

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

  const handleEditSave = async (missionId, changes, historyEntries) => {
    const existingMission = missions.find((m) => m.id === missionId);
    const existingHistory = existingMission?.history || [];
    await base44.entities.Mission.update(missionId, {
      ...changes,
      history: [...existingHistory, ...historyEntries],
    });
    loadData();
  };

  const handleDuplicate = async (original, { title, deadline }) => {
    await base44.entities.Mission.create({
      title,
      description: original.description,
      type: original.type,
      priority: original.priority,
      points: original.points,
      deadline: deadline || null,
      neighborhood: original.neighborhood,
      city: original.city,
      checklist: original.checklist || [],
      attachments: original.attachments || [],
      status: "pending",
      leader_id: "",
      leader_name: "",
      is_group_mission: false,
      assignment_type: "individual",
      created_by_name: "Admin",
      history: [{ date: new Date().toISOString(), action: "Duplicação", user_name: "Admin", field: "all", old_value: `Original: ${original.title}`, new_value: title }],
    });
    loadData();
  };

  const handleReassign = async (missionId, { mode, leader_ids }) => {
    if (leader_ids.length === 1) {
      const leader = leaders.find((l) => l.id === leader_ids[0]);
      await base44.entities.Mission.update(missionId, {
        leader_id: leader_ids[0],
        leader_name: leader?.name || "",
        neighborhood: leader?.neighborhood || "",
        history: [...(missions.find((m) => m.id === missionId)?.history || []), { date: new Date().toISOString(), action: "Reatribuição", user_name: "Admin", field: "leader_id", old_value: missions.find((m) => m.id === missionId)?.leader_id || "", new_value: leader_ids[0] }],
      });
    } else {
      // Reatribuir para múltiplas lideranças
      const original = missions.find((m) => m.id === missionId);
      for (const lid of leader_ids) {
        const leader = leaders.find((l) => l.id === lid);
        await base44.entities.Mission.create({
          title: original?.title || "",
          description: original?.description || "",
          type: original?.type || "other",
          priority: original?.priority || "medium",
          points: original?.points || 30,
          deadline: original?.deadline || null,
          status: "pending",
          leader_id: lid,
          leader_name: leader?.name || "",
          neighborhood: leader?.neighborhood || "",
        });
      }
    }
    loadData();
  };

  const handleSendWhatsApp = (mission) => {
    const leader = leaders.find((l) => l.id === mission.leader_id);
    setWhatsappMission(mission);
    setWhatsappLeader(leader || { name: mission.leader_name, phone: null });
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Engajamento & Gamificação</h2>
          <p className="text-sm text-slate-500">Missões, ranking e produtividade das lideranças</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.location.href = "/missioncenter"}>
            <ListFilter className="w-4 h-4 mr-2" />Central de Missões
          </Button>
          <Button onClick={() => setFormOpen(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />Nova Missão
          </Button>
        </div>
      </div>

      <StatsCards stats={stats} />

      <Tabs defaultValue="missions">
        <TabsList>
          <TabsTrigger value="missions"><Target className="w-4 h-4 mr-1" />Missões</TabsTrigger>
          <TabsTrigger value="ranking"><Trophy className="w-4 h-4 mr-1" />Ranking</TabsTrigger>
          <TabsTrigger value="sofia"><Brain className="w-4 h-4 mr-1" />Sofia IA</TabsTrigger>
          <TabsTrigger value="sofia_missions"><Brain className="w-4 h-4 mr-1" />Recomendações</TabsTrigger>
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
                {neighborhoods.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {filteredMissions.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Target className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Nenhuma missão encontrada</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {filteredMissions.map((mission) => (
                <div key={mission.id} className="relative group">
                  <MissionCard mission={mission} onComplete={handleCompleteMission} onSendWhatsApp={handleSendWhatsApp} />
                  <div className="absolute top-2 right-2 hidden group-hover:flex gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditMission(mission)}><Edit className="w-3.5 h-3.5" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setDupMission(mission)}><Copy className="w-3.5 h-3.5" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setReassignMission(mission)}><UserPlus className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="ranking" className="mt-4">
          <RankingSection rankings={getRankings()} onFilterChange={({ period }) => setRankingPeriod(period)} />
        </TabsContent>

        <TabsContent value="sofia" className="mt-4">
          <SofiaGamificationInsight missions={missions} leaders={leaders} profiles={profiles} />
        </TabsContent>

        <TabsContent value="sofia_missions" className="mt-4">
          <SofiaMissionRecommendation leaders={leaders} missions={missions} profiles={profiles} onCreateMission={(data) => { setFormOpen(true); }} />
        </TabsContent>
      </Tabs>

      <MissionForm open={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleCreateMission} leaders={leaders} />

      <MissionEditForm open={!!editMission} onClose={() => setEditMission(null)} mission={editMission} onSave={handleEditSave} leaders={leaders} />

      <MissionDuplicationModal open={!!dupMission} onClose={() => setDupMission(null)} mission={dupMission} onDuplicate={handleDuplicate} />

      <MissionReassignModal open={!!reassignMission} onClose={() => setReassignMission(null)} mission={reassignMission} leaders={leaders} onReassign={handleReassign} />

      {whatsappMission && (
        <WhatsAppMissionModal open={!!whatsappMission} onClose={() => { setWhatsappMission(null); setWhatsappLeader(null); }} mission={whatsappMission} leader={whatsappLeader} />
      )}
    </div>
  );
}