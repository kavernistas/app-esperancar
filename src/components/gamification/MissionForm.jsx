import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const MISSION_TYPES = [
  { value: "register_supporters", label: "Cadastrar Apoiadores", points: 10 },
  { value: "visit_region", label: "Visitar Região", points: 20 },
  { value: "mobilize_meeting", label: "Mobilizar Reunião", points: 15 },
  { value: "collect_demands", label: "Coletar Demandas", points: 20 },
  { value: "confirm_attendance", label: "Confirmar Presença", points: 15 },
  { value: "share_content", label: "Compartilhar Conteúdo", points: 10 },
  { value: "organize_local_nucleus", label: "Organizar Núcleo Local", points: 25 },
  { value: "update_territorial_data", label: "Atualizar Dados Territoriais", points: 20 },
  { value: "forward_service", label: "Encaminhar Atendimento", points: 15 },
  { value: "other", label: "Outra", points: 30 },
];

export default function MissionForm({ open, onClose, onSubmit, leaders, preselectedLeader }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("");
  const [leaderId, setLeaderId] = useState(preselectedLeader || "");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState("medium");

  useEffect(() => {
    if (open) {
      setTitle("");
      setDescription("");
      setType("");
      setLeaderId(preselectedLeader || "");
      setNeighborhood("");
      setCity("");
      setDeadline("");
      setPriority("medium");
    }
  }, [open, preselectedLeader]);

  const selectedType = MISSION_TYPES.find((t) => t.value === type);
  const points = selectedType?.points || 30;

  const selectedLeader = leaderId ? leaders?.find((l) => l.id === leaderId) : null;

  const handleSubmit = () => {
    if (!title.trim() || !leaderId) return;
    onSubmit({
      title: title.trim(),
      description,
      type: type || "other",
      leader_id: leaderId,
      leader_name: selectedLeader?.name || "",
      neighborhood: neighborhood || selectedLeader?.neighborhood || "",
      city: city || selectedLeader?.city || "",
      deadline: deadline || null,
      priority,
      points,
      status: "pending",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova Missão</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Label>Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Visitar bairro Vila Linda" />
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detalhes da missão..." rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tipo</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>
                  {MISSION_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label} (+{t.points} pts)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Prioridade</Label>
              <Select value={priority} onValueChange={setPriority}>
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
          <div>
            <Label>Liderança</Label>
            <Select value={leaderId} onValueChange={setLeaderId}>
              <SelectTrigger><SelectValue placeholder="Escolher liderança" /></SelectTrigger>
              <SelectContent>
                {(leaders || []).map((l) => (
                  <SelectItem key={l.id} value={l.id}>{l.name} {l.neighborhood ? `(${l.neighborhood})` : ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Bairro</Label>
              <Input value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} placeholder="Bairro/Região" />
            </div>
            <div>
              <Label>Prazo</Label>
              <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center justify-between pt-2">
            <span className="text-sm text-amber-600 font-medium">⭐ +{points} pontos ao concluir</span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={!title.trim() || !leaderId}>Criar Missão</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}