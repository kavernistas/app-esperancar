import { Card, CardContent } from "@/components/ui/card";
import { Calendar as CalIcon } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";

const normalizeList = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.data?.data)) return value.data.data;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.results)) return value.results;
  return [];
};


const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const statusColors = {
  planned: "bg-slate-500",
  in_progress: "bg-blue-500",
  completed: "bg-emerald-500",
  cancelled: "bg-red-400",
};

export default function PlanningCalendar({ actions }) {
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = getDay(monthStart);

  const actionsByDate = {};
  normalizeList(actions).forEach(a => {
    if (a.start_date) {
      const key = a.start_date.split("T")[0];
      if (!actionsByDate[key]) actionsByDate[key] = [];
      actionsByDate[key].push(a);
    }
  });

  return (
    <Card className="border-slate-200">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <CalIcon className="w-5 h-5 text-indigo-600" />
          <h3 className="font-semibold text-slate-800">
            {format(today, "MMMM 'de' yyyy", { locale: ptBR })}
          </h3>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-500 mb-2">
          {WEEKDAYS.map(d => <div key={d}>{d}</div>)}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: startDay }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}
          {days.map(day => {
            const key = format(day, "yyyy-MM-dd");
            const dayActions = actionsByDate[key] || [];
            const isCurrentDay = isToday(day);

            return (
              <div
                key={key}
                className={`aspect-square rounded-lg border p-1 text-xs overflow-hidden transition-colors ${
                  isCurrentDay ? "border-indigo-400 bg-indigo-50" : "border-slate-100 hover:border-slate-300"
                }`}
              >
                <div className={`font-semibold mb-0.5 ${isCurrentDay ? "text-indigo-700" : "text-slate-600"}`}>
                  {format(day, "d")}
                </div>
                {dayActions.slice(0, 2).map((action, i) => (
                  <div
                    key={i}
                    className={`rounded px-1 py-0.5 truncate text-white text-[10px] mb-0.5 ${statusColors[action.status || "planned"]}`}
                    title={action.title}
                  >
                    {action.title}
                  </div>
                ))}
                {dayActions.length > 2 && (
                  <span className="text-[10px] text-slate-400">+{dayActions.length - 2} mais</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100 text-[10px] text-slate-500">
          <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-slate-500" /> Planejado</div>
          <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-blue-500" /> Em andamento</div>
          <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-500" /> Concluído</div>
        </div>
      </CardContent>
    </Card>
  );
}
