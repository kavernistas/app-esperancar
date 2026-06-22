import { Card, CardContent } from "@/components/ui/card";
import { Trophy, TrendingUp, Award, Sparkles } from "lucide-react";
import LevelBadge from "@/components/gamification/LevelBadge";

export default function DashboardLideranca({ stats, gamification }) {
  return (
    <div className="space-y-3">
      {/* Level Card */}
      {gamification && (
        <Card className="border-slate-200 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <LevelBadge level={gamification.current_level} size="lg" />
                <div>
                  <p className="text-sm font-bold text-slate-800">{gamification.level_label}</p>
                  <p className="text-xs text-slate-500">Ranking Geral: #{gamification.rank || "-"}</p>
                </div>
              </div>
              {gamification.next_level && (
                <div className="text-right">
                  <span className="text-[10px] text-slate-400">Próximo nível</span>
                  <p className="text-xs font-semibold text-indigo-600">{gamification.next_level}</p>
                </div>
              )}
            </div>
            {gamification.next_level && (
              <div>
                <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                  <span>Progresso</span>
                  <span>{gamification.progress_percent || 0}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
                    style={{ width: `${gamification.progress_percent || 0}%` }}
                  />
                </div>
              </div>
            )}
            {gamification.badges?.length > 0 && (
              <div className="flex gap-1.5 mt-3 flex-wrap">
                {gamification.badges.map((b, i) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium flex items-center gap-1">
                    <Award className="w-3 h-3" />{b}
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Performance cards */}
      <div className="grid grid-cols-2 gap-2">
        <Card className="border-slate-200 bg-emerald-50/50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Trophy className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-800">{stats?.completedMissions || 0}</p>
                <p className="text-[10px] text-slate-500">Missões Concluídas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 bg-blue-50/50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-800">{stats?.resolvedDemands || 0}</p>
                <p className="text-[10px] text-slate-500">Demandas Resolvidas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick tip */}
      {!gamification?.badges?.length && (
        <Card className="border-slate-200 bg-amber-50/50">
          <CardContent className="p-3 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-slate-700 mb-0.5">Dica da Sofia</p>
              <p className="text-[11px] text-slate-500">Complete missões e cadastre apoiadores para subir de nível e conquistar badges!</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}