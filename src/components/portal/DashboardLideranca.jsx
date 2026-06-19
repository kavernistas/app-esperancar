import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Users, ClipboardList, Target, TrendingUp, Clock, CheckCircle2, Zap, Star } from "lucide-react";
import LevelBadge from "@/components/gamification/LevelBadge";
import { Badge } from "@/components/ui/badge";

export default function DashboardLideranca({ stats, gamification }) {
  const cards = [
    { label: "Meus Apoiadores", value: stats?.supporters || 0, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Demandas Abertas", value: stats?.openDemands || 0, icon: ClipboardList, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Demandas Resolvidas", value: stats?.resolvedDemands || 0, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Missões Pendentes", value: stats?.pendingMissions || 0, icon: Clock, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "Missões Concluídas", value: stats?.completedMissions || 0, icon: Target, color: "text-green-600", bg: "bg-green-50" },
    { label: "Pontuação", value: stats?.points || 0, icon: Zap, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {cards.map(c => (
          <Card key={c.label} className="border-slate-200">
            <CardContent className="p-3">
              <div className={`w-8 h-8 rounded-lg ${c.bg} flex items-center justify-center mb-2`}>
                <c.icon className={`w-4 h-4 ${c.color}`} />
              </div>
              <p className="text-xl font-bold text-slate-800">{c.value}</p>
              <p className="text-[11px] text-slate-500">{c.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Level + Ranking */}
      {gamification && (
        <Card className="border-slate-200 bg-gradient-to-r from-indigo-50 to-purple-50">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LevelBadge level={gamification.current_level} size="md" />
                <div>
                  <p className="text-sm font-semibold text-slate-800">Nível: {gamification.level_label}</p>
                  <p className="text-[11px] text-slate-500">Ranking: #{gamification.rank || "-"}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">Meta Semanal</p>
                <p className="text-sm font-bold text-indigo-600">{stats?.weeklyProgress || "0/0"}</p>
              </div>
            </div>
            {gamification.next_level && (
              <div className="mt-2">
                <div className="flex justify-between text-[10px] text-slate-500 mb-0.5">
                  <span>Progresso para {gamification.next_level}</span>
                  <span>{gamification.progress_percent || 0}%</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${gamification.progress_percent || 0}%` }} />
                </div>
              </div>
            )}
            {gamification.badges?.length > 0 && (
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {gamification.badges.map((b, i) => (
                  <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">{b}</span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}