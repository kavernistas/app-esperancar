import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Database, Download, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import moment from "moment";

const ESTADOS = ["AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"];
const ANOS = [2012,2014,2016,2018,2020,2022,2024];

export default function ImportPanel({ syncStatuses, onSync, syncing }) {
  const [selectedAno, setSelectedAno] = useState("2024");
  const [selectedUF, setSelectedUF] = useState("GO");

  const getStatus = (ano, uf) => {
    return syncStatuses?.find(s => s.ano === parseInt(ano) && s.uf === uf);
  };

  const statusBadge = (status) => {
    if (!status || status === 'nao_importado') return <Badge variant="outline" className="text-xs text-slate-400">Não importado</Badge>;
    if (status === 'importado') return <Badge className="text-xs bg-emerald-100 text-emerald-700"><CheckCircle2 className="w-3 h-3 mr-0.5" />Importado</Badge>;
    if (status === 'importando') return <Badge className="text-xs bg-blue-100 text-blue-700"><Download className="w-3 h-3 mr-0.5 animate-pulse" />Importando</Badge>;
    if (status === 'erro') return <Badge className="text-xs bg-red-100 text-red-700"><XCircle className="w-3 h-3 mr-0.5" />Erro</Badge>;
    return null;
  };

  const importedCount = syncStatuses?.filter(s => s.status === 'importado').length || 0;
  const totalPossible = ANOS.length * ESTADOS.length;

  return (
    <div className="space-y-4">
      <Card className="border-slate-200 bg-gradient-to-br from-white to-slate-50/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" />
            Sincronizar Dados TSE
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>{importedCount} de {totalPossible} bases importadas</span>
            <Progress value={Math.round((importedCount / totalPossible) * 100)} className="h-1.5 flex-1" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Ano</label>
              <select
                value={selectedAno}
                onChange={(e) => setSelectedAno(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                {ANOS.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">UF</label>
              <select
                value={selectedUF}
                onChange={(e) => setSelectedUF(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                {ESTADOS.map(uf => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {statusBadge(getStatus(selectedAno, selectedUF)?.status)}
              {getStatus(selectedAno, selectedUF)?.data_ultima_sincronizacao && (
                <span className="text-xs text-slate-400">
                  {moment(getStatus(selectedAno, selectedUF).data_ultima_sincronizacao).format('DD/MM/YYYY')}
                </span>
              )}
            </div>
            <Button
              onClick={() => onSync(selectedAno, selectedUF)}
              disabled={syncing || getStatus(selectedAno, selectedUF)?.status === 'importando'}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Download className="w-4 h-4 mr-1.5" />
              {syncing ? 'Importando...' : 'Importar'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Grid de status por ano/UF */}
      <Card className="border-slate-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Bases Sincronizadas</CardTitle>
        </CardHeader>
        <CardContent className="max-h-60 overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-1">
            {syncStatuses?.filter(s => s.status === 'importado').map(s => (
              <div key={`${s.ano}-${s.uf}`} className="flex items-center gap-1.5 px-2 py-1.5 rounded bg-emerald-50 text-xs text-emerald-700">
                <CheckCircle2 className="w-3 h-3" />
                {s.uf}/{s.ano}
              </div>
            ))}
            {(!syncStatuses || syncStatuses.filter(s => s.status === 'importado').length === 0) && (
              <p className="col-span-full text-xs text-slate-400 py-4 text-center">
                Nenhuma base sincronizada. Selecione ano e UF acima para começar.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}