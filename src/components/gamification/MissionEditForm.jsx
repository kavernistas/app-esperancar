import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Lock } from "lucide-react";
import moment from "moment";

const RULES = {
  pending: { canEditAll: true, label: "Pode editar tudo" },
  in_progress: { canEditAll: false, editableFields: ["deadline","description","priority","checklist","evidence","attachments"], label: "Edição limitada" },
  completed: { canEditAll: false, editableFields: [], label: "Bloqueada — apenas observação" },
  overdue: { canEditAll: false, editableFields: ["deadline","description","priority"], label: "Edição limitada" },
  cancelled: { canEditAll: false, editableFields: [], label: "Bloqueada" },
};

export default function MissionEditForm({ open, onClose, mission, onSave, leaders = [] }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("");
  const [priority, setPriority] = useState("medium");
  const [deadline, setDeadline] = useState("");
  const [points, setPoints] = useState(30);
  const [leaderId, setLeaderId] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [justification, setJustification] = useState("");
  const [adminNote, setAdminNote] = useState("");

  const rule = mission ? (RULES[mission.status] || RULES.pending) : RULES.pending;
  const isLocked = mission?.status === "completed" || mission?.status === "cancelled";

  useEffect(() => {
    if (open && mission) {
      setTitle(mission.title || "");
      setDescription(mission.description || "");
      setType(mission.type || "");
      setPriority(mission.priority || "medium");
      setDeadline(mission.deadline || "");
      setPoints(mission.points || 30);
      setLeaderId(mission.leader_id || "");
      setNeighborhood(mission.neighborhood || "");
      setJustification("");
      setAdminNote("");
    }
  }, [open, mission]);

  const canEdit = (field) => rule.canEditAll || (rule.editableFields || []).includes(field);

  const handleSave = () => {
    if (!mission) return;
    const changes = {};
    const historyEntries = [];

    const track = (field, oldVal, newVal, requiredJustification = false) => {
      if (String(oldVal) !== String(newVal)) {
        changes[field] = newVal;
        historyEntries.push({
          date: new Date().toISOString(),
          action: "Edição",
          user_name: "Admin",
          field,
          old_value: String(oldVal || ""),
          new_value: String(newVal || ""),
          justification: requiredJustification ? justification : "",
        });
      }
    };

    if (canEdit("title")) track("title", mission.title, title);
    if (canEdit("description")) track("description", mission.description, description);
    if (canEdit("type")) track("type", mission.type, type);
    if (canEdit("priority")) track("priority", mission.priority, priority);
    if (canEdit("deadline")) track("deadline", mission.deadline, deadline);
    if (canEdit("points")) track("points", String(mission.points), String(points));
    if (canEdit("leader_id")) track("leader_id", mission.leader_id, leaderId, true);

    if (isLocked && adminNote.trim()) {
      changes.admin_note = adminNote.trim();
      historyEntries.push({
        date: new Date().toISOString(),
        action: "Observação administrativa",
        user_name: "Admin",
        field: "admin_note",
        old_value: "",
        new_value: adminNote.trim(),
        justification: "",
      });
    }

    if (historyEntries.length > 0) {
      onSave(mission.id, changes, historyEntries);
    }
    onClose();
  };

  if (!mission) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Missão</DialogTitle>
        </DialogHeader>

        {isLocked && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2 text-sm text-amber-800">
            <Lock className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Missão {mission.status === "completed" ? "concluída" : "cancelada"} — edição bloqueada</p>
              <p className="text-xs text-amber-600 mt-0.5">Apenas observações administrativas são permitidas.</p>
            </div>
          </div>
        )}

        {!rule.canEditAll && !isLocked && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2 text-sm text-blue-800">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Modo de edição restrito</p>
              <p className="text-xs text-blue-600 mt-0.5">{rule.label}. Apenas campos essenciais podem ser alterados.</p>
            </div>
          </div>
        )}

        <div className="space-y-4 mt-2">
          <div>
            <Label>Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} disabled={!canEdit("title")} />
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} disabled={!canEdit("description")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tipo</Label>
              <Select value={type} onValueChange={setType} disabled={!canEdit("type")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="register_supporters">Cadastrar Apoiadores</SelectItem>
                  <SelectItem value="visit_region">Visitar Região</SelectItem>
                  <SelectItem value="mobilize_meeting">Mobilizar Reunião</SelectItem>
                  <SelectItem value="collect_demands">Coletar Demandas</SelectItem>
                  <SelectItem value="other">Outra</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Prioridade</Label>
              <Select value={priority} onValueChange={setPriority} disabled={!canEdit("priority")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Prazo</Label>
              <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} disabled={!canEdit("deadline")} />
            </div>
            <div>
              <Label>Pontos</Label>
              <Input type="number" value={points} onChange={(e) => setPoints(Number(e.target.value))} disabled={!canEdit("points")} />
            </div>
          </div>
          <div>
            <Label>Liderança</Label>
            <Select value={leaderId} onValueChange={setLeaderId} disabled={!canEdit("leader_id")}>
              <SelectTrigger><SelectValue placeholder="Reatribuir" /></SelectTrigger>
              <SelectContent>
                {leaders.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {(canEdit("leader_id") && leaderId !== mission.leader_id) && (
            <div>
              <Label>Justificativa da reatribuição</Label>
              <Input value={justification} onChange={(e) => setJustification(e.target.value)} placeholder="Motivo da troca de responsável" />
            </div>
          )}

          {isLocked && (
            <div>
              <Label>Observação administrativa</Label>
              <Textarea value={adminNote} onChange={(e) => setAdminNote(e.target.value)} rows={2} placeholder="Nota interna sobre esta missão..." />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!canEdit("title") && !canEdit("description") && !adminNote.trim()}>
              Salvar Alterações
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}