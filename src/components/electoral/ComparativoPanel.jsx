import { tseApi } from "@/api/client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  GitCompare, ArrowLeftRight, History, TrendingUp, Loader2, Trophy
} from "lucide-react";

const ESTADOS = [
  { sigla: "AC", nome: "Acre" },{ sigla: "AL", nome: "Alagoas" },{ sigla: "AM", nome: "Amazonas" },
  { sigla: "AP", nome: "Amapá" },{ sigla: "BA", nome: "Bahia" },{ sigla: "CE", nome: "Ceará" },
  { sigla: "DF", nome: "Distrito Federal" },{ sigla: "ES", nome: "Espírito Santo" },{ sigla: "GO", nome: "Goiás" },
  { sigla: "MA", nome: "Maranhão" },{ sigla: "MG", nome: "Minas Gerais" },{ sigla: "MS", nome: "Mato Grosso do Sul" },
  { sigla: "MT", nome: "Mato Grosso" },{ sigla: "PA", nome: "Pará" },{ sigla: "PB", nome: "Paraíba" },
  { sigla: "PE", nome: "Pernambuco" },{ sigla: "PI", nome: "Piauí" },{ sigla: "PR", nome: "Paraná" },
  { sigla: "RJ", nome: "Rio de Janeiro" },{ sigla: "RN", nome: "Rio Grande do Norte" },{ sigla: "RO", nome: "Rondônia" },
  { sigla: "RR", nome: "Roraima" },{ sigla: "RS", nome: "Rio Grande do Sul" },{ sigla: "SC", nome: "Santa Catarina" },
  { sigla: "SE", nome: "Sergipe" },{ sigla: "SP", nome: "São Paulo" },{ sigla: "TO", nome: "Tocantins" },
];
const ANOS = [2012, 2014, 2016, 2018, 2020, 2022, 2024];

