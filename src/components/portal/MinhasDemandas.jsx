import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardList, MapPin, User, Calendar, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusColors = {
  open: "bg-amber-100 text-amber-700",
  in_progress: "bg-blue-100 text-blue-700",
  resolved: "bg-emerald-100 text-emerald-700",
  pending: "bg-orange-100 text-orange-700",
  cancelled: "bg-slate-100 text-slate-600",
};
const statusLabels = { open: "Aberta", in_progress: "Em Andamento", resolved: "Resolvida", pending: "Pendente", cancelled: "Cancelada" };
const typeLabels = {
  health: "Saúde", education: "Educação", zeladoria: "Zeladoria", iluminacao: "Iluminação",
  infrastructure: "Infraestrutura", transport: "Transporte", social: "Assistência Social",
  security: "Segurança", housing: "Moradia", employment: "Emprego", documentacao: "Documentação", other: "Outros",
};

function DemandaItem({ d, onComment }) {
  const [showHistory, setShowHistory] = useState(false);
  const history = d.history || [];

  return (
    <Card className="border-slate-200">
      <CardContent className="p-3">
        <div className="flex items-start justify-between mb-1.5">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-slate-800">{d.title}</p>
            {d.protocol && <p className="text-[10px] text-slate-400">{d.protocol}</p>}
          </div>
          <Badge className={`text-[10px] ${statusColors[d.status] || statusColors.open}`}>
            {statusLabels[d.status] || "Aberta"}
          </Badge>
        </div>
        <div className="space-y-1 text-[11px] text-slate-500 mb-2">
          <div className="flex items-center gap-1"><span className="font-medium">{typeLabels[d.type] || d.type}</span></div>
          {d.requester_name && <div className="flex items-center gap-1"><User className="w-3 h-3" />{d.requester_name}</div>}
          {d.neighborhood && <div className="flex items-center gap-1"><MapPin className="w-3 h-3" />{d.neighborhood}</div>}
          {d.due_date && <div className="flex items-center gap-1"><Calendar className="w-3 h-3" />{format(new Date(d.due_date), "dd/MM", { locale: ptBR })}</div>}
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" className="text-[10px] h-6" onClick={() => setShowHistory(!showHistory)}>
            <MessageSquare className="w-3 h-3 mr-1" />
            {showHistory ? "Ocultar" : `Histórico (${history.length})`}
          </Button>
          {onComment && <Button variant="ghost" size="sm" className="text-[10px] h-6 text-blue-600" onClick={() => onComment(d)}>Comentar</Button>}
        </div>
        {showHistory && history.length > 0 && (
          <div className="mt-2 pt-2 border-t border-slate-100 space-y-1">
            {history.map((h, i) => (
              <p key={i} className="text-[10px] text-slate-400">
                {h.date ? format(new Date(h.date), "dd/MM HH:mm", { locale: ptBR }) : ""} - {h.user || ""} - {h.new_value || h.action}
              </p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function MinhasDemandas({ demands, onComment }) {
  const [tab, setTab] = useState("open");
  const tabs = ["open", "in_progress", "resolved", "pending"];
  const overdue = (demands || []).filter(d => d.status === "open" && d.due_date && new Date(d.due_date) < new Date());
  const filtered = tab === "overdue" ? overdue : (demands || []).filter(d => d.status === tab);

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
        <p className="text-center text-slate-400 py-8 text-sm">Nenhuma demanda nesta categoria.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map(d => <DemandaItem key={d.id} d={d} onComment={onComment} />)}
        </div>
      )}
    </div>
  );
}