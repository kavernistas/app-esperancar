import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, ClipboardCheck, Target, Users } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const activityIcons = {
  contact: UserPlus,
  demand: ClipboardCheck,
  action: Target,
  leader: Users,
};

const activityColors = {
  contact: "bg-blue-100 text-blue-600",
  demand: "bg-orange-100 text-orange-600",
  action: "bg-purple-100 text-purple-600",
  leader: "bg-emerald-100 text-emerald-600",
};

export default function RecentActivity({ activities }) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-slate-800">
          Atividades Recentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">
              Nenhuma atividade recente
            </p>
          ) : (
            activities.map((activity, index) => {
              const Icon = activityIcons[activity.type] || UserPlus;
              return (
                <div key={index} className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${activityColors[activity.type]}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700">
                      {activity.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {activity.description}
                    </p>
                  </div>
                  <span className="text-xs text-slate-400 whitespace-nowrap">
                    {format(new Date(activity.date), "dd MMM", { locale: ptBR })}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}