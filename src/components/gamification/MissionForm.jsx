import { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
Users, MapPin, Tag, Send, X, Eye, Filter, Plus,
  ListChecks
} from "lucide-react";
import { normalizeList } from "@/lib/normalizeList";

const SEGMENTS = [
  "Juventude", "Mulheres", "Saúde", "Educação", "Cultura", "Esporte",
  "Religião", "Sindical", "Comerciantes", "Servidores públicos",
  "Lideranças comunitárias", "Influenciadores digitais",
];

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

const RECURRENCE_OPTIONS = [
  { value: "_none_", label: "Única" },
  { value: "daily", label: "Diária" },
  { value: "weekly", label: "Semanal" },
  { value: "biweekly", label: "Quinzenal" },
  { value: "monthly", label: "Mensal" },
];

export default function MissionForm({ open, onClose, onSubmit, leaders = [] }) {
  // Basic fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("");
  const [priority, setPriority] = useState("medium");
  const [deadline, setDeadline] = useState("");
  const [points, setPoints] = useState(30);
  const pointsManuallyEdited = useRef(false);

  // Assignment
  const [assignmentType, setAssignmentType] = useState("individual");
  const [selectedLeader, setSelectedLeader] = useState("");
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState([]);
  const [selectedSegments, setSelectedSegments] = useState([]);

  // Custom filters
  const [filterCity, setFilterCity] = useState("");
  const [filterNeighborhood, setFilterNeighborhood] = useState("");
  const [filterElectoralZone, setFilterElectoralZone] = useState("");
  const [filterMinEngagement, setFilterMinEngagement] = useState(0);
  const [filterMinPoints, setFilterMinPoints] = useState(0);
  const [filterMaxPending, setFilterMaxPending] = useState(999);

  // Recurrence
  const [recurrence, setRecurrence] = useState("");
  const [recurrenceDayOfWeek, setRecurrenceDayOfWeek] = useState(5);

  // WhatsApp
  const [sendWhatsapp, setSendWhatsapp] = useState(false);
  const [whatsappMessage, setWhatsappMessage] = useState("");
  const [sendReminder, setSendReminder] = useState(false);
  const [reminderDays, setReminderDays] = useState(1);
  const [sendOverdue, setSendOverdue] = useState(false);
  const [sendCongrats, setSendCongrats] = useState(false);

  // Checklist
  const [checklist, setChecklist] = useState([]);
  const [newCheckItem, setNewCheckItem] = useState("");

  // Preview
  const [showPreview, setShowPreview] = useState(false);

  const neighborhoods = useMemo(() =>
    [...new Set(normalizeList(leaders).map((l) => l.neighborhood).filter(Boolean))].sort(),
  [leaders]);

  // Filter leaders based on assignment type
  const previewRecipients = useMemo(() => {
    let filtered = normalizeList(leaders).filter((l) => (l.status || "").toUpperCase() === "ACTIVE");
    switch (assignmentType) {
      case "individual":
        return selectedLeader ? filtered.filter((l) => l.id === selectedLeader) : [];
      case "neighborhood_group":
        return selectedNeighborhoods.length > 0
          ? filtered.filter((l) => selectedNeighborhoods.includes(l.neighborhood))
          : [];
      case "segment_group":
        return selectedSegments.length > 0
          ? filtered.filter((l) => selectedSegments.includes(l.segment))
          : [];
      case "all":
        return filtered;
      case "custom_filters":
        if (filterCity) filtered = filtered.filter((l) => l.city === filterCity);
        if (filterNeighborhood) filtered = filtered.filter((l) => l.neighborhood === filterNeighborhood);
        if (filterElectoralZone) filtered = filtered.filter((l) => l.electoral_zone === filterElectoralZone);
        filtered = filtered.filter((l) => (l.supporters_count || 0) >= filterMinEngagement);
        return filtered;
      default:
        return [];
    }
  }, [assignmentType, selectedLeader, selectedNeighborhoods, selectedSegments, leaders, filterCity, filterNeighborhood, filterElectoralZone, filterMinEngagement]);

  const isGroupMode = ["neighborhood_group", "segment_group", "all", "custom_filters"].includes(assignmentType);

  const reset = () => {
    setTitle(""); setDescription(""); setType(""); setPriority("medium");
    setDeadline(""); setPoints(30); setAssignmentType("individual");
    setSelectedLeader(""); setSelectedNeighborhoods([]); setSelectedSegments([]);
    setFilterCity(""); setFilterNeighborhood(""); setFilterElectoralZone("");
    setFilterMinEngagement(0); setFilterMinPoints(0); setFilterMaxPending(999);
    setRecurrence(""); setSendWhatsapp(false); setWhatsappMessage("");
    setSendReminder(false); setReminderDays(1); setSendOverdue(false); setSendCongrats(false);
    setChecklist([]); setNewCheckItem(""); setShowPreview(false);
    pointsManuallyEdited.current = false;
  };

  useEffect(() => { if (open) reset(); }, [open]);

  useEffect(() => {
    if (pointsManuallyEdited.current) return;
    const sel = MISSION_TYPES.find((t) => t.value === type);
    if (sel) setPoints(sel.points);
  }, [type]);

  useEffect(() => {
    setWhatsappMessage(`Olá {{nome}}! 🌟 Nova missão no Esperançar:\n📌 {{titulo}}\n📍 {{bairro}}\n⏰ {{prazo}}\n⭐ {{pontos}} pontos\nAcesse: {{link_missao}}`);
  }, [open]);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    const baseData = {
      title: title.trim(),
      description,
      type: type || "other",
      priority,
      deadline: deadline || null,
      points,
      is_group_mission: isGroupMode,
      assignment_type: assignmentType,
      total_recipients: isGroupMode ? previewRecipients.length : 1,
      completed_recipients: 0,
      checklist,
      created_by_name: "Admin",
      history: [{ date: new Date().toISOString(), action: "Criação", user_name: "Admin", field: "all", old_value: "", new_value: "Missão criada", justification: "" }],
    };

    if (recurrence) {
      baseData.recurrence = { enabled: true, type: recurrence, day_of_week: recurrenceDayOfWeek, next_run: new Date().toISOString().split("T")[0] };
    }

    if (sendWhatsapp || sendReminder || sendOverdue || sendCongrats) {
      baseData.whatsapp_config = {
        send_immediately: sendWhatsapp,
        custom_message: whatsappMessage,
        send_reminder: sendReminder,
        reminder_days_before: reminderDays,
        send_overdue_alert: sendOverdue,
        send_congratulations: sendCongrats,
      };
    }

    baseData.assignment_filters = {};
    if (assignmentType === "neighborhood_group") baseData.assignment_filters.neighborhoods = selectedNeighborhoods;
    if (assignmentType === "segment_group") baseData.assignment_filters.segments = selectedSegments;

    await onSubmit(baseData, previewRecipients);
  };

  const toggleNeighborhood = (n) => {
    setSelectedNeighborhoods((prev) => prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]);
  };

  const toggleSegment = (s) => {
    setSelectedSegments((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  };

  const addCheckItem = () => {
    if (!newCheckItem.trim()) return;
    setChecklist([...checklist, { text: newCheckItem.trim(), done: false }]);
    setNewCheckItem("");
  };

  const removeCheckItem = (i) => setChecklist(checklist.filter((_, idx) => idx !== i));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Missão</DialogTitle>
          <DialogDescription>Crie missões individuais ou em grupo com filtros avançados</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Título e descrição */}
          <div className="grid gap-3">
            <div>
              <Label>Título *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Relatório territorial semanal" />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Detalhes..." />
            </div>
          </div>

          {/* Tipo, prioridade, pontos */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Tipo</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="text-sm"><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>
                  {MISSION_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Prioridade</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Pontos</Label>
              <Input type="number" value={points} onChange={(e) => { pointsManuallyEdited.current = true; setPoints(Number(e.target.value) || 30); }} className="text-sm" />
            </div>
          </div>

          {/* Prazo */}
          <div>
            <Label>Prazo</Label>
            <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>

          {/* Modo de atribuição */}
          <div>
            <Label className="text-base font-semibold">Modo de Atribuição</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
              {[
                { value: "individual", label: "Individual", icon: Users },
                { value: "neighborhood_group", label: "Grupo por Bairro", icon: MapPin },
                { value: "segment_group", label: "Grupo por Segmento", icon: Tag },
                { value: "all", label: "Todas as Lideranças", icon: Users },
                { value: "custom_filters", label: "Filtros Personalizados", icon: Filter },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { setAssignmentType(opt.value); setSelectedLeader(""); setSelectedNeighborhoods([]); setSelectedSegments([]); }}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 text-sm transition-all ${
                    assignmentType === opt.value
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <opt.icon className="w-5 h-5" />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Individual */}
          {assignmentType === "individual" && (
            <div>
              <Label>Liderança</Label>
              <Select value={selectedLeader} onValueChange={setSelectedLeader}>
                <SelectTrigger><SelectValue placeholder="Escolher liderança" /></SelectTrigger>
                <SelectContent>
                  {normalizeList(leaders).filter((l) => (l.status || "").toUpperCase() === "ACTIVE").map((l) => (
                    <SelectItem key={l.id} value={l.id}>{l.name} {l.neighborhood ? `(${l.neighborhood})` : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Bairro */}
          {assignmentType === "neighborhood_group" && (
            <div>
              <Label>Selecionar Bairros</Label>
              <div className="flex flex-wrap gap-1.5 mt-1 max-h-32 overflow-y-auto">
                {neighborhoods.map((n) => (
                  <Badge
                    key={n}
                    variant={selectedNeighborhoods.includes(n) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleNeighborhood(n)}
                  >
                    {n}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Segmento */}
          {assignmentType === "segment_group" && (
            <div>
              <Label>Selecionar Segmentos</Label>
              <div className="flex flex-wrap gap-1.5 mt-1 max-h-32 overflow-y-auto">
                {SEGMENTS.map((s) => (
                  <Badge
                    key={s}
                    variant={selectedSegments.includes(s) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleSegment(s)}
                  >
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Custom filters */}
          {assignmentType === "custom_filters" && (
            <div className="space-y-3 p-3 bg-slate-50 rounded-lg">
              <Label className="font-semibold">Filtros Personalizados</Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Cidade</Label>
                  <Input value={filterCity} onChange={(e) => setFilterCity(e.target.value)} placeholder="Cidade" className="text-sm h-8" />
                </div>
                <div>
                  <Label className="text-xs">Bairro</Label>
                  <Select value={filterNeighborhood || "_all_"} onValueChange={v => setFilterNeighborhood(v === "_all_" ? null : v)}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Todos" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_all_">Todos</SelectItem>
                      {neighborhoods.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Zona Eleitoral</Label>
                  <Input value={filterElectoralZone} onChange={(e) => setFilterElectoralZone(e.target.value)} placeholder="Zona" className="text-sm h-8" />
                </div>
                <div>
                  <Label className="text-xs">Apoiadores (mín.)</Label>
                  <Input type="number" value={filterMinEngagement} onChange={(e) => setFilterMinEngagement(Number(e.target.value))} className="text-sm h-8" />
                </div>
              </div>
            </div>
          )}

          {/* Total de destinatários */}
          {isGroupMode && (
            <div className="bg-blue-50 rounded-lg p-3 flex items-center justify-between">
              <span className="text-sm text-blue-700 flex items-center gap-2">
                <Users className="w-4 h-4" />
                {previewRecipients.length} liderança(s) selecionada(s)
              </span>
              <Button variant="ghost" size="sm" onClick={() => setShowPreview(!showPreview)} className="text-xs">
                <Eye className="w-3.5 h-3.5 mr-1" />{showPreview ? "Ocultar" : "Ver lista"}
              </Button>
            </div>
          )}

          {/* Preview list */}
          {showPreview && isGroupMode && (
            <div className="max-h-40 overflow-y-auto border rounded-lg p-2 space-y-1">
              {previewRecipients.map((l) => (
                <div key={l.id} className="flex items-center justify-between text-xs py-1 px-2 hover:bg-slate-50 rounded">
                  <span>{l.name}</span>
                  <span className="text-slate-400">{l.neighborhood}{l.segment ? ` · ${l.segment}` : ""}</span>
                </div>
              ))}
              {previewRecipients.length === 0 && <p className="text-center text-slate-400 py-2">Nenhuma liderança</p>}
            </div>
          )}

          {/* Recurrence */}
          <div>
            <Label>Recorrência</Label>
            <Select value={recurrence || "_none_"} onValueChange={v => setRecurrence(v === "_none_" ? "" : v)}>
              <SelectTrigger className="text-sm"><SelectValue placeholder="Única" /></SelectTrigger>
              <SelectContent>
                {RECURRENCE_OPTIONS.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
            {recurrence === "weekly" && (
              <div className="mt-2">
                <Label className="text-xs">Dia da semana</Label>
                <Select value={String(recurrenceDayOfWeek)} onValueChange={(v) => setRecurrenceDayOfWeek(Number(v))}>
                  <SelectTrigger className="text-sm h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"].map((d, i) => (
                      <SelectItem key={i} value={String(i)}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Checklist */}
          <div>
            <Label className="flex items-center gap-1"><ListChecks className="w-4 h-4" />Checklist</Label>
            <div className="flex gap-2 mt-1">
              <Input value={newCheckItem} onChange={(e) => setNewCheckItem(e.target.value)} placeholder="Novo item" className="text-sm" onKeyDown={(e) => e.key === "Enter" && addCheckItem()} />
              <Button size="sm" variant="outline" onClick={addCheckItem}><Plus className="w-4 h-4" /></Button>
            </div>
            {checklist.length > 0 && (
              <div className="space-y-1 mt-2">
                {checklist.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <Checkbox checked={item.done} disabled />
                    <span className="flex-1">{item.text}</span>
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => removeCheckItem(i)}><X className="w-3 h-3" /></Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* WhatsApp */}
          <div className="border rounded-lg p-4 space-y-3">
            <h4 className="font-semibold text-sm flex items-center gap-2"><Send className="w-4 h-4 text-emerald-600" />Configurações WhatsApp</h4>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Enviar WhatsApp imediatamente</Label>
              <Switch checked={sendWhatsapp} onCheckedChange={setSendWhatsapp} />
            </div>
            {(sendWhatsapp || sendReminder || sendCongrats) && (
              <div>
                <Label className="text-xs">Mensagem (use {"{{variavel}}"})</Label>
                <Textarea value={whatsappMessage} onChange={(e) => setWhatsappMessage(e.target.value)} rows={4} className="text-xs font-mono" />
                <p className="text-xs text-slate-400 mt-1">Variáveis: {"{{nome}} {{titulo}} {{bairro}} {{segmento}} {{prazo}} {{pontos}} {{link_missao}}"}</p>
              </div>
            )}
            <div className="flex items-center justify-between">
              <Label className="text-sm">Enviar lembrete antes do prazo</Label>
              <div className="flex items-center gap-2">
                {sendReminder && (
                  <Select value={String(reminderDays)} onValueChange={(v) => setReminderDays(Number(v))}>
                    <SelectTrigger className="w-20 h-7 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[1,2,3,5,7].map((d) => <SelectItem key={d} value={String(d)}>{d}d antes</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
                <Switch checked={sendReminder} onCheckedChange={setSendReminder} />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Alertar missões vencidas</Label>
              <Switch checked={sendOverdue} onCheckedChange={setSendOverdue} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Enviar parabéns ao concluir</Label>
              <Switch checked={sendCongrats} onCheckedChange={setSendCongrats} />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-2 border-t">
            <span className="text-sm text-amber-600 font-medium">⭐ +{points} pontos / missão</span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={!title.trim() || (assignmentType === "individual" && !selectedLeader) || (isGroupMode && previewRecipients.length === 0)} className="bg-blue-600 hover:bg-blue-700">
                Criar {isGroupMode ? `(${previewRecipients.length} dest.)` : "Missão"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}