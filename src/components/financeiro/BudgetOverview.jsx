import React from "react";
import { Wallet, TrendingDown, TrendingUp } from "lucide-react";

export default function BudgetOverview({ budget, spent, remaining }) {
  const pct = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5">
        <div className="flex items-center justify-between mb-2">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-blue-600" />
          </div>
        </div>
        <p className="text-sm text-slate-500">Orçamento Total</p>
        <p className="text-2xl font-bold text-[#0A2540]">R$ {budget.toLocaleString("pt-BR")}</p>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5">
        <div className="flex items-center justify-between mb-2">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
            <TrendingDown className="w-5 h-5 text-red-600" />
          </div>
          <span className="text-xs font-medium text-red-500">{pct.toFixed(0)}%</span>
        </div>
        <p className="text-sm text-slate-500">Gasto</p>
        <p className="text-2xl font-bold text-[#0A2540]">R$ {spent.toLocaleString("pt-BR")}</p>
        <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
          <div className="bg-red-400 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5">
        <div className="flex items-center justify-between mb-2">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
        </div>
        <p className="text-sm text-slate-500">Disponível</p>
        <p className="text-2xl font-bold text-[#0A2540]">R$ {remaining.toLocaleString("pt-BR")}</p>
      </div>
    </div>
  );
}