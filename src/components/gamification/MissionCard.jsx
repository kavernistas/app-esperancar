import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Send, CheckCircle2 } from "lucide-react";
import moment from "moment";

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

const STATUS_CONFIG = {
  pending: { label: "Pendente", color: "bg-blue-100 text-blue-700" },
  in_progress: { label: "Em Andamento", color: "bg-amber-100 text-amber-700" },
  completed: { label: "Concluída", color: "bg-emerald-100 text-emerald-700" },
  overdue: { label: "Vencida", color: "bg-red-100 text-red-700" },
};

export default function MissionCard({ mission, onComplete, onSendWhatsApp, showLeader = true }) {
  const isOverdue = mission.status !== "completed" && mission.deadline && moment(mission.deadline).isBefore(moment(), "day");
  const status = isOverdue && mission.status !== "completed" ? STATUS_CONFIG.overdue : STATUS_CONFIG[mission.status] || STATUS_CONFIG.pending;

  return (
    <Card className={`border-slate-200 hover:shadow-md transition-shadow ${mission.status === "completed" ? "opacity-75" : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className={status.color}>{status.label}</Badge>
              <Badge variant="outline" className="text-xs">{TYPE_LABELS[mission.type] || mission.type}</Badge>
              <span className="text-xs font-semibold text-amber-600">+{mission.points || 30} pts</span>
            </div>
            <h4 className="font-semibold text-slate-800 mt-1">{mission.title}</h4>
            {mission.description && (
              <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">{mission.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
              {mission.neighborhood && (
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{mission.neighborhood}</span>
              )}
              {mission.deadline && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {moment(mission.deadline).format("DD/MM/YYYY")}
                </span>
              )}
            </div>
            {showLeader && mission.leader_name && (
              <p className="text-xs text-slate-400 mt-1">👤 {mission.leader_name}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5 shrink-0">
            {mission.status !== "completed" && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                  onClick={() => onComplete?.(mission)}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  Concluir
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs border-slate-300 text-slate-600 hover:bg-slate-50"
                  onClick={() => onSendWhatsApp?.(mission)}
                >
                  <Send className="w-3.5 h-3.5 mr-1" />
                  WhatsApp
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}