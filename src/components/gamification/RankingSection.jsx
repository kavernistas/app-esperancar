import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, Medal, Star, MapPin } from "lucide-react";
import LevelBadge from "./LevelBadge";

const MEDAL_COLORS = ["text-yellow-500", "text-slate-400", "text-amber-600"];

export default function RankingSection({ rankings, onFilterChange, filters }) {
  const [period, setPeriod] = useState("geral");

  const filtered = rankings || [];

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Ranking de Lideranças
          </CardTitle>
          <div className="flex gap-2">
            <Select value={period} onValueChange={(v) => { setPeriod(v); onFilterChange?.({ period: v }); }}>
              <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="geral">Geral</SelectItem>
                <SelectItem value="semana">Esta Semana</SelectItem>
                <SelectItem value="mes">Este Mês</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
          <p className="text-center text-slate-400 py-8 text-sm">Nenhuma liderança no ranking ainda.</p>
        ) : (
          <div className="space-y-2">
            {filtered.slice(0, 20).map((item, idx) => (
              <div
                key={item.leader_id || idx}
                className={`flex items-center gap-3 p-3 rounded-lg ${idx < 3 ? "bg-slate-50" : ""} hover:bg-slate-50 transition-colors`}
              >
                <div className="w-8 text-center font-bold">
                  {idx < 3 ? (
                    <Medal className={`w-5 h-5 ${MEDAL_COLORS[idx]} mx-auto`} />
                  ) : (
                    <span className="text-sm text-slate-400">{idx + 1}º</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-slate-800 truncate">{item.leader_name || "Sem nome"}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {item.neighborhood && (
                      <span className="text-xs text-slate-400 flex items-center gap-0.5">
                        <MapPin className="w-3 h-3" />{item.neighborhood}
                      </span>
                    )}
                    <LevelBadge level={item.current_level} size="sm" />
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm text-slate-800 flex items-center gap-1 justify-end">
                    <Star className="w-3.5 h-3.5 text-amber-500" />{item.total_points || 0}
                  </p>
                  <p className="text-xs text-slate-400">{item.missions_completed || 0} missões</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}