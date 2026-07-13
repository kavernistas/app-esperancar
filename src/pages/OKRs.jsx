import React, { useState, useEffect, useCallback } from "react";
import { listOkrs, createOkr, updateOkr, deleteOkr } from "@/api/okrs";
import { normalizeList } from "@/lib/normalizeList";
import { Plus, Target } from "lucide-react";
import OKRCard from "@/components/okrs/OKRCard";
import OKRForm from "@/components/okrs/OKRForm";

export default function OKRs() {
  const [loading, setLoading] = useState(true);
  const [okrs, setOkrs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingOKR, setEditingOKR] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listOkrs({ limit: 100 }).catch(() => []);
      setOkrs(normalizeList(data));
    } catch (e) {}
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSave = async (data) => {
    if (editingOKR) {
      await updateOkr(editingOKR.id, data);
    } else {
      await createOkr(data);
    }
    setShowForm(false);
    setEditingOKR(null);
    loadData();
  };

  const handleDelete = async (id) => {
    if (!confirm("Excluir este OKR?")) return;
    await deleteOkr(id);
    loadData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-[#7AC943] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0A2540]">OKRs Estratégicos</h1>
          <p className="text-sm text-slate-500">Objetivos e Resultados-Chave da campanha</p>
        </div>
        <button
          onClick={() => { setEditingOKR(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-[#7AC943] text-white rounded-xl hover:bg-[#5DA830] transition font-medium text-sm"
        >
          <Plus className="w-4 h-4" /> Novo OKR
        </button>
      </div>

      {showForm && (
        <OKRForm okr={editingOKR} onSave={handleSave} onCancel={() => { setShowForm(false); setEditingOKR(null); }} />
      )}

      {okrs.length === 0 && !showForm ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Target className="w-7 h-7 text-slate-300" />
          </div>
          <p className="text-sm text-slate-400">Nenhum OKR cadastrado ainda</p>
          <p className="text-xs text-slate-400 mt-1">Crie seu primeiro objetivo estratégico</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {okrs.map(okr => (
            <OKRCard key={okr.id} okr={okr} onEdit={(o) => { setEditingOKR(o); setShowForm(true); }} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}