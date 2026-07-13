import React from "react";
import { cn } from "@/lib/utils";

const COLOR_MAP = {
  blue: "bg-blue-50 text-blue-600",
  green: "bg-green-50 text-green-600",
  purple: "bg-purple-50 text-purple-600",
  red: "bg-red-50 text-red-600",
  yellow: "bg-amber-50 text-amber-600",
};

export default function KpiCard({ label, value, change, icon: Icon, color = "blue", subtitle }) {
  const isNegative = change && change.startsWith("-");

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 hover:shadow-lg hover:shadow-slate-200/30 transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center", COLOR_MAP[color] || COLOR_MAP.blue)}>
          <Icon className="w-5 h-5" />
        </div>
        {change && (
          <span className={cn("text-xs font-semibold", isNegative ? "text-red-500" : "text-green-500")}>
            {change}
          </span>
        )}
      </div>
      <p className="text-sm text-slate-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-[#0A2540]">{value}</p>
      {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
    </div>
  );
}