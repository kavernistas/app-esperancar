import React from "react";
import { Clock, MapPin, CheckCircle2 } from "lucide-react";

export default function DailyPlan({ missions = [] }) {
  const today = new Date().toISOString().split("T")[0];
  const todayMissions = missions.filter(m => {
    if (m.status === "in_progress") return true;
    const due = m.deadline ? new Date(m.deadline).toISOString().split("T")[0] : null;
    return due === today;
  }).slice(0, 5);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6">
      <h3 className="text-base font-semibold text-[#0A2540] mb-4 flex items-center gap-2">
        <Clock className="w-4 h-4 text-[#7AC943]" /> Plano do Dia
      </h3>
      {todayMissions.length === 0 ? (
        <div className="text-center py-6">
          <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-2" />
          <p className="text-sm text-slate-400">Nenhuma missão para hoje</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {todayMissions.map(m => (
            <div key={m.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                m.status === "in_progress" ? "bg-blue-500" :
                m.status === "overdue" ? "bg-red-500" : "bg-amber-400"
              }`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#0A2540] truncate">{m.title}</p>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                  {m.neighborhood && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{m.neighborhood}</span>}
                  {m.deadline && <span>{new Date(m.deadline).toLocaleDateString("pt-BR")}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}