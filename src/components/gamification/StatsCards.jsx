import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Target, CheckCircle2, AlertCircle, TrendingUp, Users } from "lucide-react";

export default function StatsCards({ stats }) {
  const cards = [
    { label: "Total de Pontos", value: stats?.totalPoints || 0, icon: Trophy, color: "text-yellow-500", bg: "bg-yellow-50" },
    { label: "Missões Concluídas", value: stats?.missionsCompleted || 0, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50" },
    { label: "Missões Pendentes", value: stats?.missionsPending || 0, icon: Target, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "Missões Vencidas", value: stats?.missionsOverdue || 0, icon: AlertCircle, color: "text-red-500", bg: "bg-red-50" },
    { label: "Taxa de Conclusão", value: `${stats?.completionRate || 0}%`, icon: TrendingUp, color: "text-purple-500", bg: "bg-purple-50" },
    { label: "Lideranças Ativas", value: stats?.activeLeaders || 0, icon: Users, color: "text-sky-500", bg: "bg-sky-50" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((card) => (
        <Card key={card.label} className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg ${card.bg} flex items-center justify-center`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <div>
                <p className="text-xs text-slate-500">{card.label}</p>
                <p className="text-lg font-bold text-slate-800">{card.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}