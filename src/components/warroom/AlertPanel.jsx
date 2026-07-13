import React from "react";
import { AlertTriangle, Clock, Info } from "lucide-react";

function getAlertStyle(severity) {
  switch (severity) {
    case "critical":
      return { bg: "bg-red-50", border: "border-red-500", Icon: AlertTriangle, iconColor: "text-red-500" };
    case "warning":
      return { bg: "bg-amber-50", border: "border-amber-500", Icon: Clock, iconColor: "text-amber-500" };
    default:
      return { bg: "bg-blue-50", border: "border-blue-500", Icon: Info, iconColor: "text-blue-500" };
  }
}

export default function AlertPanel({ alerts = [] }) {
  if (alerts.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6">
        <h3 className="text-base font-semibold text-[#0A2540] mb-4 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" /> Alertas Operacionais
        </h3>
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-3">
            <Info className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-sm text-slate-400">Nenhum alerta no momento</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-[#0A2540] flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" /> Alertas Operacionais
        </h3>
        <span className="text-xs font-medium text-slate-400">{alerts.length} ativos</span>
      </div>
      <div className="space-y-3">
        {alerts.map((alert, i) => {
          const style = getAlertStyle(alert.severity);
          return (
            <div key={i} className={`p-3.5 rounded-xl border-l-4 ${style.bg} ${style.border} flex items-start gap-3`}>
              <style.Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${style.iconColor}`} />
              <div>
                <p className="font-semibold text-sm text-[#0A2540]">{alert.title}</p>
                <p className="text-xs text-slate-600 mt-0.5">{alert.message}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}