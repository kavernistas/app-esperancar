import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, MapPin, TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function FidelityIndicator({ data, ano }) {
  // Group by zone and calculate concentration (redutos / zonas de risco)
  const byZone = data.reduce((acc, c) => {
    const key = `${c.nm_municipio || "—"} · Zona ${c.nr_zona || "—"}`;
    if (!acc[key]) acc[key] = { zone: key, municipio: c.nm_municipio, zona: c.nr_zona, votes: 0, count: 0 };
    acc[key].votes += c.qt_votos_nominais || 0;
    acc[key].count += 1;
    return acc;
  }, {});

  const zones = Object.values(byZone).sort((a, b) => b.votes - a.votes);
  const totalVotes = zones.reduce((s, z) => s + z.votes, 0);

  // Classify zones
  const classified = zones.map((z) => {
    const pct = totalVotes > 0 ? (z.votes / totalVotes) * 100 : 0;
    let type = "neutro";
    if (pct >= 10) type = "reduto"; // Strong base
    else if (pct < 3 && zones.length > 3) type = "risco"; // Weak zone
    return { ...z, pct, type };
  });

  const redutos = classified.filter((z) => z.type === "reduto");
  const risco = classified.filter((z) => z.type === "risco");
  const neutros = classified.filter((z) => z.type === "neutro");

  const typeConfig = {
    reduto: { label: "Reduto Eleitoral", color: "bg-green-100 text-green-800 border-green-200", icon: Heart, dot: "bg-green-500" },
    risco: { label: "Zona de Risco", color: "bg-red-100 text-red-800 border-red-200", icon: TrendingDown, dot: "bg-red-500" },
    neutro: { label: "Zona Neutra", color: "bg-slate-100 text-slate-700 border-slate-200", icon: Minus, dot: "bg-slate-400" },
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-500" />
            Indicador de Fidelidade por Zona
          </CardTitle>
          <div className="flex gap-2">
            <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
              {redutos.length} redutos
            </Badge>
            {risco.length > 0 && (
              <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">
                {risco.length} em risco
              </Badge>
            )}
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Reduto: zona com ≥10% dos votos totais · Risco: zona com &lt;3% dos votos
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {classified.slice(0, 15).map((zone, i) => {
            const cfg = typeConfig[zone.type];
            const Icon = cfg.icon;
            return (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-800 truncate">{zone.zone}</span>
                    <Badge className={`${cfg.color} text-xs py-0 flex-shrink-0`}>
                      <Icon className="w-2.5 h-2.5 mr-1" />
                      {cfg.label}
                    </Badge>
                  </div>
                  <div className="mt-1.5 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${zone.type === "reduto" ? "bg-green-500" : zone.type === "risco" ? "bg-red-400" : "bg-slate-400"}`}
                      style={{ width: `${Math.min(zone.pct * 3, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-slate-900">{zone.votes.toLocaleString("pt-BR")}</p>
                  <p className="text-xs text-slate-500">{zone.pct.toFixed(1)}%</p>
                </div>
              </div>
            );
          })}
          {classified.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-6">Nenhuma zona identificada</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}