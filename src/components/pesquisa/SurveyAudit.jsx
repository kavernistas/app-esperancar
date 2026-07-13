import { ShieldCheck, AlertTriangle, Clock, MapPin, CheckCircle, XCircle } from "lucide-react";

const STATUS_CONFIG = {
  synced: { label: "Sincronizada", color: "text-blue-500", bg: "bg-blue-50" },
  pending_sync: { label: "Pendente", color: "text-amber-500", bg: "bg-amber-50" },
  flagged: { label: "Flagged", color: "text-red-500", bg: "bg-red-50" },
  approved: { label: "Aprovada", color: "text-[#7AC943]", bg: "bg-[#7AC943]/10" },
  rejected: { label: "Rejeitada", color: "text-slate-500", bg: "bg-slate-100" },
};

export default function SurveyAudit({ responses, onAuditAction }) {
  if (responses.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
        <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-sm text-slate-400">Nenhuma resposta para auditoria</p>
      </div>
    );
  }

  // Sort: flagged first, then pending, then by duration ascending
  const sorted = [...responses].sort((a, b) => {
    const aFlagged = (a.quality_flags?.length > 0 || a.status === "flagged") ? 0 : 1;
    const bFlagged = (b.quality_flags?.length > 0 || b.status === "flagged") ? 0 : 1;
    if (aFlagged !== bFlagged) return aFlagged - bFlagged;
    return (a.duration_seconds || 0) - (b.duration_seconds || 0);
  });

  const flaggedCount = responses.filter(r => r.quality_flags?.length > 0 || r.status === "flagged").length;
  const avgDuration = responses.length > 0
    ? Math.round(responses.reduce((sum, r) => sum + (r.duration_seconds || 0), 0) / responses.length)
    : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-slate-200/80 p-3">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-xs text-slate-400">Suspeitas</span>
          </div>
          <p className="text-xl font-bold text-[#0A2540]">{flaggedCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200/80 p-3">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-400">Duração média</span>
          </div>
          <p className="text-xl font-bold text-[#0A2540]">{Math.floor(avgDuration / 60)}m {avgDuration % 60}s</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200/80 p-3">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-[#7AC943]" />
            <span className="text-xs text-slate-400">Aprovadas</span>
          </div>
          <p className="text-xl font-bold text-[#0A2540]">{responses.filter(r => r.status === "approved").length}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-base font-semibold text-[#0A2540]">Controle de Qualidade</h3>
          <p className="text-xs text-slate-400 mt-0.5">Auditoria de consistência, geolocalização e tempo de aplicação</p>
        </div>
        <div className="divide-y divide-slate-50 max-h-[600px] overflow-y-auto">
          {sorted.map(r => {
            const isFlagged = r.quality_flags?.length > 0 || r.status === "flagged";
            const statusCfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.synced;
            const duration = r.duration_seconds || 0;
            const minExpected = (r.responses?.length || 0) * 8;
            const isFast = duration < minExpected && duration > 0;

            return (
              <div key={r.id} className="px-5 py-3 hover:bg-slate-50 transition">
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${statusCfg.bg}`}>
                    {isFlagged ? <AlertTriangle className="w-4 h-4 text-red-500" /> : <CheckCircle className={`w-4 h-4 ${statusCfg.color}`} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-[#0A2540]">{r.survey_title || "Pesquisa"}</p>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusCfg.bg} ${statusCfg.color}`}>{statusCfg.label}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {Math.floor(duration / 60)}m {duration % 60}s
                        {isFast && <span className="text-red-400 font-medium ml-1">⚠ muito rápido</span>}
                      </span>
                      {r.geo_lat && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {Number(r.geo_lat).toFixed(3)}, {Number(r.geo_lng).toFixed(3)}
                        </span>
                      )}
                      <span>{r.responses?.length || 0} respostas</span>
                      {r.interviewer_name && <span>por {r.interviewer_name}</span>}
                    </div>
                    {r.quality_flags?.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {r.quality_flags.map(f => (
                          <span key={f} className="text-[10px] bg-red-50 text-red-500 px-2 py-0.5 rounded-full">{f.replace(/_/g, " ")}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  {r.status !== "approved" && r.status !== "rejected" && (
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => onAuditAction(r.id, "approved")}
                        className="p-2 hover:bg-[#7AC943]/10 rounded-lg transition"
                        title="Aprovar"
                      >
                        <CheckCircle className="w-4 h-4 text-[#7AC943]" />
                      </button>
                      <button
                        onClick={() => onAuditAction(r.id, "rejected")}
                        className="p-2 hover:bg-red-50 rounded-lg transition"
                        title="Rejeitar"
                      >
                        <XCircle className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}