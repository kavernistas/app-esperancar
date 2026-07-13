import { useMemo } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { Users, Vote, TrendingUp, Brain } from "lucide-react";

const PIE_COLORS = ["#7AC943", "#0A2540", "#FDB913", "#EF4444", "#8B5CF6", "#06B6D4"];

export default function SurveyDashboard({ responses, surveys }) {
  const stats = useMemo(() => {
    const total = responses.length;
    const flagged = responses.filter(r => r.quality_flags?.length > 0 || r.status === "flagged").length;
    const approved = responses.filter(r => r.status === "approved").length;
    const pendingSync = responses.filter(r => r.status === "pending_sync").length;

    // Vote intention distribution
    const voteCounts = {};
    responses.forEach(r => {
      const v = r.vote_intention || "Não informado";
      voteCounts[v] = (voteCounts[v] || 0) + 1;
    });
    const voteData = Object.entries(voteCounts).map(([name, value]) => ({ name, value }));

    // Sentiment markers averages
    const sentiments = ["medo", "esperanca", "ressentimento", "indignacao"];
    const sentimentData = sentiments.map(s => {
      const vals = responses.map(r => r.sentiment_markers?.[s]).filter(v => v != null && v > 0);
      const avg = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
      return { axis: s.charAt(0).toUpperCase() + s.slice(1), value: Math.round(avg * 20) }; // scale 1-5 to 0-100
    }).filter(d => d.value > 0);

    // Education breakdown
    const eduCounts = {};
    responses.forEach(r => {
      const e = r.respondent_profile?.education || "Não informado";
      eduCounts[e] = (eduCounts[e] || 0) + 1;
    });
    const eduLabels = { fundamental: "Fundamental", medio: "Médio", superior: "Superior", pos_graduacao: "Pós-grad", sem_escolaridade: "Sem esc." };
    const eduData = Object.entries(eduCounts).map(([k, v]) => ({ name: eduLabels[k] || k, count: v }));

    // Religion breakdown
    const relCounts = {};
    responses.forEach(r => {
      const rel = r.respondent_profile?.religion || "Não informado";
      relCounts[rel] = (relCounts[rel] || 0) + 1;
    });
    const relLabels = { catolica: "Católica", evangelica: "Evangélica", matriz_africana: "Matriz Afr.", espirita: "Espírita", sem_religiao: "Sem religião", outra: "Outra" };
    const relData = Object.entries(relCounts).map(([k, v]) => ({ name: relLabels[k] || k, value: v }));

    // Volatility index average
    const volVals = responses.map(r => r.volatility_index).filter(v => v != null && v > 0);
    const avgVolatility = volVals.length > 0 ? Math.round(volVals.reduce((a, b) => a + b, 0) / volVals.length) : 0;

    // Indecisos percentage
    const indecisos = responses.filter(r => {
      const v = (r.vote_intention || "").toLowerCase();
      return v.includes("indeciso") || v.includes("nao_sabe") || v.includes("nulo") || v === "";
    }).length;

    return { total, flagged, approved, pendingSync, voteData, sentimentData, eduData, relData, avgVolatility, indecisos };
  }, [responses]);

  if (responses.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
        <Brain className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-sm text-slate-400">Nenhuma resposta coletada ainda</p>
        <p className="text-xs text-slate-400 mt-1">Os dados analíticos aparecerão aqui após a coleta de campo</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-slate-400">Respostas</span>
          </div>
          <p className="text-2xl font-bold text-[#0A2540]">{stats.total}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Vote className="w-4 h-4 text-[#7AC943]" />
            <span className="text-xs text-slate-400">Indecisos</span>
          </div>
          <p className="text-2xl font-bold text-[#0A2540]">{stats.indecisos}</p>
          <p className="text-[10px] text-slate-400">{stats.total > 0 ? Math.round((stats.indecisos / stats.total) * 100) : 0}% do total</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-slate-400">Volatilidade</span>
          </div>
          <p className="text-2xl font-bold text-[#0A2540]">{stats.avgVolatility}%</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Brain className="w-4 h-4 text-red-400" />
            <span className="text-xs text-slate-400">Flagged</span>
          </div>
          <p className="text-2xl font-bold text-[#0A2540]">{stats.flagged}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Vote intention pie */}
        {stats.voteData.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5">
            <h3 className="text-sm font-semibold text-[#0A2540] mb-3">Intenção de Voto</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={stats.voteData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                  {stats.voteData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Sentiment radar */}
        {stats.sentimentData.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5">
            <h3 className="text-sm font-semibold text-[#0A2540] mb-3">Afetos Políticos</h3>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={stats.sentimentData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="axis" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                <Radar dataKey="value" stroke="#7AC943" fill="#7AC943" fillOpacity={0.4} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Education breakdown */}
        {stats.eduData.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5">
            <h3 className="text-sm font-semibold text-[#0A2540] mb-3">Capital Cultural (Escolaridade)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.eduData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#0A2540" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Religion breakdown */}
        {stats.relData.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5">
            <h3 className="text-sm font-semibold text-[#0A2540] mb-3">Inserção Religiosa</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={stats.relData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                  {stats.relData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}