import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { BarChart3, PieChart as PieIcon } from "lucide-react";

const COLORS = ["#0D47A1", "#1565C0", "#1976D2", "#2196F3", "#42A5F5", "#64B5F6", "#90CAF9", "#BBDEFB"];

const CustomBarTooltip = ({ active, payload }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3">
        <p className="font-semibold text-slate-900 text-sm">{payload[0].payload.name}</p>
        <p className="text-blue-700 font-bold">{payload[0].value?.toLocaleString("pt-BR")} votos</p>
        <p className="text-slate-500 text-xs">{payload[0].payload.partido}</p>
      </div>
    );
  }
  return null;
};

export default function ResultsCharts({ data }) {
  const sorted = [...data]
    .sort((a, b) => (b.votos || 0) - (a.votos || 0))
    .slice(0, 8);

  const barData = sorted.map((c) => ({
    name: (c.nome_candidato || "—").split(" ").slice(0, 2).join(" "),
    votos: c.votos || 0,
    partido: c.partido || "—",
  }));

  const totalVotes = sorted.reduce((s, c) => s + (c.votos || 0), 0);
  const pieData = sorted.map((c) => ({
    name: (c.nome_candidato || "—").split(" ").slice(0, 2).join(" "),
    value: c.votos || 0,
    pct: totalVotes > 0 ? ((c.votos || 0) / totalVotes * 100).toFixed(1) : 0,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            Comparativo por Candidato
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barData} margin={{ top: 5, right: 10, left: 10, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} angle={-35} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 11, fill: "#64748b" }} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
              <Tooltip content={<CustomBarTooltip />} />
              <Bar dataKey="votos" fill="#0D47A1" radius={[4, 4, 0, 0]}>
                {barData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-blue-600" />
            Distribuição de Votos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="45%" outerRadius={90} innerRadius={40} dataKey="value"
                label={({ pct }) => `${pct}%`} labelLine={false}>
                {pieData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [value.toLocaleString("pt-BR") + " votos", name]} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}