import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, AlertTriangle, Star, MapPin } from "lucide-react";

export default function PainelCoordenador({ equipe }) {
  if (!equipe || equipe.length === 0) {
    return <p className="text-center text-slate-400 py-8 text-sm">Nenhuma liderança na sua equipe ainda.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <Card className="border-slate-200">
          <CardContent className="p-3 text-center">
            <Users className="w-5 h-5 text-blue-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-slate-800">{equipe.length}</p>
            <p className="text-[10px] text-slate-500">Lideranças</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-3 text-center">
            <AlertTriangle className="w-5 h-5 text-red-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-slate-800">
              {equipe.filter(l => (l.lastActivityDays || 999) > 7).length}
            </p>
            <p className="text-[10px] text-slate-500">Baixa Atividade</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-2">
        {equipe.map((l, i) => (
          <Card key={i} className="border-slate-200">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-semibold text-sm text-slate-800">{l.name || "Sem nome"}</p>
                  {l.neighborhood && (
                    <p className="text-[10px] text-slate-400 flex items-center gap-0.5">
                      <MapPin className="w-3 h-3" />{l.neighborhood}
                    </p>
                  )}
                </div>
                <Badge className={`text-[10px] ${l.lastActivityDays > 7 ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
                  {l.lastActivityDays > 7 ? `${l.lastActivityDays}d inativo` : "Ativo"}
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-sm font-bold text-slate-800">{l.supporters || 0}</p>
                  <p className="text-[9px] text-slate-400">Apoiadores</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">{l.openDemands || 0}</p>
                  <p className="text-[9px] text-slate-400">Demandas</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">{l.pendingMissions || 0}</p>
                  <p className="text-[9px] text-slate-400">Missões</p>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-0.5"><Star className="w-3 h-3 text-amber-500" />{l.points || 0} pts</span>
                <span>#{l.rank || "-"}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}