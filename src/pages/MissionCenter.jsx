import { useState, useEffect, useCallback } from "react";

import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Target, Plus, Users, MapPin, Tag, Clock, CheckCircle2, AlertTriangle,
  Repeat, ArrowUpDown, Search
} from "lucide-react";
import moment from "moment";
import * as missionsApi from '@/api/missions';

const STATUS_CONFIG = {
  pending: { label: "Pendente", icon: Clock, color: "text-blue-500 bg-blue-50" },
  in_progress: { label: "Em Andamento", icon: ArrowUpDown, color: "text-amber-500 bg-amber-50" },
  completed: { label: "Concluída", icon: CheckCircle2, color: "text-emerald-500 bg-emerald-50" },
  overdue: { label: "Vencida", icon: AlertTriangle, color: "text-red-500 bg-red-50" },
  cancelled: { label: "Cancelada", icon: AlertTriangle, color: "text-slate-400 bg-slate-50" },
};

const ASSIGNMENT_LABELS = {
  individual: "Individual",
  neighborhood_group: "Por Bairro",
  segment_group: "Por Segmento",
  all: "Todas",
  custom_filters: "Filtros",
};

const TYPE_LABELS = {
  register_supporters: "Cadastrar Apoiadores",
  visit_region: "Visitar Região",
  mobilize_meeting: "Mobilizar Reunião",
  collect_demands: "Coletar Demandas",
  confirm_attendance: "Confirmar Presença",
  share_content: "Compartilhar Conteúdo",
  organize_local_nucleus: "Organizar Núcleo",
  update_territorial_data: "Atualizar Dados",
  forward_service: "Encaminhar Atendimento",
  other: "Outra",
};

export default function MissionCenter() {
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");

  const loadMissions = useCallback(async () => {
    setLoading(true);
    const data = await missionsApi.listMissions("-created_date", 200);
    setMissions(data);
    setLoading(false);
  }, []);

  useEffect(() => { loadMissions(); }, [loadMissions]);

  // Marcar vencidas
  const now = moment();
  const processed = missions.map((m) => {
    if (m.status !== "completed" && m.status !== "cancelled" && m.deadline && moment(m.deadline).isBefore(now, "day")) {
      return { ...m, status: "overdue" };
    }
    return m;
  });

  const getTabMissions = (tab) => {
    let filtered = processed;
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter((m) =>
        m.title?.toLowerCase().includes(q) ||
        m.leader_name?.toLowerCase().includes(q) ||
        m.neighborhood?.toLowerCase().includes(q)
      );
    }
    switch (tab) {
      case "individual": return filtered.filter((m) => m.assignment_type === "individual");
      case "group": return filtered.filter((m) => m.is_group_mission);
      case "neighborhood": return filtered.filter((m) => m.assignment_type === "neighborhood_group");
      case "segment": return filtered.filter((m) => m.assignment_type === "segment_group");
      case "pending": return filtered.filter((m) => m.status === "PENDING" || m.status === "pending");
      case "in_progress": return filtered.filter((m) => m.status === "IN_PROGRESS" || m.status === "in_progress");
      case "completed": return filtered.filter((m) => m.status === "COMPLETED" || m.status === "completed");
      case "overdue": return filtered.filter((m) => m.status === "OVERDUE" || m.status === "overdue");
      case "recurring": return filtered.filter((m) => m.recurrence?.enabled);
      default: return filtered;
    }
  };

  const tabMissions = getTabMissions(activeTab);

  const execPercent = (m) => {
    if (!m.total_recipients || m.total_recipients === 0) return 0;
    return Math.round(((m.completed_recipients || 0) / m.total_recipients) * 100);
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Central de Missões</h2>
          <p className="text-sm text-slate-500">Gerencie missões individuais, em grupo e recorrentes</p>
        </div>
        <Link to="/gamification">
          <Button className="bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4 mr-2" />Nova Missão</Button>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar por título, liderança, bairro..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="all">Todas ({processed.length})</TabsTrigger>
          <TabsTrigger value="individual"><Users className="w-3.5 h-3.5 mr-1" />Individuais</TabsTrigger>
          <TabsTrigger value="group"><Users className="w-3.5 h-3.5 mr-1" />Em Grupo</TabsTrigger>
          <TabsTrigger value="neighborhood"><MapPin className="w-3.5 h-3.5 mr-1" />Por Bairro</TabsTrigger>
          <TabsTrigger value="segment"><Tag className="w-3.5 h-3.5 mr-1" />Por Segmento</TabsTrigger>
          <TabsTrigger value="pending"><Clock className="w-3.5 h-3.5 mr-1" />Pendentes</TabsTrigger>
          <TabsTrigger value="in_progress"><ArrowUpDown className="w-3.5 h-3.5 mr-1" />Em Andamento</TabsTrigger>
          <TabsTrigger value="completed"><CheckCircle2 className="w-3.5 h-3.5 mr-1" />Concluídas</TabsTrigger>
          <TabsTrigger value="overdue"><AlertTriangle className="w-3.5 h-3.5 mr-1" />Vencidas</TabsTrigger>
          <TabsTrigger value="recurring"><Repeat className="w-3.5 h-3.5 mr-1" />Recorrentes</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {tabMissions.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Target className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Nenhuma missão encontrada</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {tabMissions.map((mission) => {
                const pct = execPercent(mission);
                const statusCfg = STATUS_CONFIG[mission.status] || STATUS_CONFIG.pending;
                const StatusIcon = statusCfg.icon;
                return (
                  <Link key={mission.id} to={`/mission/${mission.id}`}>
                    <Card className="border-slate-200 hover:shadow-md transition-shadow cursor-pointer h-full">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <Badge variant="outline" className={`text-xs ${statusCfg.color}`}>
                            <StatusIcon className="w-3 h-3 mr-1" />{statusCfg.label}
                          </Badge>
                          <div className="flex gap-1">
                            {mission.is_group_mission && <Badge variant="outline" className="text-xs"><Users className="w-3 h-3 mr-0.5" />Grupo</Badge>}
                            {mission.recurrence?.enabled && <Badge variant="outline" className="text-xs"><Repeat className="w-3 h-3 mr-0.5" />Recorrente</Badge>}
                          </div>
                        </div>
                        <h4 className="font-semibold text-sm text-slate-800 line-clamp-1">{mission.title}</h4>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{mission.description}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-400">
                          <Badge variant="secondary" className="text-xs">{TYPE_LABELS[mission.type] || mission.type}</Badge>
                          <span>⭐ {mission.points} pts</span>
                        </div>
                        {mission.is_group_mission && (
                          <div className="mt-3">
                            <div className="flex justify-between text-xs text-slate-500 mb-1">
                              <span>{mission.completed_recipients || 0}/{mission.total_recipients || 0} concluídos</span>
                              <span>{pct}%</span>
                            </div>
                            <Progress value={pct} className="h-1.5" />
                          </div>
                        )}
                        <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
                          {mission.leader_name && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{mission.leader_name}</span>}
                          {mission.neighborhood && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{mission.neighborhood}</span>}
                          {mission.deadline && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{moment(mission.deadline).format("DD/MM")}</span>}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}