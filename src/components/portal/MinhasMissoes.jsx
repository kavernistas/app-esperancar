import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, MapPin, Star, Send, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusColors = {
  pending: "bg-amber-100 text-amber-700",
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-emerald-100 text-emerald-700",
  overdue: "bg-red-100 text-red-700",
  cancelled: "bg-slate-100 text-slate-600",
};
const statusLabels = { pending: "Pendente", in_progress: "Em Andamento", completed: "Concluída", overdue: "Vencida", cancelled: "Cancelada" };

function MissionItem({ mission, onAccept, onStart, onComplete, onComment }) {
  const [evidence, setEvidence] = useState("");
  const [checklist, setChecklist] = useState(mission.checklist || []);
  const [showEvidence, setShowEvidence] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const history = mission.history || [];

  const handleComplete = () => {
    onComplete?.({ ...mission, evidence, checklist });
  };

  return (
    <Card className="border-slate-200">
      <CardContent className="p-3">
        <div className="flex items-start justify-between mb-1.5">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-slate-800">{mission.title}</p>
            {mission.description && <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{mission.description}</p>}
          </div>
          <Badge className={`text-[10px] ${statusColors[mission.status] || statusColors.pending}`}>
            {statusLabels[mission.status] || "Pendente"}
          </Badge>
        </div>

        <div className="space-y-1 text-[11px] text-slate-500 mb-2">
          {mission.neighborhood && <div className="flex items-center gap-1"><MapPin className="w-3 h-3" />{mission.neighborhood}</div>}
          {mission.deadline && <div className="flex items-center gap-1"><Calendar className="w-3 h-3" />{format(new Date(mission.deadline), "dd/MM/yyyy", { locale: ptBR })}</div>}
          <div className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-500" />{mission.points || 0} pontos</div>
        </div>

        {/* Checklist */}
        {checklist.length > 0 && (
          <div className="mb-2 space-y-1">
            {checklist.map((item, i) => (
              <label key={i} className="flex items-center gap-2 text-xs">
                <Checkbox
                  checked={item.done}
                  onCheckedChange={v => {
                    const updated = [...checklist];
                    updated[i] = { ...updated[i], done: !!v };
                    setChecklist(updated);
                  }}
                  className="h-3.5 w-3.5"
                />
                <span className={item.done ? "line-through text-slate-400" : "text-slate-600"}>{item.text}</span>
              </label>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-1">
          {mission.status === "pending" && (
            <>
              <Button size="sm" variant="outline" className="text-[10px] h-6 text-blue-600" onClick={() => onStart?.(mission)}>
                Iniciar
              </Button>
              <Button size="sm" variant="outline" className="text-[10px] h-6 text-emerald-600" onClick={() => onAccept?.(mission)}>
                Aceitar
              </Button>
            </>
          )}
          {mission.status === "in_progress" && (
            <>
              <Button size="sm" variant="outline" className="text-[10px] h-6 text-emerald-600" onClick={() => setShowEvidence(!showEvidence)}>
                <Send className="w-3 h-3 mr-1" />
                Evidência
              </Button>
              <Button size="sm" variant="outline" className="text-[10px] h-6 text-green-700" onClick={handleComplete}>
                Concluir
              </Button>
            </>
          )}
          <Button size="sm" variant="ghost" className="text-[10px] h-6" onClick={() => setShowComments(!showComments)}>
            <MessageSquare className="w-3 h-3 mr-1" />
            {history.length} coment.
          </Button>
        </div>

        {showEvidence && mission.status === "in_progress" && (
          <div className="mt-2 space-y-1.5">
            <Textarea value={evidence} onChange={e => setEvidence(e.target.value)} placeholder="Descreva a evidência..." rows={2} className="text-xs" />
          </div>
        )}

        {showComments && history.length > 0 && (
          <div className="mt-2 pt-2 border-t border-slate-100 space-y-1">
            {history.map((h, i) => (
              <p key={i} className="text-[10px] text-slate-400">
                {h.date ? format(new Date(h.date), "dd/MM HH:mm", { locale: ptBR }) : ""} - {h.user_name || h.user_id} - {h.action}
              </p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function MinhasMissoes({ missions, onAccept, onStart, onComplete, onComment }) {
  const [tab, setTab] = useState("pending");

  const now = new Date();
  const withOverdue = (missions || []).map(m => {
    if (m.status === "pending" && m.deadline && new Date(m.deadline) < now) return { ...m, status: "overdue" };
    return m;
  });

  const overdue = withOverdue.filter(m => m.status === "overdue");
  const filtered = tab === "overdue" ? overdue : withOverdue.filter(m => m.status === tab);

  const tabs = ["pending", "in_progress", "completed"];

  return (
    <div className="space-y-3">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full bg-slate-100 h-9">
          {tabs.map(t => (
            <TabsTrigger key={t} value={t} className="text-xs flex-1 h-7">
              {statusLabels[t]}
            </TabsTrigger>
          ))}
          {overdue.length > 0 && (
            <TabsTrigger value="overdue" className="text-xs flex-1 h-7 text-red-600">
              Vencidas ({overdue.length})
            </TabsTrigger>
          )}
        </TabsList>
      </Tabs>

      {filtered.length === 0 ? (
        <p className="text-center text-slate-400 py-8 text-sm">Nenhuma missão nesta categoria.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map(m => (
            <MissionItem key={m.id} mission={m} onAccept={onAccept} onStart={onStart} onComplete={onComplete} onComment={onComment} />
          ))}
        </div>
      )}
    </div>
  );
}