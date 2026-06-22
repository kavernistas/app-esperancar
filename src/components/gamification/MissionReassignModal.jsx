import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Users, MapPin, Tag } from "lucide-react";

export default function MissionReassignModal({ open, onClose, mission, leaders, onReassign }) {
  const [mode, setMode] = useState("individual");
  const [targetLeader, setTargetLeader] = useState("");
  const [targetNeighborhoods, setTargetNeighborhoods] = useState([]);
  const [targetSegments, setTargetSegments] = useState([]);

  const SEGMENTS = ["Juventude","Mulheres","Saúde","Educação","Cultura","Esporte","Religião","Sindical","Comerciantes","Servidores públicos","Lideranças comunitárias","Influenciadores digitais"];
  const neighborhoods = [...new Set(leaders.map((l) => l.neighborhood).filter(Boolean))].sort();

  useEffect(() => {
    if (open) {
      setMode("individual");
      setTargetLeader("");
      setTargetNeighborhoods([]);
      setTargetSegments([]);
    }
  }, [open]);

  const getTargetLeaders = () => {
    switch (mode) {
      case "individual": return targetLeader ? [targetLeader] : [];
      case "neighborhood_group": return leaders.filter((l) => targetNeighborhoods.includes(l.neighborhood)).map((l) => l.id);
      case "segment_group": return leaders.filter((l) => targetSegments.includes(l.segment)).map((l) => l.id);
      case "all": return leaders.filter((l) => l.status === "active").map((l) => l.id);
      default: return [];
    }
  };

  const handleReassign = () => {
    const targets = getTargetLeaders();
    if (targets.length === 0) return;
    onReassign(mission.id, { mode, leader_ids: targets });
  };

  const toggleNeighborhood = (n) => setTargetNeighborhoods((prev) => prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]);
  const toggleSegment = (s) => setTargetSegments((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><UserPlus className="w-5 h-5" />Reatribuir Missão</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: "individual", label: "Individual", icon: Users },
              { value: "neighborhood_group", label: "Por Bairro", icon: MapPin },
              { value: "segment_group", label: "Por Segmento", icon: Tag },
              { value: "all", label: "Todas", icon: Users },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setMode(opt.value)}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 text-xs transition-all ${
                  mode === opt.value ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200"
                }`}
              >
                <opt.icon className="w-4 h-4" />{opt.label}
              </button>
            ))}
          </div>

          {mode === "individual" && (
            <div>
              <Label>Nova liderança</Label>
              <Select value={targetLeader} onValueChange={setTargetLeader}>
                <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>
                  {leaders.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          {mode === "neighborhood_group" && (
            <div>
              <Label>Bairros</Label>
              <div className="flex flex-wrap gap-1 mt-1 max-h-24 overflow-y-auto">
                {neighborhoods.map((n) => (
                  <Badge key={n} variant={targetNeighborhoods.includes(n) ? "default" : "outline"} className="cursor-pointer text-xs" onClick={() => toggleNeighborhood(n)}>{n}</Badge>
                ))}
              </div>
            </div>
          )}
          {mode === "segment_group" && (
            <div>
              <Label>Segmentos</Label>
              <div className="flex flex-wrap gap-1 mt-1 max-h-24 overflow-y-auto">
                {SEGMENTS.map((s) => (
                  <Badge key={s} variant={targetSegments.includes(s) ? "default" : "outline"} className="cursor-pointer text-xs" onClick={() => toggleSegment(s)}>{s}</Badge>
                ))}
              </div>
            </div>
          )}

          <div className="text-sm text-slate-600 bg-blue-50 rounded-lg p-3">
            {getTargetLeaders().length} liderança(s) receberão esta missão.
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleReassign} disabled={getTargetLeaders().length === 0} className="bg-blue-600 hover:bg-blue-700">Reatribuir</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}