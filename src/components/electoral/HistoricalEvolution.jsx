import { tseApi } from "@/api/client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { TrendingUp, Loader2, RefreshCw } from "lucide-react";

const ANOS = ["2012", "2014", "2016", "2018", "2020", "2022", "2024"];

export default function HistoricalEvolution({ filters }) {
  const [histData, setHistData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchHistory = async () => {
    if (!filters.candidato || !filters.uf || !filters.cargo) return;
    setLoading(true);
    setHistData(null);

    const anosToFetch = ANOS.filter((a) => parseInt(a) <= parseInt(filters.ano || "2024"));
    const results = await Promise.all(
      anosToFetch.map((ano) =>
        tseApi.queryVotes({
          ano: parseInt(ano),
          uf: filters.uf,
          cargo: filters.cargo,
          candidato: filters.candidato,
        }).then((r) => ({ ano, data: r.data || [] }))
      )
    );

    const chartData = results
      .map(({ ano, data }) => {
        const match = data.find(
          (c) =>
            c.nome_candidato?.toLowerCase().includes(filters.candidato.toLowerCase()) ||
            c.numero_candidato === filters.candidato
        );
        return {
          ano,
          votos: match?.votos || 0,
          candidato: match?.nome_candidato || filters.candidato.toUpperCase(),
        };
      })
      .filter((d) => d.votos > 0);

    setHistData(chartData);
    setLoading(false);
  };

  const growth =
    histData && histData.length >= 2
      ? (((histData[histData.length - 1].votos - histData[0].votos) / histData[0].votos) * 100).toFixed(1)
      : null;

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            Evolução Histórica por Pleito
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={fetchHistory}
            disabled={loading || !filters.candidato || !filters.uf || !filters.cargo}
            className="text-xs h-8"
          >
            {loading
              ? <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              : <RefreshCw className="w-3 h-3 mr-1" />}
            {histData ? "Atualizar" : "Carregar histórico"}
          </Button>
        </div>
        {!filters.candidato && (
          <p className="text-xs text-slate-400 mt-1">
            Preencha o nome do candidato nos filtros para ver a evolução histórica
          </p>
        )}
      </CardHeader>
      <CardContent>
        {!histData && !loading && (
          <div className="h-48 flex items-center justify-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
            <div className="text-center">
              <TrendingUp className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-400">Compare 2012 a 2024</p>
              <p className="text-xs text-slate-300 mt-1">Clique em "Carregar histórico" acima</p>
            </div>
          </div>
        )}

        {loading && (
          <div className="h-48 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
              <p className="text-sm text-slate-500">Buscando dados de {ANOS.length} eleições na base local...</p>
            </div>
          </div>
        )}

        {histData && histData.length > 0 && (
          <div className="space-y-3">
            {growth !== null && (
              <div className="flex gap-3">
                <Badge className={parseFloat(growth) >= 0 ? "bg-green-100 text-green-700 border-green-200" : "bg-red-100 text-red-700 border-red-200"}>
                  {parseFloat(growth) >= 0 ? "+" : ""}{growth}% no período
                </Badge>
                <Badge variant="outline" className="text-slate-600 text-xs">
                  {histData[0].ano} → {histData[histData.length - 1].ano}
                </Badge>
              </div>
            )}
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={histData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="ano" tick={{ fontSize: 12, fill: "#64748b" }} />
                <YAxis
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                />
                <Tooltip
                  formatter={(v) => [v.toLocaleString("pt-BR") + " votos", "Votos"]}
                  labelFormatter={(l) => `Eleição ${l}`}
                />
                <Line type="monotone" dataKey="votos" stroke="#2E7D32" strokeWidth={2.5}
                  dot={{ fill: "#2E7D32", r: 5 }} activeDot={{ r: 7 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {histData && histData.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-8">
            Nenhum dado histórico encontrado para este candidato na base local.
          </p>
        )}
      </CardContent>
    </Card>
  );
}