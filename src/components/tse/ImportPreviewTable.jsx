import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Users, MapPin } from "lucide-react";

export default function ImportPreviewTable({ records, total, ano, uf, cargo, usedMock }) {
  const totalVotes = records.reduce((s, r) => s + (r.qt_votos_nominais || 0), 0);

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2 border-b border-slate-100">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Eye className="w-4 h-4 text-green-600" />
            Pré-visualização dos dados
          </CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-slate-600">{uf} · {ano}</Badge>
            {cargo && <Badge variant="outline" className="text-blue-600 border-blue-200">{cargo}</Badge>}
            {usedMock && <Badge className="bg-amber-100 text-amber-700 border-amber-200">Demonstração</Badge>}
            <Badge className="bg-green-100 text-green-700 border-green-200">
              <Users className="w-3 h-3 mr-1" />
              {total} registros totais
            </Badge>
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Exibindo {records.length} de {total} registros · {totalVotes.toLocaleString("pt-BR")} votos na prévia
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Candidato</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Partido</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Município</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Zona</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Cargo</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Votos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {records.map((r, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-900">{r.nm_candidato || "—"}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="text-xs border-blue-200 text-blue-700 bg-blue-50">
                      {r.sg_partido || "—"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-600 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    {r.nm_municipio || "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs font-mono">{r.nr_zona || "—"}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs capitalize">{r.ds_cargo || "—"}</td>
                  <td className="px-4 py-3 text-right font-bold text-slate-900">
                    {(r.qt_votos_nominais || 0).toLocaleString("pt-BR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {records.length < total && (
          <div className="text-center py-3 text-xs text-slate-400 border-t border-slate-100 bg-slate-50">
            Prévia limitada a {records.length} linhas · Total real: {total} registros
          </div>
        )}
      </CardContent>
    </Card>
  );
}