export default function ComparativoPanel({ syncStatuses }) {
  const [mode, setMode] = useState("candidato");
  const [ano1, setAno1] = useState("2024");
  const [ano2, setAno2] = useState("2020");
  const [uf, setUf] = useState("GO");
  const [cargo, setCargo] = useState("prefeito");
  const [candidato1, setCandidato1] = useState("");
  const [candidato2, setCandidato2] = useState("");
  const [loading, setLoading] = useState(false);
  const [comparison, setComparison] = useState(null);

  const isSynced = syncStatuses?.some(s =>
    s.ano === parseInt(ano1) && s.uf === uf && (s.status || "").toUpperCase() === "IMPORTADO"
  );

  const handleCompare = async () => {
    setLoading(true);
    setComparison(null);
    try {
      const [res1, res2] = await Promise.all([
        tseApi.queryVotes({ ano: parseInt(ano1), uf, cargo, candidato: candidato1 }),
        tseApi.queryVotes({ ano: parseInt(ano2), uf, cargo, candidato: candidato2 }),
      ]);

      if (res1.success && res2.success) {
        const data1 = res1.data || [];
        const data2 = res2.data || [];
        setComparison({ data1, data2, ano1, ano2, total1: res1.total, total2: res2.total });
      }
    } catch (e) {
      console.error("Erro na comparação:", e);
    }
    setLoading(false);
  };

  const modeOptions = [
    { value: "candidato", label: "Candidato x Candidato", desc: "Compare desempenho de dois candidatos" },
    { value: "partido", label: "Partido x Partido", desc: "Compare resultados por legenda partidária" },
    { value: "eleicao", label: "Eleição x Eleição", desc: "Evolução entre pleitos diferentes" },
    { value: "historico", label: "Evolução Histórica", desc: "Linha do tempo de resultados" },
  ];

  return (
    <div className="space-y-6">
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-blue-600" />
            Comparativos Eleitorais
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Mode selector */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
            {modeOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => { setMode(opt.value); setComparison(null); }}
                className={`p-3 rounded-lg text-left border transition-all ${
                  mode === opt.value
                    ? "border-blue-300 bg-blue-50 shadow-sm"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <p className="font-medium text-sm text-slate-800">{opt.label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{opt.desc}</p>
              </button>
            ))}
          </div>

          {/* Filters */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end mb-4">
            <div>
              <Label className="text-xs">UF</Label>
              <select value={uf} onChange={(e) => setUf(e.target.value)} className="w-full rounded-lg border border-slate-200 px-2 py-2 text-sm mt-1">
                {ESTADOS.map(e => <option key={e.sigla} value={e.sigla}>{e.sigla}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs">Cargo</Label>
              <select value={cargo} onChange={(e) => setCargo(e.target.value)} className="w-full rounded-lg border border-slate-200 px-2 py-2 text-sm mt-1">
                {[{ value: "prefeito", label: "Prefeito" },{ value: "vereador", label: "Vereador" },{ value: "governador", label: "Governador" },{ value: "deputado_estadual", label: "Dep. Estadual" },{ value: "deputado_federal", label: "Dep. Federal" },{ value: "senador", label: "Senador" },{ value: "presidente", label: "Presidente" }].map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs">Ano 1</Label>
              <select value={ano1} onChange={(e) => setAno1(e.target.value)} className="w-full rounded-lg border border-slate-200 px-2 py-2 text-sm mt-1">
                {ANOS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs">Ano 2</Label>
              <select value={ano2} onChange={(e) => setAno2(e.target.value)} className="w-full rounded-lg border border-slate-200 px-2 py-2 text-sm mt-1">
                {ANOS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>

          {(mode === "candidato" || mode === "partido") && (
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <Label className="text-xs">{mode === "candidato" ? "Candidato 1" : "Partido 1"}</Label>
                <Input value={candidato1} onChange={(e) => setCandidato1(e.target.value)} placeholder="Nome" className="mt-1 text-sm" />
              </div>
              <div>
                <Label className="text-xs">{mode === "candidato" ? "Candidato 2" : "Partido 2"}</Label>
                <Input value={candidato2} onChange={(e) => setCandidato2(e.target.value)} placeholder="Nome" className="mt-1 text-sm" />
              </div>
            </div>
          )}

          <div className="flex justify-between items-center">
            <p className="text-xs text-slate-400">
              Crucamento: <strong>{modeOptions.find(o => o.value === mode)?.label}</strong> — {ano1} vs {ano2}
            </p>
            <Button onClick={handleCompare} disabled={loading || !isSynced} className="bg-blue-600 hover:bg-blue-700">
              {loading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <ArrowLeftRight className="w-4 h-4 mr-1.5" />}
              {loading ? "Comparando..." : "Comparar"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {comparison && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-blue-200 bg-blue-50/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Trophy className="w-4 h-4 text-blue-600" />
                {comparison.ano1}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-700 mb-2">{comparison.total1.toLocaleString()}</p>
              <p className="text-sm text-slate-500">registros</p>
              {comparison.data1.slice(0, 5).map((r, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-blue-100 text-sm">
                  <span className="text-slate-700">{r.nome_candidato}</span>
                  <span className="font-semibold text-slate-800">{r.votos?.toLocaleString()}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-emerald-200 bg-emerald-50/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Trophy className="w-4 h-4 text-emerald-600" />
                {comparison.ano2}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-emerald-700 mb-2">{comparison.total2.toLocaleString()}</p>
              <p className="text-sm text-slate-500">registros</p>
              {comparison.data2.slice(0, 5).map((r, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-emerald-100 text-sm">
                  <span className="text-slate-700">{r.nome_candidato}</span>
                  <span className="font-semibold text-slate-800">{r.votos?.toLocaleString()}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Delta */}
          <Card className="lg:col-span-2 border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-600" />
                Variação {comparison.ano2} → {comparison.ano1}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <p className="text-3xl font-bold text-purple-700">
                    {comparison.total1 > comparison.total2 ? "+" : ""}{(comparison.total1 - comparison.total2).toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-500">Diferença absoluta</p>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <p className="text-3xl font-bold text-purple-700">
                    {comparison.total2 > 0 ? (((comparison.total1 - comparison.total2) / comparison.total2) * 100).toFixed(1) : "—"}%
                  </p>
                  <p className="text-xs text-slate-500">Variação percentual</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {!isSynced && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4 flex items-center gap-3">
            <History className="w-5 h-5 text-amber-500" />
            <p className="text-sm text-amber-700">Sincronize dados oficiais para {uf} nos anos selecionados para ativar os comparativos.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}