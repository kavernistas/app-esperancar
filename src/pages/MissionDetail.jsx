import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ArrowLeft, Users, Clock,
  Paperclip
} from "lucide-react";
import moment from "moment";
import * as gamificationApi from '@/api/gamification';
import * as missionsApi from '@/api/missions';

const STATUS_CONFIG = {
  pending: { label: "Pendente", color: "text-blue-500 bg-blue-50" },
  in_progress: { label: "Em Andamento", color: "text-amber-500 bg-amber-50" },
  completed: { label: "Concluída", color: "text-emerald-500 bg-emerald-50" },
  overdue: { label: "Vencida", color: "text-red-500 bg-red-50" },
  cancelled: { label: "Cancelada", color: "text-slate-400 bg-slate-50" },
};

export default function MissionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [mission, setMission] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const m = await missionsApi.getMission(id);
        setMission(m);
        if (m.is_group_mission) {
          const subs = await missionsApi.listMissions({ parent_mission_id: m.id }, "leader_name", 500);
          setSubmissions(subs);
          const leaderIds = [...new Set(subs.map((s) => s.leader_id).filter(Boolean))];
          if (leaderIds.length > 0) {
            const profs = await gamificationApi.listProfiles("-total_points", 500);
            setProfiles(profs.filter((p) => leaderIds.includes(p.leader_id)));
          }
        }
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    load();
  }, [id]);

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" /></div>;
  }
  if (!mission) return <p className="text-center py-20 text-slate-400">Missão não encontrada.</p>;

  const statusCfg = STATUS_CONFIG[mission.status] || STATUS_CONFIG.pending;
  const execPercent = mission.is_group_mission && mission.total_recipients
    ? Math.round(((mission.completed_recipients || 0) / mission.total_recipients) * 100)
    : 0;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/missioncenter")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-slate-800">{mission.title}</h2>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className={statusCfg.color}>{statusCfg.label}</Badge>
            {mission.is_group_mission && <Badge variant="outline"><Users className="w-3 h-3 mr-1" />Em Grupo</Badge>}
            <span className="text-sm text-slate-400">⭐ {mission.points} pontos</span>
          </div>
        </div>
      </div>

      {mission.description && (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-600 whitespace-pre-wrap">{mission.description}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4 text-center"><p className="text-xs text-slate-500">Prazo</p><p className="font-bold">{mission.deadline ? moment(mission.deadline).format("DD/MM/YYYY") : "Sem prazo"}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-xs text-slate-500">Bairro</p><p className="font-bold">{mission.neighborhood || "—"}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-xs text-slate-500">Responsável</p><p className="font-bold">{mission.leader_name || "—"}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-xs text-slate-500">Pontos</p><p className="font-bold text-amber-600">⭐ {mission.points}</p></CardContent></Card>
      </div>

      {mission.is_group_mission && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-lg flex items-center gap-2"><Users className="w-5 h-5" />Execução do Grupo</CardTitle></CardHeader>
          <CardContent>
            <div className="flex justify-between text-sm mb-2">
              <span>{mission.completed_recipients || 0} de {mission.total_recipients || 0} concluídas</span>
              <span className="font-bold">{execPercent}%</span>
            </div>
            <Progress value={execPercent} className="h-2" />
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          {mission.is_group_mission && <TabsTrigger value="recipients">Destinatários ({submissions.length})</TabsTrigger>}
          {mission.is_group_mission && <TabsTrigger value="ranking">Ranking</TabsTrigger>}
          <TabsTrigger value="history">Histórico</TabsTrigger>
          {mission.checklist?.length > 0 && <TabsTrigger value="checklist">Checklist</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          {mission.checklist?.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Checklist</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(mission.checklist || []).map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input type="checkbox" checked={item.done} readOnly className="rounded" />
                      <span className={`text-sm ${item.done ? "line-through text-slate-400" : "text-slate-700"}`}>{item.text}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          {mission.attachments?.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base"><Paperclip className="w-4 h-4 inline mr-1" />Anexos</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {(mission.attachments || []).map((url, i) => (
                    <a key={i} href={url} target="_blank" className="block text-sm text-blue-600 hover:underline">{url.split("/").pop()}</a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          {(mission.history || []).length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Últimas alterações</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(mission.history || []).slice(-5).reverse().map((h, i) => (
                    <div key={i} className="text-xs text-slate-500 flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      <span>{h.date ? moment(h.date).format("DD/MM HH:mm") : ""}</span>
                      <span>{h.user_name || "Sistema"}:</span>
                      <span>{h.action}</span>
                      {h.field && <span className="text-slate-400">({h.field}: {h.old_value} → {h.new_value})</span>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {mission.is_group_mission && (
          <TabsContent value="recipients" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Liderança</TableHead>
                      <TableHead>Bairro</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Conclusão</TableHead>
                      <TableHead>Evidência</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissions.map((sub) => {
                      const subStatus = STATUS_CONFIG[sub.status] || STATUS_CONFIG.pending;
                      return (
                        <TableRow key={sub.id}>
                          <TableCell className="font-medium text-sm">{sub.leader_name || "—"}</TableCell>
                          <TableCell className="text-sm text-slate-500">{sub.neighborhood || "—"}</TableCell>
                          <TableCell><Badge variant="outline" className={subStatus.color}>{subStatus.label}</Badge></TableCell>
                          <TableCell className="text-sm">{sub.completed_date ? moment(sub.completed_date).format("DD/MM/YYYY") : "—"}</TableCell>
                          <TableCell className="text-sm text-slate-400 max-w-[150px] truncate">{sub.evidence || "—"}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {mission.is_group_mission && (
          <TabsContent value="ranking" className="mt-4">
            <Card>
              <CardContent className="p-4">
                {submissions
                  .filter((s) => s.status === "completed")
                  .sort((a, b) => new Date(a.completed_date) - new Date(b.completed_date))
                  .slice(0, 20)
                  .map((sub, idx) => (
                    <div key={sub.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                      <span className={`w-6 text-center font-bold ${idx < 3 ? "text-yellow-500" : "text-slate-400"}`}>{idx + 1}º</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{sub.leader_name}</p>
                        <p className="text-xs text-slate-400">{moment(sub.completed_date).format("DD/MM/YYYY")}</p>
                      </div>
                      <Badge variant="outline">+{sub.points || mission.points} pts</Badge>
                    </div>
                  ))}
                {submissions.filter((s) => s.status === "completed").length === 0 && (
                  <p className="text-center text-slate-400 py-4 text-sm">Nenhuma liderança concluiu ainda.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardContent className="p-4">
              {(mission.history || []).length === 0 ? (
                <p className="text-center text-slate-400 py-4 text-sm">Nenhum registro de alteração.</p>
              ) : (
                <div className="space-y-3">
                  {(mission.history || []).reverse().map((h, i) => (
                    <div key={i} className="border-l-2 border-slate-200 pl-3 py-1">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Clock className="w-3 h-3" />
                        <span>{h.date ? moment(h.date).format("DD/MM/YYYY HH:mm") : ""}</span>
                        <Badge variant="secondary" className="text-xs">{h.action}</Badge>
                      </div>
                      <p className="text-sm mt-1">{h.user_name || "Sistema"}</p>
                      {h.field && <p className="text-xs text-slate-400 mt-0.5">{h.field}: "{h.old_value}" → "{h.new_value}"</p>}
                      {h.justification && <p className="text-xs text-slate-500 mt-0.5 italic">Justificativa: {h.justification}</p>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="checklist" className="mt-4">
          <Card>
            <CardContent className="p-4">
              {(mission.checklist || []).map((item, i) => (
                <div key={i} className="flex items-center gap-2 py-1.5">
                  <input type="checkbox" checked={item.done} readOnly className="rounded" />
                  <span className={`text-sm ${item.done ? "line-through text-slate-400" : "text-slate-700"}`}>{item.text}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}