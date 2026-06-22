import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function StatCard({ title, value, icon: Icon, trend, trendValue, color = "blue" }) {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600",
    green: "from-emerald-500 to-emerald-600",
    purple: "from-purple-500 to-purple-600",
    orange: "from-orange-500 to-orange-600",
    red: "from-red-500 to-red-600",
    cyan: "from-cyan-500 to-cyan-600",
  };

  const bgColorClasses = {
    blue: "bg-blue-50",
    green: "bg-emerald-50",
    purple: "bg-purple-50",
    orange: "bg-orange-50",
    red: "bg-red-50",
    cyan: "bg-cyan-50",
  };

  const iconColorClasses = {
    blue: "text-blue-500",
    green: "text-emerald-500",
    purple: "text-purple-500",
    orange: "text-orange-500",
    red: "text-red-500",
    cyan: "text-cyan-500",
  };

  return (
    <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className={`absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b ${colorClasses[color]}`} />
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className="text-3xl font-bold text-slate-900">{value}</p>
            {trend && (
              <div className="flex items-center gap-1">
                {trend === "up" ? (
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                )}
                <span className={`text-sm font-medium ${trend === "up" ? "text-emerald-500" : "text-red-500"}`}>
                  {trendValue}
                </span>
                <span className="text-sm text-slate-400">vs mês anterior</span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-xl ${bgColorClasses[color]}`}>
            <Icon className={`w-6 h-6 ${iconColorClasses[color]}`} />
          </div>
        </div>
      </div>
    </Card>
  );
}