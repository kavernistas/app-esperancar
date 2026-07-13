import React, { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

const COLORS = ["#3B82F6", "#8B5CF6", "#EC4899", "#EF4444", "#10B981", "#F59E0B"];
const CATEGORY_LABELS = {
  material: "Material", eventos: "Eventos", digital: "Digital",
  equipe: "Equipe", logistica: "Logística", outros: "Outros",
};

export default function ExpenseChart({ expenses }) {
  const data = useMemo(() => {
    const byCategory = {};
    expenses.forEach(e => {
      const cat = e.category || "outros";
      byCategory[cat] = (byCategory[cat] || 0) + (e.amount || 0);
    });
    return Object.entries(byCategory).map(([key, value]) => ({
      name: CATEGORY_LABELS[key] || key,
      value,
    }));
  }, [expenses]);

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6">
        <h3 className="text-base font-semibold text-[#0A2540] mb-4">Despesas por Categoria</h3>
        <div className="text-center py-10 text-sm text-slate-400">Nenhuma despesa cadastrada</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6">
      <h3 className="text-base font-semibold text-[#0A2540] mb-4">Despesas por Categoria</h3>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip formatter={(v) => `R$ ${Number(v).toLocaleString("pt-BR")}`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}