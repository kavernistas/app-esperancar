import { Vote, Users, MapPin, TrendingUp, Award, BarChart2 } from "lucide-react";

export default function SummaryStats({ data, ano, uf, cargo }) {
  const totalVotes = data.reduce((s, c) => s + (c.votos || 0), 0);
  const sorted = [...data].sort((a, b) => (b.votos || 0) - (a.votos || 0));
  const leader = sorted[0];
  const uniqueZones = new Set(data.map((c) => c.zona).filter(Boolean)).size;
  const uniqueMunicipios = new Set(data.map((c) => c.municipio).filter(Boolean)).size;
  const leaderPct = totalVotes > 0 ? ((leader?.votos || 0) / totalVotes * 100).toFixed(1) : 0;

  const cargoLabel = {
    presidente: "Presidente", governador: "Governador", senador: "Senador",
    deputado_federal: "Dep. Federal", deputado_estadual: "Dep. Estadual",
    prefeito: "Prefeito", vereador: "Vereador",
  };

  const stats = [
    { label: "Total de Votos", value: totalVotes.toLocaleString("pt-BR"), icon: Vote, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Candidatos", value: data.length, icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Municípios", value: uniqueMunicipios || "—", icon: MapPin, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "Zonas Eleitorais", value: uniqueZones || "—", icon: BarChart2, color: "text-teal-600", bg: "bg-teal-50" },
    { label: "1º Colocado", value: (leader?.nome_candidato || "—").split(" ").slice(0, 2).join(" "), icon: Award, color: "text-yellow-600", bg: "bg-yellow-50", sub: `${leaderPct}% dos votos` },
    { label: "Cargo", value: cargoLabel[cargo] || cargo || "Todos", icon: TrendingUp, color: "text-green-600", bg: "bg-green-50", sub: `${uf} · ${ano}` },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {stats.map((s, i) => {
        const Icon = s.icon;
        return (
          <div key={i} className={`${s.bg} rounded-xl p-4 border border-white`}>
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`w-4 h-4 ${s.color}`} />
              <span className="text-xs text-slate-500 font-medium">{s.label}</span>
            </div>
            <p className={`text-lg font-bold ${s.color} leading-tight`}>{s.value}</p>
            {s.sub && <p className="text-xs text-slate-400 mt-0.5">{s.sub}</p>}
          </div>
        );
      })}
    </div>
  );
}