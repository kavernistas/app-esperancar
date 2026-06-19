import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Database, Download, CheckCircle2, AlertTriangle, XCircle,
  Upload, FileUp, ExternalLink, Search, RefreshCw, Info
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import moment from "moment";

const ESTADOS = ["AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"];
const ANOS = [2012,2014,2016,2018,2020,2022,2024];

const DATASET_TIPOS = [
  { value: "votacao_secao", label: "Votação por Seção" },
  { value: "votacao_nominal_munzona", label: "Votação Nominal (Mun/Zona)" },
  { value: "detalhe_apuracao_munzona", label: "Detalhe Apuração (Mun/Zona)" },
  { value: "perfil_eleitorado_secao", label: "Perfil do Eleitorado" },
];

export default function ImportPanel({ syncStatuses, onSync, syncing }) {
  const [selectedAno, setSelectedAno] = useState("2024");
  const [selectedUF, setSelectedUF] = useState("GO");
  const [selectedDataset, setSelectedDataset] = useState("votacao_secao");
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [sourceInfo, setSourceInfo] = useState(null);
  const [syncMessage, setSyncMessage] = useState("");
  const [syncResult, setSyncResult] = useState(null);
  const fileInputRef = useRef(null);

  const getStatus = (ano, uf) => {
    return syncStatuses?.find(s => s.ano === parseInt(ano) && s.uf === uf);
  };

  const currentStatus = getStatus(selectedAno, selectedUF);
  const importedCount = syncStatuses?.filter(s => s.status === 'importado').length || 0;
  const totalPossible = ANOS.length * ESTADOS.length;

  const statusBadge = (status) => {
    if (!status || status === 'nao_importado') return <Badge variant="outline" className="text-xs text-slate-400">Não importado</Badge>;
    if (status === 'importado') return <Badge className="text-xs bg-emerald-100 text-emerald-700"><CheckCircle2 className="w-3 h-3 mr-0.5" />Importado</Badge>;
    if (status === 'importando') return <Badge className="text-xs bg-blue-100 text-blue-700"><RefreshCw className="w-3 h-3 mr-0.5 animate-spin" />Importando</Badge>;
    if (status === 'erro') return <Badge className="text-xs bg-red-100 text-red-700"><XCircle className="w-3 h-3 mr-0.5" />Erro</Badge>;
    return null;
  };

  // Verificar fonte ao mudar ano/UF/dataset
  useEffect(() => {
    setSourceInfo(null);
    setSyncMessage("");
    setSyncResult(null);
  }, [selectedAno, selectedUF, selectedDataset]);

  const handleResolveSource = async () => {
    setResolving(true);
    setSourceInfo(null);
    setSyncMessage("");
    try {
      const res = await base44.functions.invoke("tseDataSync", {
        action: "resolve_source",
        ano: selectedAno,
        uf: selectedUF,
        dataset_tipo: selectedDataset,
      });
      if (res.data?.success) {
        setSourceInfo(res.data.fonte);
        const fonte = res.data.fonte;
        if (fonte.status === 'disponivel') {
          setSyncMessage(`Arquivo encontrado no CDN do TSE. Pronto para sincronizar${fonte.tamanho_estimado ? ` (${(fonte.tamanho_estimado/(1024*1024)).toFixed(1)} MB)` : ''}.`);
        } else if (fonte.status === 'muito_grande') {
          setSyncMessage(`Arquivo de ${(fonte.tamanho_estimado/(1024*1024)).toFixed(1)} MB — acima do limite para download automático. Faça upload manual.`);
        } else {
          setSyncMessage('Fonte não encontrada no CDN. Use o upload manual de arquivo CSV/ZIP.');
        }
      }
    } catch (e) {
      setSyncMessage("Erro ao verificar fonte no CDN do TSE.");
    }
    setResolving(false);
  };

  const handleSyncClick = async () => {
    setSyncResult(null);
    setSyncMessage("");
    try {
      const res = await onSync(selectedAno, selectedUF, selectedDataset);
      if (res) {
        setSyncResult(res);
        if (res.needs_upload) {
          setSyncMessage(res.message || "Download automático indisponível. Faça upload do arquivo.");
        } else if (res.success) {
          setSyncMessage(res.message || `${res.total_importado} registros importados com sucesso.`);
        }
      }
    } catch (e) {
      setSyncMessage("Erro na sincronização. Verifique a conexão e tente novamente.");
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setUploadFile(file);
  };

  const handleFileUpload = async () => {
    if (!uploadFile) return;
    setUploading(true);
    try {
      const uploadRes = await base44.integrations.Core.UploadFile({ file: uploadFile });
      const fileUrl = uploadRes.file_url;

      const importRes = await base44.functions.invoke("tseDataSync", {
        action: "import_file",
        ano: selectedAno,
        uf: selectedUF,
        file_url: fileUrl,
        dataset_tipo: selectedDataset,
      });

      if (importRes.data?.success) {
        setSyncResult(importRes.data);
        setSyncMessage(importRes.data.message || `Importado com sucesso! ${importRes.data.total_importado} registros.`);
        setUploadFile(null);
        setTimeout(() => window.location.reload(), 1500);
      } else {
        const msg = importRes.data?.message || importRes.data?.error || "Erro na importação. Verifique o formato do arquivo.";
        setSyncMessage(msg);
      }
    } catch (e) {
      const errData = e?.response?.data;
      const msg = errData?.message || errData?.error || 'Erro ao processar arquivo. O servidor pode ter excedido o tempo limite para arquivos grandes.';
      setSyncMessage(msg);
    }
    setUploading(false);
  };

  const needsUpload = syncResult?.needs_upload || (sourceInfo && (sourceInfo.status === 'muito_grande' || sourceInfo.status === 'indisponivel'));

  return (
    <div className="space-y-4">
      {/* Painel principal */}
      <Card className="border-slate-200 bg-gradient-to-br from-white to-slate-50/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" />
            Sincronizar Dados Oficiais TSE
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>{importedCount} de {totalPossible} bases importadas</span>
            <Progress value={Math.round((importedCount / totalPossible) * 100)} className="h-1.5 flex-1" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Ano</label>
              <select value={selectedAno} onChange={(e) => setSelectedAno(e.target.value)} className="w-full rounded-lg border border-slate-200 px-2 py-2 text-sm">
                {ANOS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">UF</label>
              <select value={selectedUF} onChange={(e) => setSelectedUF(e.target.value)} className="w-full rounded-lg border border-slate-200 px-2 py-2 text-sm">
                {ESTADOS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Dataset</label>
              <select value={selectedDataset} onChange={(e) => setSelectedDataset(e.target.value)} className="w-full rounded-lg border border-slate-200 px-2 py-2 text-sm">
                {DATASET_TIPOS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
          </div>

          {/* Status atual */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {statusBadge(currentStatus?.status)}
              {currentStatus?.data_ultima_sincronizacao && (
                <span className="text-xs text-slate-400">{moment(currentStatus.data_ultima_sincronizacao).format('DD/MM/YYYY HH:mm')}</span>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResolveSource}
                disabled={resolving}
                className="text-xs"
              >
                <Search className="w-3.5 h-3.5 mr-1" />
                {resolving ? 'Verificando...' : 'Verificar Fonte'}
              </Button>
              <Button
                onClick={handleSyncClick}
                disabled={syncing || currentStatus?.status === 'importando'}
                className="bg-blue-600 hover:bg-blue-700 text-xs"
              >
                <Download className="w-3.5 h-3.5 mr-1" />
                {syncing ? 'Sincronizando...' : 'Sincronizar'}
              </Button>
            </div>
          </div>

          {/* Info da fonte */}
          {sourceInfo && (
            <div className={`p-3 rounded-lg text-xs ${
              sourceInfo.status === 'disponivel' ? 'bg-emerald-50 border border-emerald-200' :
              sourceInfo.status === 'muito_grande' ? 'bg-amber-50 border border-amber-200' :
              'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-start gap-2">
                {sourceInfo.status === 'disponivel' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5" /> :
                 sourceInfo.status === 'muito_grande' ? <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" /> :
                 <Info className="w-4 h-4 text-red-600 mt-0.5" />}
                <div className="flex-1">
                  <p className="font-medium text-slate-700">
                    {sourceInfo.status === 'disponivel' ? 'Fonte disponível no CDN do TSE' :
                     sourceInfo.status === 'muito_grande' ? 'Arquivo grande — requer upload manual' :
                     'Fonte indisponível no CDN'}
                  </p>
                  <p className="text-slate-500 mt-0.5 break-all">{sourceInfo.fonte_url}</p>
                  {sourceInfo.tamanho_estimado > 0 && (
                    <p className="text-slate-400 mt-0.5">Tamanho: {(sourceInfo.tamanho_estimado/(1024*1024)).toFixed(1)} MB</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {syncMessage && !sourceInfo && (
            <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded">{syncMessage}</p>
          )}

          {/* Upload manual */}
          {needsUpload && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Importação manual necessária</p>
                  <p className="text-xs text-amber-600 mt-1">
                    {sourceInfo?.status === 'muito_grande'
                      ? `O arquivo oficial do TSE tem ${(sourceInfo.tamanho_estimado/(1024*1024)).toFixed(0)} MB e excede o limite de 50 MB para download automático.`
                      : 'O arquivo oficial não pôde ser baixado automaticamente do CDN do TSE.'}
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    Acesse o Portal de Dados Abertos do TSE, baixe o CSV e faça upload aqui.
                  </p>
                </div>
              </div>

              {sourceInfo?.fonte_url && (
                <a href={sourceInfo.fonte_url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 underline">
                  <ExternalLink className="w-3 h-3" />
                  Baixar arquivo oficial do TSE
                </a>
              )}

              <div className="flex items-center gap-3">
                <input ref={fileInputRef} type="file" accept=".csv,.zip" onChange={handleFileChange} className="hidden" />
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}
                  className="text-xs border-amber-300 text-amber-700 hover:bg-amber-100">
                  <FileUp className="w-3.5 h-3.5 mr-1" />
                  {uploadFile ? uploadFile.name : "Selecionar CSV/ZIP"}
                </Button>
                {uploadFile && (
                  <Button size="sm" onClick={handleFileUpload} disabled={uploading} className="bg-amber-600 hover:bg-amber-700 text-xs">
                    <Upload className="w-3.5 h-3.5 mr-1" />
                    {uploading ? "Importando..." : "Importar Arquivo"}
                  </Button>
                )}
              </div>

              {syncMessage && (
                <p className="text-xs text-slate-700 bg-white/60 p-2 rounded">{syncMessage}</p>
              )}
            </div>
          )}

          {/* Resultado */}
          {syncResult && !syncResult.needs_upload && syncResult.success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <p className="text-sm font-medium text-emerald-800">{syncResult.message}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grid de status */}
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