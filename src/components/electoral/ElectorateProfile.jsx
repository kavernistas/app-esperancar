import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Users } from "lucide-react";

// Since TSE mock data doesn't have demographic breakdown,
// we simulate a realistic profile based on zone distribution
function buildProfile(data) {
  const totalVotes = data.reduce((s, c) => s + (c.qt_votos_nominais || 0), 0);

  // Gender distribution (national average-based simulation)
  const gender = [
    { name: "Feminino", value: Math.round(totalVotes * 0.527), color: "#e91e8c" },
    { name: "Masculino", value: Math.round(totalVotes * 0.473), color: "#0D47A1" },
  ];

  // Schooling distribution (TSE national average)
  const schooling = [
    { name: "Fundamental Inc.", value: Math.round(totalVotes * 0.18), color: "#64748b" },
    { name: "Fundamental Comp.", value: Math.round(totalVotes * 0.12), color: "#94a3b8" },
    { name: "Médio Inc.", value: Math.round(totalVotes * 0.08), color: "#3b82f6" },
    { name: "Médio Comp.", value: Math.round(totalVotes * 0.38), color: "#0D47A1" },
    { name: "Superior", value: Math.round(totalVotes * 0.24), color: "#2E7D32" },
  ];

  // Age range
  const age = [
    { name: "18-24", value: Math.round(totalVotes * 0.13), color: "#42A5F5" },
    { name: "25-34", value: Math.round(totalVotes * 0.19), color: "#0D47A1" },
    { name: "35-44", value: Math.round(totalVotes * 0.18), color: "#1565C0" },
    { name: "45-59", value: Math.round(totalVotes * 0.26), color: "#2E7D32" },
    { name: "60+", value: Math.round(totalVotes * 0.24), color: "#558B2F" },
  ];

  return { gender, schooling, age };
}

const SmallPie = ({ data, title }) => (
  <div>
    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide text-center mb-1">{title}</p>
    <ResponsiveContainer width="100%" height={160}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          outerRadius={55}
          innerRadius={28}
          dataKey="value"
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip formatter={(v) => v.toLocaleString("pt-BR") + " votos"} />
        <Legend wrapperStyle={{ fontSize: 10 }} iconSize={8} />
      </PieChart>
    </ResponsiveContainer>
  </div>
);

export default function ElectorateProfile({ data }) {
  const profile = buildProfile(data);

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-600" />
          Perfil do Eleitorado
          <span className="text-xs font-normal text-slate-400">(estimativa com base na distribuição nacional TSE)</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SmallPie data={profile.gender} title="Gênero" />
          <SmallPie data={profile.schooling} title="Escolaridade" />
          <SmallPie data={profile.age} title="Faixa Etária" />
        </div>
      </CardContent>
    </Card>
  );
}