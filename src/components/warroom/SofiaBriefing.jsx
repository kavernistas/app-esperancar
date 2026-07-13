import React, { useState, useEffect } from "react";
import { Sparkles, RefreshCw } from "lucide-react";
import * as sofiaApi from "@/api/sofia";

export default function SofiaBriefing({ stats }) {
  const [insight, setInsight] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const res = await sofiaApi.analyze({
        action: "war_room_briefing",
        totalContacts: stats?.totalContacts || 0,
        activeMissions: stats?.activeMissions || 0,
        overdueMissions: stats?.overdueMissions || 0,
        criticalDemands: stats?.criticalDemands || 0,
        totalLeaders: stats?.totalLeaders || 0,
      });
      const text = res?.suggestion || res?.message || res?.data?.suggestion || res?.data?.message || res?.response || res?.text || "";
      setInsight(text || "Continue focando no engajamento territorial e resolva demandas críticas prioritariamente.");
    } catch (e) {
      setInsight("");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInsights(); }, []);

  return (
    <div className="bg-gradient-to-br from-[#0A2540] to-[#0D3466] rounded-2xl p-6 text-white">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-[#7AC943]" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Sofia IA</h3>
            <p className="text-xs text-white/60">Conselheira Operacional</p>
          </div>
        </div>
        <button onClick={fetchInsights} disabled={loading} className="p-2 hover:bg-white/10 rounded-lg transition disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 text-white/60 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white/5 rounded-xl p-4 animate-pulse h-24" />
        ) : insight ? (
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-sm font-semibold mb-1">Recomendação Estratégica</p>
            <p className="text-xs text-white/70 leading-relaxed">{insight}</p>
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-sm text-white/60">Não foi possível gerar insights no momento.</p>
          </div>
        )}
      </div>
    </div>
  );
}