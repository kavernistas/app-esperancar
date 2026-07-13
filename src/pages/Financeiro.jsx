import React, { useState, useEffect, useCallback } from "react";
import { listExpenses, createExpense, updateExpense, deleteExpense } from "@/api/expenses";
import { listCampaigns } from "@/api/campaigns";
import { normalizeList } from "@/lib/normalizeList";
import { Plus, Pencil, Trash2 } from "lucide-react";
import ExpenseForm from "@/components/financeiro/ExpenseForm";
import BudgetOverview from "@/components/financeiro/BudgetOverview";
import ExpenseChart from "@/components/financeiro/ExpenseChart";

const CATEGORY_LABELS = {
  material: "Material", eventos: "Eventos", digital: "Digital",
  equipe: "Equipe", logistica: "Logística", outros: "Outros",
};
const CATEGORY_COLORS = {
  material: "bg-blue-400", eventos: "bg-purple-400", digital: "bg-pink-400",
  equipe: "bg-red-400", logistica: "bg-green-400", outros: "bg-amber-400",
};

export default function Financeiro() {
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [expRes, campRes] = await Promise.all([
        listExpenses({ limit: 500 }).catch(() => []),
        listCampaigns({ limit: 50 }).catch(() => []),
      ]);
      setExpenses(normalizeList(expRes));
      setCampaigns(normalizeList(campRes));
    } catch (e) {}
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSave = async (data) => {
    if (editingExpense) {
      await updateExpense(editingExpense.id, data);
    } else {
      await createExpense(data);
    }
    setShowForm(false);
    setEditingExpense(null);
    loadData();
  };

  const handleDelete = async (id) => {
    if (!confirm("Excluir esta despesa?")) return;
    await deleteExpense(id);
    loadData();
  };

  const totalBudget = campaigns.reduce((sum, c) => sum + (c.budget || 0), 0);
  const totalSpent = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const remaining = totalBudget - totalSpent;

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
          <h1 className="text-2xl font-bold text-[#0A2540]">Financeiro</h1>
          <p className="text-sm text-slate-500">Controle de orçamento e despesas da campanha</p>
        </div>
        <button
          onClick={() => { setEditingExpense(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-[#7AC943] text-white rounded-xl hover:bg-[#5DA830] transition font-medium text-sm"
        >
          <Plus className="w-4 h-4" /> Nova Despesa
        </button>
      </div>

      <BudgetOverview budget={totalBudget} spent={totalSpent} remaining={remaining} />

      {showForm && (
        <ExpenseForm
          expense={editingExpense}
          campaigns={campaigns}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditingExpense(null); }}
        />
      )}

      <ExpenseChart expenses={expenses} />

      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-base font-semibold text-[#0A2540]">Despesas Registradas</h3>
        </div>
        {expenses.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-400">Nenhuma despesa cadastrada</div>
        ) : (
          <div className="divide-y divide-slate-50">
            {expenses.map(exp => (
              <div key={exp.id} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 transition">
                <div className={`w-2 h-10 rounded-full ${CATEGORY_COLORS[exp.category] || "bg-slate-300"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#0A2540] truncate">{exp.description}</p>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                    <span>{CATEGORY_LABELS[exp.category] || exp.category}</span>
                    {exp.supplier && <span>• {exp.supplier}</span>}
                    {exp.date && <span>• {new Date(exp.date).toLocaleDateString("pt-BR")}</span>}
                  </div>
                </div>
                <span className="text-sm font-semibold text-red-500 whitespace-nowrap">R$ {(exp.amount || 0).toLocaleString("pt-BR")}</span>
                <div className="flex gap-1">
                  <button onClick={() => { setEditingExpense(exp); setShowForm(true); }} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(exp.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}