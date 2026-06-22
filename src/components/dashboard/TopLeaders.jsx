import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const strengthColors = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-blue-100 text-blue-600",
  high: "bg-emerald-100 text-emerald-600",
  very_high: "bg-purple-100 text-purple-600",
};

const strengthLabels = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  very_high: "Muito Alta",
};

export default function TopLeaders({ leaders }) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-slate-800">
          Top Lideranças
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {leaders.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">
              Nenhuma liderança cadastrada
            </p>
          ) : (
            leaders.slice(0, 5).map((leader, index) => {
              const progress = leader.monthly_goal > 0 
                ? Math.min(100, (leader.conversions / leader.monthly_goal) * 100)
                : 0;
              
              return (
                <div key={leader.id} className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                    {index + 1}
                  </div>
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm">
                      {leader.name?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-slate-700 truncate">
                        {leader.name}
                      </p>
                      <Badge className={`text-xs ${strengthColors[leader.political_strength]}`}>
                        {strengthLabels[leader.political_strength]}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={progress} className="h-1.5 flex-1" />
                      <span className="text-xs text-slate-500 whitespace-nowrap">
                        {leader.supporters_count} apoiadores
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}