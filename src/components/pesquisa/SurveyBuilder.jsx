import { useState } from "react";
import { Plus, Trash2, ChevronUp, ChevronDown, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const QUESTION_TYPES = [
  { value: "multiple_choice", label: "Múltipla Escolha" },
  { value: "likert", label: "Escala Likert (1-5)" },
  { value: "scale", label: "Escala Numérica" },
  { value: "yes_no", label: "Sim/Não" },
  { value: "open", label: "Resposta Aberta" },
  { value: "audio", label: "Áudio (Qualitativa)" },
];

const SOCIO_AXES = [
  { value: "capital_cultural", label: "Capital Cultural" },
  { value: "religious", label: "Inserção Religiosa" },
  { value: "social_network", label: "Redes de Sociabilidade" },
  { value: "political_perception", label: "Percepção Política" },
  { value: "thematic_adherence", label: "Aderência Temática" },
  { value: "vote_intention", label: "Intenção de Voto" },
  { value: "demographic", label: "Demográfico" },
  { value: "sentiment", label: "Afetos Políticos" },
];

export default function SurveyBuilder({ survey, onSave, onCancel }) {
  const [form, setForm] = useState({
    title: survey?.title || "",
    description: survey?.description || "",
    status: survey?.status || "draft",
    type: survey?.type || "mixed",
    sampling_method: survey?.sampling_method || "stratified",
    target_sample_size: survey?.target_sample_size || 0,
    start_date: survey?.start_date || "",
    end_date: survey?.end_date || "",
    questions: survey?.questions || [],
  });

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const addQuestion = () => {
    const newQ = {
      id: `q${Date.now()}`,
      order: form.questions.length + 1,
      text: "",
      type: "multiple_choice",
      options: [],
      required: false,
      sociological_axis: "demographic",
      scale_min: 1,
      scale_max: 5,
      scale_labels: [],
      branch_logic: { conditions: [] },
    };
    update("questions", [...form.questions, newQ]);
  };

  const updateQuestion = (idx, field, value) => {
    const updated = [...form.questions];
    updated[idx] = { ...updated[idx], [field]: value };
    update("questions", updated);
  };

  const removeQuestion = (idx) => {
    update("questions", form.questions.filter((_, i) => i !== idx).map((q, i) => ({ ...q, order: i + 1 })));
  };

  const moveQuestion = (idx, dir) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= form.questions.length) return;
    const updated = [...form.questions];
    [updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]];
    update("questions", updated.map((q, i) => ({ ...q, order: i + 1 })));
  };

  const handleSubmit = () => {
    if (!form.title.trim()) { alert("Informe o título da pesquisa"); return; }
    onSave(form);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#0A2540]">{survey ? "Editar Pesquisa" : "Nova Pesquisa"}</h2>
        <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5 text-slate-400" /></button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Label>Título da Pesquisa *</Label>
          <Input value={form.title} onChange={e => update("title", e.target.value)} placeholder="Ex: Pesquisa de Intenção de Voto - Zona Sul" className="mt-1" />
        </div>
        <div className="md:col-span-2">
          <Label>Descrição Metodológica</Label>
          <Textarea value={form.description} onChange={e => update("description", e.target.value)} placeholder="Descreva a metodologia, objetivos e recortes sociológicos..." className="mt-1" rows={2} />
        </div>
        <div>
          <Label>Status</Label>
          <Select value={form.status} onValueChange={v => update("status", v)}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent className="z-[1100]">
              <SelectItem value="draft">Rascunho</SelectItem>
              <SelectItem value="active">Ativa</SelectItem>
              <SelectItem value="paused">Pausada</SelectItem>
              <SelectItem value="completed">Concluída</SelectItem>
              <SelectItem value="archived">Arquivada</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Tipo de Pesquisa</Label>
          <Select value={form.type} onValueChange={v => update("type", v)}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent className="z-[1100]">
              <SelectItem value="quantitative">Quantitativa</SelectItem>
              <SelectItem value="qualitative">Qualitativa</SelectItem>
              <SelectItem value="mixed">Mista</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Método de Amostragem</Label>
          <Select value={form.sampling_method} onValueChange={v => update("sampling_method", v)}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent className="z-[1100]">
              <SelectItem value="stratified">Estratificada</SelectItem>
              <SelectItem value="conglomerate">Por Conglomerados</SelectItem>
              <SelectItem value="convenience">Por Conveniência</SelectItem>
              <SelectItem value="random">Aleatória</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Amostra Alvo (n)</Label>
          <Input type="number" value={form.target_sample_size} onChange={e => update("target_sample_size", parseInt(e.target.value) || 0)} className="mt-1" />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[#0A2540]">Questionário Metodológico</h3>
          <Button size="sm" variant="outline" onClick={addQuestion}><Plus className="w-4 h-4 mr-1" /> Adicionar Pergunta</Button>
        </div>

        {form.questions.length === 0 && (
          <div className="text-center py-8 text-sm text-slate-400 bg-slate-50 rounded-xl">Nenhuma pergunta adicionada</div>
        )}

        <div className="space-y-3">
          {form.questions.map((q, idx) => (
            <div key={q.id} className="bg-slate-50/70 rounded-xl p-4 border border-slate-200/60">
              <div className="flex items-start gap-2 mb-3">
                <span className="text-xs font-bold text-slate-400 mt-2">Q{idx + 1}</span>
                <Input value={q.text} onChange={e => updateQuestion(idx, "text", e.target.value)} placeholder="Texto da pergunta..." className="flex-1" />
                <div className="flex flex-col gap-1">
                  <button onClick={() => moveQuestion(idx, -1)} className="p-1 hover:bg-slate-200 rounded"><ChevronUp className="w-3.5 h-3.5 text-slate-400" /></button>
                  <button onClick={() => moveQuestion(idx, 1)} className="p-1 hover:bg-slate-200 rounded"><ChevronDown className="w-3.5 h-3.5 text-slate-400" /></button>
                </div>
                <button onClick={() => removeQuestion(idx)} className="p-1.5 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4 text-red-400" /></button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Tipo</Label>
                  <Select value={q.type} onValueChange={v => updateQuestion(idx, "type", v)}>
                    <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent className="z-[1100]">{QUESTION_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Eixo Sociológico</Label>
                  <Select value={q.sociological_axis || "demographic"} onValueChange={v => updateQuestion(idx, "sociological_axis", v)}>
                    <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent className="z-[1100]">{SOCIO_AXES.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="flex items-end gap-2 pb-1">
                  <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                    <input type="checkbox" checked={q.required} onChange={e => updateQuestion(idx, "required", e.target.checked)} className="rounded" />
                    Obrigatória
                  </label>
                </div>
              </div>

              {(q.type === "multiple_choice" || q.type === "yes_no") && (
                <div className="mt-3">
                  <Label className="text-xs">Opções (uma por linha)</Label>
                  <Textarea
                    value={(q.options || []).join("\n")}
                    onChange={e => updateQuestion(idx, "options", e.target.value.split("\n").filter(Boolean))}
                    placeholder="Opção 1&#10;Opção 2&#10;Opção 3"
                    className="text-xs mt-1"
                    rows={3}
                  />
                </div>
              )}

              {q.type === "likert" && (
                <div className="mt-3 flex gap-4 items-center">
                  <Label className="text-xs">Escala: {q.scale_min || 1} a {q.scale_max || 5}</Label>
                  <input type="number" min="1" max="10" value={q.scale_min || 1} onChange={e => updateQuestion(idx, "scale_min", parseInt(e.target.value) || 1)} className="w-16 text-xs border rounded px-2 py-1" />
                  <span className="text-xs text-slate-400">até</span>
                  <input type="number" min="1" max="10" value={q.scale_max || 5} onChange={e => updateQuestion(idx, "scale_max", parseInt(e.target.value) || 5)} className="w-16 text-xs border rounded px-2 py-1" />
                </div>
              )}

              <div className="mt-3">
                <Label className="text-xs">Ramificação Lógica (opcional)</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    placeholder="Se resposta = X"
                    value={q.branch_logic?.conditions?.[0]?.if_answer || ""}
                    onChange={e => updateQuestion(idx, "branch_logic", { conditions: [{ if_answer: e.target.value, skip_to: q.branch_logic?.conditions?.[0]?.skip_to || "" }] })}
                    className="text-xs h-8"
                  />
                  <span className="text-xs text-slate-400 self-center">→ pular para</span>
                  <Select
                    value={q.branch_logic?.conditions?.[0]?.skip_to || "_none_"}
                    onValueChange={v => updateQuestion(idx, "branch_logic", { conditions: v === "_none_" ? [] : [{ if_answer: q.branch_logic?.conditions?.[0]?.if_answer || "", skip_to: v }] })}
                  >
                    <SelectTrigger className="h-8 text-xs flex-1"><SelectValue placeholder="Pergunta" /></SelectTrigger>
                    <SelectContent className="z-[1100]">
                      <SelectItem value="_none_">Nenhuma</SelectItem>
                      {form.questions.filter((_, i) => i !== idx).map((oq, i) => <SelectItem key={oq.id} value={oq.id}>Q{i < idx ? i + 1 : i + 2}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
        <Button variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button onClick={handleSubmit} className="bg-[#7AC943] hover:bg-[#5DA830]"><Save className="w-4 h-4 mr-1.5" /> Salvar Pesquisa</Button>
      </div>
    </div>
  );
}