import React from "react";
import { Target, Calendar, Pencil, Trash2, CheckCircle2 } from "lucide-react";

export default function OKRCard({ okr, onEdit, onDelete }) {
  const progress = okr.progress || 0;
  const isCompleted = okr.status === "completed" || progress >= 100;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isCompleted ? "bg-green-50" : "bg-[#7AC943]/10"}`}>
            {isCompleted ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Target className="w-5 h-5 text-[#7AC943]" />}
          </div>
          <div>
            <h3 className="font-semibold text-sm text-[#0A2540]">{okr.objective}</h3>
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
              {okr.period && <span>{okr.period}</span>}
              {okr.deadline && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(okr.deadline).toLocaleDateString("pt-BR")}</span>}
            </div>
          </div>
        </div>
        <div className="flex gap-1">
          <button onClick={() => onEdit(okr)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition">
            <Pencil className="w-4 h-4" />
          </button>
          <button onClick={() => onDelete(okr.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-slate-500">Progresso geral</span>
          <span className="text-xs font-semibold text-[#0A2540]">{progress}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2">
          <div className={`h-2 rounded-full transition-all ${isCompleted ? "bg-green-500" : "bg-[#7AC943]"}`} style={{ width: `${progress}%` }} />
        </div>
      </div>

      {okr.key_results && okr.key_results.length > 0 && (
        <div className="space-y-2 mt-3 pt-3 border-t border-slate-100">
          {okr.key_results.map((kr, i) => {
            const krProgress = kr.target > 0 ? Math.min(100, (kr.current / kr.target) * 100) : 0;
            return (
              <div key={i} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-600 truncate">{kr.title}</p>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1">
                    <div className="bg-blue-400 h-1.5 rounded-full transition-all" style={{ width: `${krProgress}%` }} />
                  </div>
                </div>
                <span className="text-xs font-medium text-slate-500 whitespace-nowrap">
                  {kr.current}/{kr.target} {kr.unit}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}