import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const CATEGORIES = [
  { value: "material", label: "Material Gráfico" },
  { value: "eventos", label: "Eventos" },
  { value: "digital", label: "Digital/Mídia" },
  { value: "equipe", label: "Equipe" },
  { value: "logistica", label: "Logística" },
  { value: "outros", label: "Outros" },
];

export default function ExpenseForm({ expense, campaigns, onSave, onCancel }) {
  const [form, setForm] = useState({
    category: "outros",
    description: "",
    amount: 0,
    date: new Date().toISOString().split("T")[0],
    supplier: "",
    notes: "",
  });

  useEffect(() => {
    if (expense) {
      setForm({
        category: expense.category || "outros",
        description: expense.description || "",
        amount: expense.amount || 0,
        date: expense.date || new Date().toISOString().split("T")[0],
        supplier: expense.supplier || "",
        notes: expense.notes || "",
      });
    }
  }, [expense]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form, amount: Number(form.amount) });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6">
      <h3 className="text-base font-semibold text-[#0A2540] mb-4">
        {expense ? "Editar Despesa" : "Nova Despesa"}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium">Categoria</Label>
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm font-medium">Valor (R$)</Label>
            <Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="mt-1" required />
          </div>
          <div>
            <Label className="text-sm font-medium">Data</Label>
            <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="mt-1" required />
          </div>
          <div>
            <Label className="text-sm font-medium">Fornecedor</Label>
            <Input type="text" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} className="mt-1" />
          </div>
        </div>
        <div>
          <Label className="text-sm font-medium">Descrição</Label>
          <Input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1" required />
        </div>
        <div>
          <Label className="text-sm font-medium">Observações</Label>
          <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="mt-1" rows={2} />
        </div>
        <div className="flex gap-2">
          <Button type="submit" className="bg-[#7AC943] hover:bg-[#5DA830]">{expense ? "Salvar" : "Cadastrar"}</Button>
          <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        </div>
      </form>
    </div>
  );
}