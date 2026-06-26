import { useState, useEffect } from "react";

import { Badge } from "@/components/ui/badge";
import { Loader2, Target } from "lucide-react";
import * as missionsApi from '@/api/missions';

const statusColors = {
  pending: "bg-amber-100 text-amber-700",
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-emerald-100 text-emerald-700",
  overdue: "bg-red-100 text-red-700",
  cancelled: "bg-slate-100 text-slate-500",
};
const statusLabels = {
  pending: "Pendente", in_progress: "Em andamento", completed: "Concluída",
  overdue: "Atrasada", cancelled: "Cancelada",
};

export default function ContactMissionList({ contactId }) {
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!contactId) return;
    loadMissions();
  }, [contactId]);

  const loadMissions = async () => {
    setLoading(true);
    try {
      const all = await missionsApi.listMissions({ sort: "-created_date", limit: 200 });
      const filtered = all.filter(m =>
        (m.participant_ids || []).includes(contactId) || m.leader_id === contactId
      );
      setMissions(filtered);
    } catch (e) { console.error("Erro ao carregar missões do contato:", e); }
    setLoading(false);
  };

  if (loading) {
    return <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 text-slate-400 animate-spin" /></div>;
  }

  if (missions.length === 0) {
    return (
      <p className="text-sm text-slate-400 text-center py-4">
        Este contato não participa de nenhuma missão ativa.
      </p>
    );
  }

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {missions.map(m => (
        <div key={m.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 text-sm">
          <div className="flex items-center gap-2 min-w-0">
            <Target className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
            <span className="text-slate-700 truncate">{m.title}</span>
          </div>
          <Badge className={`text-[10px] flex-shrink-0 ml-2 ${statusColors[m.status] || ""}`}>
            {statusLabels[m.status] || m.status}
          </Badge>
        </div>
      ))}
    </div>
  );
}