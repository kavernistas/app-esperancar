import { Search, Database, ShieldCheck } from "lucide-react";

export default function EmptyState() {
  const features = [
    { icon: "📊", title: "Evolução por Pleito", desc: "Compare votos em 2016 vs 2020 vs 2024" },
    { icon: "🗺️", title: "Nível Micro", desc: "Onde exatamente o voto aconteceu" },
    { icon: "🔄", title: "Migração de Votos", desc: "Como o eleitorado mudou entre eleições" },
    { icon: "🤖", title: "Sofia IA", desc: "Análise estratégica automática dos dados" },
  ];

  return (
    <div className="space-y-8">
      <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center mx-auto mb-6 shadow-lg">
          <Search className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">
          Consulte o Histórico Eleitoral do Brasil
        </h2>
        <p className="text-slate-500 max-w-md mx-auto text-sm leading-relaxed">
          Dados oficiais do TSE de 2012 a 2024. Detalhamento por Município, Zona, Bairro e Seção Eleitoral.
        </p>

        <div className="flex items-center justify-center gap-6 mt-8">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Database className="w-4 h-4 text-blue-600" />
            <span>CDN Oficial TSE</span>
          </div>
          <div className="w-1 h-1 bg-slate-300 rounded-full" />
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <ShieldCheck className="w-4 h-4 text-green-600" />
            <span>Base local sincronizada</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {features.map((f, i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 hover:border-blue-200 hover:shadow-md transition-all"
          >
            <span className="text-3xl block mb-3">{f.icon}</span>
            <h3 className="font-semibold text-slate-900 text-sm mb-1">{f.title}</h3>
            <p className="text-slate-500 text-xs leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex items-start gap-4">
        <span className="text-3xl flex-shrink-0">📋</span>
        <div>
          <p className="text-slate-700 text-sm font-medium">
            Para consultar os dados oficiais do TSE, sincronize a base primeiro usando o painel de importação.
          </p>
          <p className="text-slate-500 text-xs mt-1">Os dados são baixados diretamente do CDN oficial do TSE ou importados via arquivo.</p>
        </div>
      </div>
    </div>
  );
}