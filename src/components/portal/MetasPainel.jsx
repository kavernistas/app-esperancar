import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Target, Plus, Trash2 } from "lucide-react";

export default function MetasPainel({ metas, onSave, onDelete }) {
  const [newMeta, setNewMeta] = useState({ type: "", target: "" });

  const types = [
    { key: "supporters", label: "Apoiadores por semana" },
    { key: "demands", label: "Demandas registradas" },
    { key: "missions", label: "Missões concluídas" },
    { key: "visits", label: "Visitas realizadas" },
    { key: "meetings", label: "Reuniões mobilizadas" },
    { key: "contacts", label: "Novos contatos" },
  ];

  const handleAdd = () => {
    if (!newMeta.type || !newMeta.target) return;
    onSave?.({ type: newMeta.type, target: parseInt(newMeta.target), progress: 0 });
    setNewMeta({ type: "", target: "" });
  };

  return (
    <div className="space-y-3">
      <Card className="border-slate-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="w-4 h-4 text-indigo-600" />
            Definir Nova Meta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <select
              value={newMeta.type}
              onChange={e => setNewMeta(p => ({ ...p, type: e.target.value }))}
              className="border border-slate-200 rounded-md px-2 py-1.5 text-xs flex-1 bg-white"
            >
              <option value="">Tipo de meta...</option>
              {types.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
            </select>
            <Input
              type="number"
              value={newMeta.target}
              onChange={e => setNewMeta(p => ({ ...p, target: e.target.value }))}
              placeholder="Meta"
              className="h-8 w-20 text-xs"
            />
            <Button size="sm" onClick={handleAdd} disabled={!newMeta.type || !newMeta.target} className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-3 h-3 mr-1" /> Adicionar
            </Button>
          </div>
        </CardContent>
      </Card>

      {(!metas || metas.length === 0) ? (
        <p className="text-center text-slate-400 py-4 text-sm">Nenhuma meta definida ainda.</p>
      ) : (
        <div className="space-y-2">
          {metas.map((m, i) => {
            const label = types.find(t => t.key === m.type)?.label || m.type;
            const pct = m.target > 0 ? Math.min(100, Math.round((m.progress / m.target) * 100)) : 0;
            return (
              <Card key={i} className="border-slate-200">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-sm font-medium text-slate-700">{label}</p>
                    <Button size="icon" variant="ghost" className="h-6 w-6 text-red-400" onClick={() => onDelete?.(i)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                    <span>Progresso</span>
                    <span>{m.progress || 0} / {m.target}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${pct >= 100 ? "bg-emerald-500" : pct >= 50 ? "bg-blue-500" : "bg-amber-500"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}