import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";

export default function OKRForm({ okr, onSave, onCancel }) {
  const [form, setForm] = useState({
    objective: "",
    period: "",
    deadline: "",
    status: "active",
    key_results: [{ title: "", target: 100, current: 0, unit: "" }],
  });

  useEffect(() => {
    if (okr) {
      setForm({
        objective: okr.objective || "",
        period: okr.period || "",
        deadline: okr.deadline || "",
        status: okr.status || "active",
        key_results: okr.key_results?.length ? okr.key_results : [{ title: "", target: 100, current: 0, unit: "" }],
      });
    }
  }, [okr]);

  const addKR = () => setForm(f => ({ ...f, key_results: [...f.key_results, { title: "", target: 100, current: 0, unit: "" }] }));
  const removeKR = (i) => setForm(f => ({ ...f, key_results: f.key_results.filter((_, idx) => idx !== i) }));
  const updateKR = (i, field, value) => setForm(f => ({
    ...f,
    key_results: f.key_results.map((kr, idx) => idx === i ? { ...kr, [field]: value } : kr),
  }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const krs = form.key_results.filter(kr => kr.title);
    const progress = krs.length > 0
      ? Math.min(100, Math.round(krs.reduce((sum, kr) => sum + (kr.target > 0 ? (kr.current / kr.target) * 100 : 0), 0) / krs.length))
      : 0;
    onSave({ ...form, key_results: krs, progress });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6">
      <h3 className="text-base font-semibold text-[#0A2540] mb-4">{okr ? "Editar OKR" : "Novo OKR"}</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label className="text-sm font-medium">Objetivo</Label>
          <Input value={form.objective} onChange={(e) => setForm({ ...form, objective: e.target.value })} placeholder="Ex: Atingir 20.000 contatos cadastrados" className="mt-1" required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium">Período</Label>
            <Input value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} placeholder="Ex: Q3 2026" className="mt-1" />
          </div>
          <div>
            <Label className="text-sm font-medium">Prazo</Label>
            <Input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className="mt-1" />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-sm font-medium">Resultados-Chave</Label>
            <button type="button" onClick={addKR} className="text-xs text-[#7AC943] font-medium flex items-center gap-1 hover:text-[#5DA830]">
              <Plus className="w-3 h-3" /> Adicionar
            </button>
          </div>
          <div className="space-y-2">
            {form.key_results.map((kr, i) => (
              <div key={i} className="flex gap-2 items-start">
                <Input value={kr.title} onChange={(e) => updateKR(i, "title", e.target.value)} placeholder="Resultado-chave" className="flex-1" />
                <Input type="number" value={kr.current} onChange={(e) => updateKR(i, "current", Number(e.target.value))} placeholder="Atual" className="w-24" />
                <Input type="number" value={kr.target} onChange={(e) => updateKR(i, "target", Number(e.target.value))} placeholder="Meta" className="w-24" />
                <Input value={kr.unit} onChange={(e) => updateKR(i, "unit", e.target.value)} placeholder="Unid." className="w-20" />
                <button type="button" onClick={() => removeKR(i)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="submit" className="bg-[#7AC943] hover:bg-[#5DA830]">{okr ? "Salvar" : "Criar OKR"}</Button>
          <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        </div>
      </form>
    </div>
  );
}