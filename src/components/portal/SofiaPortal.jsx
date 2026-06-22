import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Lightbulb, Loader2 } from "lucide-react";

export default function SofiaPortal({ user, stats }) {
  const [suggestion, setSuggestion] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    setLoading(true);
    try {
      const res = await sofiaApi.analyze({
        action: "lideranca_sugestao",
        leader_id: user?.id,
        leader_name: user?.full_name,
        neighborhood: stats?.neighborhood,
        supporters_count: stats?.supporters,
        open_demands: stats?.openDemands,
        pending_missions: stats?.pendingMissions,
        weekly_points: stats?.weeklyPoints,
        weekly_goal: stats?.weeklyGoal,
      });
      setSuggestion(res.data?.suggestion || res.data?.message || "Continue engajando sua base!");
    } catch (e) {
      setSuggestion("Continue engajando sua base!");
    }
    setLoading(false);
  };

  return (
    <Card className="border-slate-200 bg-gradient-to-r from-purple-50 to-indigo-50">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold text-sm text-purple-800">Sofia para Liderança</h3>
        </div>
        {suggestion ? (
          <div>
            <div className="flex items-start gap-2 bg-white rounded-lg p-3">
              <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-slate-700">{suggestion}</p>
            </div>
            <Button size="sm" variant="ghost" className="text-[10px] text-purple-600 mt-2" onClick={handleAsk} disabled={loading}>
              {loading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
              Nova sugestão
            </Button>
          </div>
        ) : (
          <Button size="sm" onClick={handleAsk} disabled={loading} className="w-full bg-purple-600 hover:bg-purple-700 text-sm">
            {loading ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Consultando...</> : <><Sparkles className="w-4 h-4 mr-1" /> O que devo fazer agora?</>}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}