import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, TrendingUp, Users, ChevronDown, ChevronUp } from "lucide-react";

export default function ResultsTable({ data, total, onLoadMore, loading }) {
  const [expanded, setExpanded] = useState(false);
  const displayData = expanded ? data : data.slice(0, 8);
  const totalVotes = data.reduce((s, c) => s + (c.votos || 0), 0);

  const getPlaceBadge = (index) => {
    if (index === 0) return <span className="text-yellow-500 font-bold text-lg">🥇</span>;
    if (index === 1) return <span className="text-slate-400 font-bold text-lg">🥈</span>;
    if (index === 2) return <span className="text-amber-600 font-bold text-lg">🥉</span>;
    return <span className="text-slate-500 text-sm font-semibold w-6 text-center">{index + 1}º</span>;
  };

  const sorted = [...data].sort((a, b) => (b.votos || 0) - (a.votos || 0));

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="w-5 h-5 text-blue-600" />
            Resultado da Votação
          </CardTitle>
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {total} registros
            </span>
            <span className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4 text-green-600" />
              {totalVotes.toLocaleString("pt-BR")} votos
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-slate-50">
          {(expanded ? sorted : sorted.slice(0, 8)).map((candidato, index) => {
            const pct = totalVotes > 0
              ? ((candidato.votos || 0) / totalVotes * 100).toFixed(1)
              : 0;
            return (
              <div key={index} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
                <div className="w-8 flex items-center justify-center flex-shrink-0">
                  {getPlaceBadge(index)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-900 text-sm">
                      {candidato.nome_candidato || "—"}
                    </span>
                    <Badge variant="outline" className="text-xs border-blue-200 text-blue-700 bg-blue-50">
                      {candidato.partido || "—"}
                    </Badge>
                    {candidato.numero_candidato && (
                      <Badge variant="outline" className="text-xs text-slate-500">
                        Nº {candidato.numero_candidato}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-slate-500">
                      {candidato.municipio || "—"}
                      {candidato.zona ? ` · Zona ${candidato.zona}` : ""}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden w-full max-w-xs">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all"
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-slate-900 text-base">
                    {(candidato.votos || 0).toLocaleString("pt-BR")}
                  </p>
                  <p className="text-xs text-slate-500">{pct}% dos votos</p>
                </div>
              </div>
            );
          })}
        </div>

        {data.length > 8 && (
          <div className="flex justify-center py-4 border-t border-slate-100">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              {expanded
                ? <><ChevronUp className="w-4 h-4 mr-1" />Mostrar menos</>
                : <><ChevronDown className="w-4 h-4 mr-1" />Ver todos os {data.length} registros</>
              }
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}