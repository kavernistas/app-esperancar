import { useState, useEffect, useCallback } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Database, CheckCircle2, XCircle, AlertTriangle,
  RefreshCw, ExternalLink, Clock, Server, ArrowRight
} from "lucide-react";
import moment from "moment";

const ESTADOS = ["AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"];
const ANOS = [2012,2014,2016,2018,2020,2022,2024];

export default function DiagnosticoTSE() {
  const [ano, setAno] = useState("2024");
  const [uf, setUf] = useState("SP");
  const [syncStatuses, setSyncStatuses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadSyncStatus = useCallback(async () => {
    try {
      const res = await tseApi.getData({ action: "status", ano: "", uf: "" });
      if (res.data?.success) setSyncStatuses(res.data.statuses || []);
    } catch (e) {
      console.error("Erro ao carregar status:", e);
    }
  }, []);

  useEffect(() => { loadSyncStatus(); }, [loadSyncStatus]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSyncStatus();
    setRefreshing(false);
  };

  const handleResolveSource = async () => {
    setLoading(true);
    try {
      await tseApi.getData({
        action: "resolve_source", ano, uf, dataset_tipo: "votacao_secao",
      });
    } catch (e) { /* silencioso — só atualiza cache */ }
    setLoading(false);
  };

  const currentSync = syncStatuses.find(s => s.ano === parseInt(ano) && s.uf === uf);

  const importedCount = syncStatuses.filter(s => s.status === 'importado').length;
  const totalPossible = ANOS.length * ESTADOS.length;
  const progressPct = totalPossible > 0 ? (importedCount / totalPossible) * 100 : 0;

  const statusBadge = (status) => {
    const map = {
      importado:    { icon: CheckCircle2, color: "bg-emerald-100 text-emerald-700", label: "Importado" },
      importando:   { icon: RefreshCw,    color: "bg-blue-100 text-blue-700",     label: "Importando", spin: true },
      erro:         { icon: XCircle,      color: "bg-red-100 text-red-700",       label: "Erro" },
      nao_importado:{ icon: AlertTriangle,color: "bg-amber-100 text-amber-700",   label: "Não importado" },
      desatualizado:{ icon: Clock,        color: "bg-orange-100 text-orange-700",  label: "Desatualizado" },
    };
    const m = map[status] || map.nao_importado;
    return (
      <Badge className={`text-xs ${m.color}`}>
        <m.icon className={`w-3 h-3 mr-1 ${m.spin ? 'animate-spin' : ''}`} />
        {m.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6 p-4 lg:p-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Database className="w-5 h-5 text-blue-400" />
              <h1 className="text-xl font-bold">Base de Dados TSE</h1>
            </div>
            <p className="text-slate-300 text-sm max-w-2xl">
              Os dados eleitorais oficiais são processados por um serviço externo de ETL e armazenados localmente para consultas rápidas.
              O Base44 atua como consumidor dos dados já normalizados — sem processar arquivos ZIP ou CSV.
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-400">
            <Server className="w-4 h-4" />
            <span>ETL externo</span>
            <ArrowRight className="w-3 h-3" />
            <Database className="w-4 h-4 text-blue-400" />
            <span className="text-blue-400">Base44</span>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <Card className="border-slate-200">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Ano</label>
              <select value={ano} onChange={(e) => setAno(e.target.value)}
                className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-sm">
                {ANOS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">UF</label>
              <select value={uf} onChange={(e) => setUf(e.target.value)}
                className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-sm">
                {ESTADOS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}
              className="flex items-center gap-1.5">
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Atualizando...' : 'Atualizar Status'}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleResolveSource} disabled={loading}
              className="text-xs text-slate-500">
              <ExternalLink className="w-3 h-3 mr-1" />
              Verificar fonte CDN
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Status da Base Local */}
      <Card className="border-slate-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="w-4 h-4 text-blue-600" />
            Status da Base — {uf}/{ano}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <div>
              <p className="text-xs text-slate-500">Status</p>
              <div className="mt-1">{statusBadge(currentSync?.status || 'nao_importado')}</div>
            </div>
            <div>
              <p className="text-xs text-slate-500">Última Atualização</p>
              <p className="text-sm font-medium text-slate-700 mt-1">
                {currentSync?.data_ultima_sincronizacao
                  ? moment(currentSync.data_ultima_sincronizacao).format('DD/MM/YYYY HH:mm')
                  : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Registros</p>
              <p className="text-lg font-bold text-slate-800 mt-1">
                {currentSync?.total_linhas?.toLocaleString() || '0'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Fonte</p>
              <p className="text-sm text-slate-700 mt-1">
                {currentSync?.status === 'importado' ? 'TSE (CDN oficial)' : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Dataset</p>
              <p className="text-sm font-medium text-slate-700 mt-1">Votação por Seção</p>
            </div>
          </div>

          {currentSync?.status === 'nao_importado' && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                Esta base ainda não foi importada. Os dados serão processados pelo serviço externo de ETL
                e enviados em lotes para o Base44. Consulte a documentação do <strong>esperancar-tse-etl</strong>.
              </p>
            </div>
          )}

          {currentSync?.mensagem_erro && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <strong>Erro:</strong> {currentSync.mensagem_erro}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Panorama de Sincronização */}
      <Card className="border-slate-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Database className="w-4 h-4 text-blue-600" />
            Panorama de Sincronização
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 mb-3 text-xs text-slate-500">
            <Progress value={progressPct} className="h-2 flex-1" />
            <span className="whitespace-nowrap">{importedCount} / {totalPossible} bases</span>
          </div>
          {importedCount === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Database className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Nenhuma base importada ainda.</p>
              <p className="text-xs mt-1">Configure o serviço externo de ETL para iniciar a carga.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-1.5 max-h-64 overflow-y-auto">
              {syncStatuses.filter(s => s.status === 'importado').map(s => (
                <div key={`${s.ano}-${s.uf}`}
                  className="flex items-center gap-1 px-2 py-1.5 rounded bg-emerald-50 text-xs text-emerald-700">
                  <CheckCircle2 className="w-3 h-3 shrink-0" />
                  <span className="truncate">{s.uf}/{s.ano}</span>
                </div>
              ))}
            </div>
          )}
          {/* Mostrar também os não importados em cinza claro */}
          <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-1.5 max-h-32 overflow-y-auto">
            {syncStatuses.filter(s => s.status !== 'importado').slice(0, 16).map(s => (
              <div key={`${s.ano}-${s.uf}`}
                className="flex items-center gap-1 px-2 py-1.5 rounded bg-slate-50 text-xs text-slate-400">
                <Clock className="w-3 h-3 shrink-0" />
                <span className="truncate">{s.uf}/{s.ano}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Referência para o ETL externo */}
      <Card className="border-slate-200 bg-slate-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Server className="w-5 h-5 text-slate-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-slate-700">Serviço Externo de ETL</p>
              <p className="text-xs text-slate-500 mt-0.5">
                O processamento dos arquivos do TSE (download, descompressão ZIP, parsing CSV, filtro por UF/município)
                é feito pelo <strong>esperancar-tse-etl</strong> — um serviço Python/Node.js rodando fora do Base44.
                Os dados normalizados são enviados em lotes via <code className="bg-slate-200 px-1 rounded">receiveTSEBatch</code>.
              </p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <a href="https://cdn.tse.jus.br/estatistica/sead/odsele/votacao_secao/" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 hover:underline">
                  <ExternalLink className="w-3 h-3" />CDN TSE — Votação por Seção
                </a>
                <span className="text-slate-300">|</span>
                <span className="text-slate-500">
                  Endpoint: <code className="bg-slate-200 px-1 rounded">POST /receiveTSEBatch</code>
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}