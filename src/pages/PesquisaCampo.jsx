import { useState, useEffect, useCallback } from "react";
import {
  listSurveys, createSurvey, updateSurvey, deleteSurvey,
  listSurveyResponses, createSurveyResponse, updateSurveyResponse
} from "@/api/surveys";
import { normalizeList } from "@/lib/normalizeList";
import { useAuth } from "@/lib/AuthContext";
import { ClipboardCheck, BarChart3, FileText, Play, ShieldCheck, Plus, RefreshCw, Pencil, Trash2, Wifi } from "lucide-react";
import SurveyBuilder from "@/components/pesquisa/SurveyBuilder";
import SurveyRunner from "@/components/pesquisa/SurveyRunner";
import SurveyDashboard from "@/components/pesquisa/SurveyDashboard";
import SurveyAudit from "@/components/pesquisa/SurveyAudit";

const TABS = [
  { id: "dashboard", label: "Painel Analítico", icon: BarChart3 },
  { id: "surveys", label: "Questionários", icon: FileText },
  { id: "field", label: "Coleta de Campo", icon: Play },
  { id: "audit", label: "Auditoria", icon: ShieldCheck },
];

export default function PesquisaCampo() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [surveys, setSurveys] = useState([]);
  const [responses, setResponses] = useState([]);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingSurvey, setEditingSurvey] = useState(null);
  const { user } = useAuth();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [survRes, respRes] = await Promise.all([
        listSurveys({ limit: 100 }).catch(() => []),
        listSurveyResponses({ limit: 500 }).catch(() => []),
      ]);
      setSurveys(normalizeList(survRes));
      setResponses(normalizeList(respRes));
    } catch (e) {}
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const syncPending = async () => {
    const pending = JSON.parse(localStorage.getItem("pending_survey_responses") || "[]");
    if (pending.length === 0) { alert("Nenhuma resposta pendente"); return; }
    let synced = 0;
    for (const resp of pending) {
      try { await createSurveyResponse(resp); synced++; } catch (e) {}
    }
    localStorage.setItem("pending_survey_responses", "[]");
    alert(`${synced} respostas sincronizadas!`);
    loadData();
  };

  const handleSaveSurvey = async (data) => {
    if (editingSurvey) {
      await updateSurvey(editingSurvey.id, data);
    } else {
      await createSurvey({ ...data, created_by_name: user?.full_name || user?.email || "" });
    }
    setShowBuilder(false);
    setEditingSurvey(null);
    loadData();
  };

  const handleDeleteSurvey = async (id) => {
    if (!confirm("Excluir esta pesquisa e todas as suas respostas?")) return;
    await deleteSurvey(id);
    loadData();
  };

  const handleSaveResponse = async (data) => {
    try {
      await createSurveyResponse(data);
      loadData();
      return true;
    } catch (e) {
      const pending = JSON.parse(localStorage.getItem("pending_survey_responses") || "[]");
      pending.push({ ...data, status: "pending_sync" });
      localStorage.setItem("pending_survey_responses", JSON.stringify(pending));
      return false;
    }
  };

  const handleAuditAction = async (id, status) => {
    await updateSurveyResponse(id, { status });
    loadData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-[#7AC943] rounded-full animate-spin"></div>
      </div>
    );
  }

  const pendingCount = JSON.parse(localStorage.getItem("pending_survey_responses") || "[]").length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0A2540]">Pesquisa de Campo</h1>
          <p className="text-sm text-slate-500">Módulo de Pesquisa Eleitoral — Metodologia Socioterritorial</p>
        </div>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <button onClick={syncPending} className="flex items-center gap-2 px-3 py-2 bg-amber-50 text-amber-700 rounded-xl hover:bg-amber-100 transition text-sm font-medium">
              <Wifi className="w-4 h-4" /> {pendingCount} offline
            </button>
          )}
          <button onClick={loadData} className="p-2 hover:bg-slate-100 rounded-xl transition">
            <RefreshCw className="w-5 h-5 text-slate-500" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl border border-slate-200/80 p-1 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setShowBuilder(false); setEditingSurvey(null); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
              activeTab === tab.id ? "bg-[#7AC943] text-white" : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === "dashboard" && <SurveyDashboard responses={responses} surveys={surveys} />}

      {activeTab === "surveys" && (
        <div className="space-y-4">
          {!showBuilder && (
            <div className="flex justify-end">
              <button
                onClick={() => { setEditingSurvey(null); setShowBuilder(true); }}
                className="flex items-center gap-2 px-4 py-2 bg-[#7AC943] text-white rounded-xl hover:bg-[#5DA830] transition font-medium text-sm"
              >
                <Plus className="w-4 h-4" /> Nova Pesquisa
              </button>
            </div>
          )}

          {showBuilder && (
            <SurveyBuilder survey={editingSurvey} onSave={handleSaveSurvey} onCancel={() => { setShowBuilder(false); setEditingSurvey(null); }} />
          )}

          {!showBuilder && (
            <div className="space-y-2">
              {surveys.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
                  <ClipboardCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm text-slate-400">Nenhuma pesquisa cadastrada</p>
                  <p className="text-xs text-slate-400 mt-1">Crie seu primeiro questionário metodológico</p>
                </div>
              ) : (
                surveys.map(s => (
                  <div key={s.id} className="bg-white rounded-2xl border border-slate-200/80 p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#7AC943]/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-[#7AC943]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-[#0A2540] truncate">{s.title}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                        <span>{s.questions?.length || 0} perguntas</span>
                        <span>•</span>
                        <span>{s.type === "mixed" ? "Mista" : s.type === "quantitative" ? "Quantitativa" : "Qualitativa"}</span>
                        <span>•</span>
                        <span>Amostra: {s.target_sample_size || "N/A"}</span>
                      </div>
                    </div>
                    <span className={`text-[10px] font-medium px-2 py-1 rounded-full ${
                      s.status === "active" ? "bg-[#7AC943]/10 text-[#7AC943]" :
                      s.status === "draft" ? "bg-slate-100 text-slate-500" :
                      s.status === "completed" ? "bg-blue-50 text-blue-500" :
                      "bg-amber-50 text-amber-500"
                    }`}>
                      {s.status === "active" ? "Ativa" : s.status === "draft" ? "Rascunho" : s.status === "completed" ? "Concluída" : s.status === "paused" ? "Pausada" : "Arquivada"}
                    </span>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditingSurvey(s); setShowBuilder(true); }} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteSurvey(s.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === "field" && <SurveyRunner surveys={surveys} user={user} onSaveResponse={handleSaveResponse} />}

      {activeTab === "audit" && <SurveyAudit responses={responses} onAuditAction={handleAuditAction} />}
    </div>
  );
}