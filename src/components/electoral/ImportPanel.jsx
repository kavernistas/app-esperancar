import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Database, Download, CheckCircle2, AlertTriangle, XCircle, Upload, FileUp, ExternalLink } from "lucide-react";
import { base44 } from "@/api/base44Client";
import moment from "moment";

const ESTADOS = ["AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"];
const ANOS = [2012,2014,2016,2018,2020,2022,2024];
const TSE_URL = "https://dadosabertos.tse.jus.br/dataset/resultados-2024";

export default function ImportPanel({ syncStatuses, onSync, syncing }) {
  const [selectedAno, setSelectedAno] = useState("2024");
  const [selectedUF, setSelectedUF] = useState("GO");
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [needsUpload, setNeedsUpload] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");
  const fileInputRef = useRef(null);

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

  const handleSyncClick = async () => {
    setNeedsUpload(false);
    setSyncMessage("");
    try {
      const res = await onSync(selectedAno, selectedUF);
      if (res?.needs_upload) {
        setNeedsUpload(true);
        setSyncMessage(res.message || "API TSE indisponível. Faça upload do arquivo CSV.");
      }
    } catch (e) {
      setSyncMessage("Erro na sincronização. Tente o upload manual.");
      setNeedsUpload(true);
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
      // Upload do arquivo
      const uploadRes = await base44.integrations.Core.UploadFile({ file: uploadFile });
      const fileUrl = uploadRes.file_url;

      // Importar dados
      const importRes = await base44.functions.invoke("tseDataSync", {
        action: "import_file",
        ano: selectedAno,
        uf: selectedUF,
        file_url: fileUrl,
      });

      if (importRes.data?.success) {
        setSyncMessage(`Importado com sucesso! ${importRes.data.total_importado} registros.`);
        setNeedsUpload(false);
        setUploadFile(null);
        // Recarregar status
        window.location.reload();
      } else {
        setSyncMessage(importRes.data?.error || "Erro na importação.");
      }
    } catch (e) {
      setSyncMessage("Erro ao processar arquivo. Verifique o formato CSV.");
    }
    setUploading(false);
  };

  const currentStatus = getStatus(selectedAno, selectedUF);
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
              <select value={selectedAno} onChange={(e) => setSelectedAno(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                {ANOS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">UF</label>
              <select value={selectedUF} onChange={(e) => setSelectedUF(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                {ESTADOS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {statusBadge(currentStatus?.status)}
              {currentStatus?.data_ultima_sincronizacao && (
                <span className="text-xs text-slate-400">{moment(currentStatus.data_ultima_sincronizacao).format('DD/MM/YYYY')}</span>
              )}
            </div>
            <Button onClick={handleSyncClick} disabled={syncing || currentStatus?.status === 'importando'} className="bg-blue-600 hover:bg-blue-700">
              <Download className="w-4 h-4 mr-1.5" />
              {syncing ? 'Sincronizando...' : 'Sincronizar'}
            </Button>
          </div>

          {/* Upload file option when sync is unavailable */}
          {needsUpload && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800">API do TSE indisponível para sincronização automática</p>
                  <p className="text-xs text-amber-600 mt-1">
                    Faça o download do arquivo CSV no portal do TSE e importe manualmente.
                  </p>
                </div>
              </div>

              <a
                href={TSE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 underline"
              >
                <ExternalLink className="w-3 h-3" />
                Acessar portal TSE — baixar "Votação nominal por município e zona"
              </a>

              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.zip"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs border-amber-300 text-amber-700 hover:bg-amber-100"
                >
                  <FileUp className="w-3.5 h-3.5 mr-1" />
                  {uploadFile ? uploadFile.name : "Selecionar arquivo CSV/ZIP"}
                </Button>
                {uploadFile && (
                  <Button size="sm" onClick={handleFileUpload} disabled={uploading} className="bg-amber-600 hover:bg-amber-700 text-xs">
                    <Upload className="w-3.5 h-3.5 mr-1" />
                    {uploading ? "Importando..." : "Importar Arquivo"}
                  </Button>
                )}
              </div>

              {syncMessage && (
                <p className="text-xs text-slate-600 bg-white/50 p-2 rounded">{syncMessage}</p>
              )}
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