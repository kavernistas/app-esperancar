import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import ImportProgressPanel from "@/components/electoral/ImportProgressPanel";
import {
  Database, Search, CheckCircle2, XCircle, AlertTriangle,
  Download, Upload, FileUp, ExternalLink, RefreshCw,
  Wifi, WifiOff, Clock, Activity, Info, FileText, MapPin
} from "lucide-react";
import moment from "moment";

const ESTADOS = ["AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"];
const ANOS = [2012,2014,2016,2018,2020,2022,2024];

const DATASET_TIPOS = [
  { value: "votacao_secao", label: "Votação por Seção" },
  { value: "votacao_nominal_munzona", label: "Votação Nominal (Mun/Zona)" },
  { value: "detalhe_apuracao_munzona", label: "Detalhe Apuração (Mun/Zona)" },
  { value: "perfil_eleitorado_secao", label: "Perfil do Eleitorado" },
];

export default function DiagnosticoTSE() {
  const [ano, setAno] = useState("2024");
  const [uf, setUf] = useState("SP");
  const [municipio, setMunicipio] = useState("");
  const [dataset, setDataset] = useState("votacao_secao");
  const [sourceResult, setSourceResult] = useState(null);
  const [syncStatuses, setSyncStatuses] = useState([]);
  const [testing, setTesting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [cdHttpStatus, setCdHttpStatus] = useState(null);
  const [lastJobId, setLastJobId] = useState(null);

  const loadSyncStatus = useCallback(async () => {
    try {
      const res = await base44.functions.invoke("tseDataSync", { action: "sync_status", ano: "", uf: "" });
      if (res.data?.success) setSyncStatuses(res.data.statuses || []);
    } catch (e) {
      console.error("Erro ao carregar status:", e);
    }
  }, []);

  useEffect(() => { loadSyncStatus(); }, [loadSyncStatus]);

  const currentSync = syncStatuses.find(s => s.ano === parseInt(ano) && s.uf === uf);

  const handleTestSource = async () => {
    setTesting(true);
    setSourceResult(null);
    setCdHttpStatus(null);
    setStatusMessage("");

    try {
      // Testar CDN via resolve
      const res = await base44.functions.invoke("tseDataSync", {
        action: "resolve_source",
        ano,
        uf,
        dataset_tipo: dataset,
      });

      if (res.data?.success) {
        setSourceResult(res.data.fonte);
        if (res.data.fonte.status === 'disponivel') {
          setCdHttpStatus(200);
        } else if (res.data.fonte.status === 'muito_grande') {
          setCdHttpStatus(200);
        } else {
          setCdHttpStatus(404);
        }
      }
    } catch (e) {
      setStatusMessage("Erro ao testar fonte: " + (e.message || "Falha de conexão"));
      setCdHttpStatus(0);
    }
    setTesting(false);
  };

  const handleFileUpload = async () => {
    if (!uploadFile) return;
    setImporting(true);
    setStatusMessage("");
    try {
      const uploadRes = await base44.integrations.Core.UploadFile({ file: uploadFile });
      const importRes = await base44.functions.invoke("tseDataSync", {
        action: "start_import",
        ano,
        uf,
        municipio,
        file_url: uploadRes.file_url,
        dataset_tipo: dataset,
      });
      if (importRes.data?.success) {
        setLastJobId(importRes.data.job_id);
        setStatusMessage(`✅ Importação iniciada! Job #${importRes.data.job_id?.slice(-6)} — acompanhe abaixo.`);
        setUploadFile(null);
        if (importRes.data.status === 'concluido') {
          await loadSyncStatus();
        }
      } else {
        const msg = importRes.data?.message || importRes.data?.error || 'Erro na importação';
        setStatusMessage(`❌ ${msg}`);
      }
    } catch (e) {
      const errData = e?.response?.data;
      const msg = errData?.message || errData?.error || 'Erro ao processar arquivo.';
      setStatusMessage(`❌ ${msg}`);
    }
    setImporting(false);
  };

  const statusFonte = sourceResult?.status;
  const podeBaixar = statusFonte === 'disponivel';
  const exigeUpload = statusFonte === 'muito_grande' || statusFonte === 'indisponivel';
  const tamanhoMB = sourceResult?.tamanho_estimado ? (sourceResult.tamanho_estimado / (1024 * 1024)).toFixed(1) : null;

  const syncBadge = () => {
    if (!currentSync) return <Badge variant="outline" className="text-xs text-slate-400">Sem registro</Badge>;
    if (currentSync.status === 'importado') return <Badge className="text-xs bg-emerald-100 text-emerald-700"><CheckCircle2 className="w-3 h-3 mr-0.5" />Importado ({currentSync.total_linhas?.toLocaleString()} registros)</Badge>;
    if (currentSync.status === 'importando') return <Badge className="text-xs bg-blue-100 text-blue-700"><RefreshCw className="w-3 h-3 mr-0.5 animate-spin" />Importando</Badge>;
    if (currentSync.status === 'erro') return <Badge className="text-xs bg-red-100 text-red-700"><XCircle className="w-3 h-3 mr-0.5" />Erro</Badge>;
    return <Badge className="text-xs bg-amber-100 text-amber-700"><AlertTriangle className="w-3 h-3 mr-0.5" />Não importado</Badge>;
  };

  return (
    <div className="space-y-6 p-4 lg:p-8">
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="w-5 h-5 text-blue-400" />
          <h1 className="text-xl font-bold">Diagnóstico TSE</h1>
        </div>
        <p className="text-slate-300 text-sm">
          Verifique a disponibilidade dos dados oficiais no CDN do TSE e o status da base local.
        </p>
      </div>

      {/* Filtros */}
      <Card className="border-slate-200">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Ano</label>
              <select value={ano} onChange={(e) => setAno(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                {ANOS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">UF</label>
              <select value={uf} onChange={(e) => setUf(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                {ESTADOS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Município (opcional)</label>
              <input type="text" value={municipio} onChange={(e) => setMunicipio(e.target.value)}
                placeholder="Ex: SÃO PAULO" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Dataset</label>
              <select value={dataset} onChange={(e) => setDataset(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                {DATASET_TIPOS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleTestSource} disabled={testing} className="w-full bg-blue-600 hover:bg-blue-700">
                <Search className="w-4 h-4 mr-1.5" />
                {testing ? 'Testando...' : 'Testar Fonte'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status da base local */}
      <Card className="border-slate-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="w-4 h-4 text-blue-600" />
            Base Local — {uf}/{ano}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-slate-500">Status da Sincronização</p>
              <div className="mt-1">{syncBadge()}</div>
            </div>
            <div>
              <p className="text-xs text-slate-500">Última Sincronização</p>
              <p className="text-sm font-medium text-slate-700 mt-1">
                {currentSync?.data_ultima_sincronizacao
                  ? moment(currentSync.data_ultima_sincronizacao).format('DD/MM/YYYY HH:mm')
                  : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Total de Registros</p>
              <p className="text-sm font-medium text-slate-700 mt-1">
                {currentSync?.total_linhas?.toLocaleString() || '0'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Fonte Utilizada</p>
              <p className="text-sm font-medium text-slate-700 mt-1 truncate max-w-[200px]" title={currentSync?.fonte_url}>
                {currentSync?.fonte_url ? 'Arquivo oficial TSE' : '—'}
              </p>
            </div>
          </div>
          {currentSync?.mensagem_erro && (
            <div className="mt-3 p-2 bg-red-50 rounded text-xs text-red-700">
              <strong>Erro:</strong> {currentSync.mensagem_erro}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resultado do teste de fonte */}
      {sourceResult && (
        <Card className={`border ${podeBaixar ? 'border-emerald-200' : exigeUpload ? 'border-amber-200' : 'border-red-200'}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              {podeBaixar ? <Wifi className="w-4 h-4 text-emerald-600" /> :
               exigeUpload ? <WifiOff className="w-4 h-4 text-amber-600" /> :
               <XCircle className="w-4 h-4 text-red-600" />}
              Diagnóstico da Fonte TSE
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-xs text-slate-500">URL Oficial</p>
                <a href={sourceResult.fonte_url} target="_blank" rel="noopener noreferrer"
                  className="text-blue-600 hover:underline break-all text-xs">
                  <ExternalLink className="w-3 h-3 inline mr-1" />
                  {sourceResult.fonte_url}
                </a>
              </div>
              <div>
                <p className="text-xs text-slate-500">Status HTTP CDN</p>
                <p className={`font-semibold mt-1 ${cdHttpStatus === 200 ? 'text-emerald-600' : cdHttpStatus === 404 ? 'text-red-600' : 'text-amber-600'}`}>
                  {cdHttpStatus === 200 ? '200 — Disponível' :
                   cdHttpStatus === 404 ? '404 — Não encontrado' :
                   cdHttpStatus === 0 ? 'Erro de conexão' : `HTTP ${cdHttpStatus}`}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Tamanho Estimado</p>
                <p className="font-semibold text-slate-700 mt-1">
                  {tamanhoMB ? `${tamanhoMB} MB` : 'Indisponível'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Formato</p>
                <p className="font-semibold text-slate-700 mt-1 uppercase">{sourceResult.formato || 'zip'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Modo Recomendado</p>
                {podeBaixar ? (
                  <Badge className="mt-1 bg-emerald-100 text-emerald-700 text-xs"><Download className="w-3 h-3 mr-0.5" />Download direto</Badge>
                ) : (
                  <Badge className="mt-1 bg-amber-100 text-amber-700 text-xs"><Upload className="w-3 h-3 mr-0.5" />Upload manual</Badge>
                )}
              </div>
              <div>
                <p className="text-xs text-slate-500">Status de Verificação</p>
                <p className="font-semibold text-slate-700 mt-1">{sourceResult.status === 'disponivel' ? '✅ Disponível' :
                  sourceResult.status === 'muito_grande' ? '⚠️ Muito grande' :
                  sourceResult.status === 'indisponivel' ? '❌ Indisponível' : sourceResult.status}</p>
              </div>
            </div>

            {sourceResult.observacao && (
              <div className="mt-3 p-2 bg-slate-50 rounded text-xs text-slate-600">
                <Info className="w-3 h-3 inline mr-1" />{sourceResult.observacao}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Ações */}
      {sourceResult && (
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              Ações Disponíveis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {podeBaixar && (
              <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-emerald-800">Download automático disponível</p>
                  <p className="text-xs text-emerald-600">O arquivo tem {tamanhoMB} MB e pode ser baixado diretamente.</p>
                </div>
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={async () => {
                    setImporting(true);
                    setStatusMessage("");
                    try {
                      const res = await base44.functions.invoke("tseDataSync", { action: "sync", ano, uf, dataset_tipo: dataset });
                      if (res.data?.success) {
                        setStatusMessage(`✅ ${res.data.message || 'Sincronizado!'}`);
                        await loadSyncStatus();
                      } else {
                        setStatusMessage(`⚠️ ${res.data?.message || 'Erro na sincronização'}`);
                      }
                    } catch (e) {
                      setStatusMessage("❌ Falha na sincronização automática.");
                    }
                    setImporting(false);
                  }}
                  disabled={importing}>
                  {importing ? <RefreshCw className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Download className="w-3.5 h-3.5 mr-1" />}
                  {importing ? 'Baixando...' : 'Baixar e Importar'}
                </Button>
              </div>
            )}

            {exigeUpload && (
              <div className="p-3 bg-amber-50 rounded-lg space-y-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">Upload manual necessário</p>
                    <p className="text-xs text-amber-600">
                      {tamanhoMB
                        ? `Arquivo de ${tamanhoMB} MB — processamento assíncrono em streaming. Para estados grandes, filtre por município.`
                        : 'Fonte indisponível para download automático.'}
                    </p>
                  </div>
                </div>
                {sourceResult.fonte_url && (
                  <a href={sourceResult.fonte_url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 underline">
                    <ExternalLink className="w-3 h-3" />Baixar do CDN do TSE
                  </a>
                )}
                <div className="flex items-center gap-3">
                  <input type="file" accept=".csv,.zip" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} className="hidden" id="diag-file-input" />
                  <Button variant="outline" size="sm" onClick={() => document.getElementById('diag-file-input')?.click()}
                    className="text-xs border-amber-300 text-amber-700">
                    <FileUp className="w-3.5 h-3.5 mr-1" />
                    {uploadFile ? uploadFile.name : "Selecionar CSV/ZIP"}
                  </Button>
                  {uploadFile && (
                    <Button size="sm" onClick={handleFileUpload} disabled={importing} className="bg-amber-600 hover:bg-amber-700 text-xs">
                      <Upload className="w-3.5 h-3.5 mr-1" />
                      {importing ? "Importando..." : "Importar Arquivo"}
                    </Button>
                  )}
                </div>
              </div>
            )}

            {statusMessage && (
              <div className={`p-3 rounded-lg text-sm ${
                statusMessage.startsWith('✅') ? 'bg-emerald-50 text-emerald-800' :
                statusMessage.startsWith('❌') ? 'bg-red-50 text-red-800' :
                'bg-blue-50 text-blue-800'
              }`}>
                {statusMessage}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Monitor de Importação */}
      <ImportProgressPanel onComplete={loadSyncStatus} />

      {/* Grid de bases sincronizadas */}
      <Card className="border-slate-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Database className="w-4 h-4 text-blue-600" />
            Panorama de Sincronização
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 mb-3 text-xs text-slate-500">
            <Progress
              value={syncStatuses.filter(s => s.status === 'importado').length / (ANOS.length * ESTADOS.length) * 100}
              className="h-2 flex-1"
            />
            <span>{syncStatuses.filter(s => s.status === 'importado').length} / {ANOS.length * ESTADOS.length}</span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-1.5 max-h-48 overflow-y-auto">
            {syncStatuses?.filter(s => s.status === 'importado').map(s => (
              <div key={`${s.ano}-${s.uf}`} className="flex items-center gap-1 px-2 py-1.5 rounded bg-emerald-50 text-xs text-emerald-700">
                <CheckCircle2 className="w-3 h-3" />
                {s.uf}/{s.ano}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}