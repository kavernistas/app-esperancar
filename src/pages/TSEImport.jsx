import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Download, Eye, CheckCircle, AlertTriangle, Loader2,
  FileDown, Database, Info, RefreshCw, WifiOff
} from "lucide-react";
import ImportPreviewTable from "@/components/tse/ImportPreviewTable";
import ImportProgressCard from "@/components/tse/ImportProgressCard";

const ANOS = ["2024", "2022", "2020", "2018", "2016", "2014", "2012"];
const ESTADOS = [
  "AC","AL","AM","AP","BA","CE","DF","ES","GO","MA",
  "MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN",
  "RO","RR","RS","SC","SE","SP","TO",
];
const CARGOS = [
  { value: "all", label: "Todos os cargos" },
  { value: "presidente", label: "Presidente" },
  { value: "governador", label: "Governador" },
  { value: "senador", label: "Senador" },
  { value: "deputado_federal", label: "Deputado Federal" },
  { value: "deputado_estadual", label: "Deputado Estadual" },
  { value: "prefeito", label: "Prefeito" },
  { value: "vereador", label: "Vereador" },
];
const LIMITS = [
  { value: "100", label: "100 registros" },
  { value: "500", label: "500 registros" },
  { value: "1000", label: "1.000 registros" },
  { value: "5000", label: "5.000 registros" },
];

export default function TSEImport() {
  const [ano, setAno] = useState("2024");
  const [uf, setUf] = useState("");
  const [cargo, setCargo] = useState("all");
  const [limit, setLimit] = useState("500");

  const [previewing, setPreviewing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState(null);
  const [importResult, setImportResult] = useState(null);

  const handlePreview = async () => {
    if (!uf) return;
    setPreviewing(true);
    setPreview(null);
    setImportResult(null);
    const res = await base44.functions.invoke("tseImportResults", {
      ano, uf, cargo: cargo === "all" ? "" : cargo, mode: "preview", limit: parseInt(limit),
    });
    setPreviewing(false);
    if (res.data?.success) setPreview(res.data);
  };

  const handleImport = async () => {
    if (!preview) return;
    setImporting(true);
    setImportResult(null);
    const res = await base44.functions.invoke("tseImportResults", {
      ano, uf, cargo: cargo === "all" ? "" : cargo, mode: "import", limit: parseInt(limit),
    });
    setImporting(false);
    if (res.data) setImportResult(res.data);
  };

  const canPreview = !!uf && !previewing && !importing;
  const canImport = !!preview && !importing && !previewing;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-900 to-green-700 rounded-2xl p-6 lg:p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}
        />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-white/20 text-white border-white/20 text-xs">
                <FileDown className="w-3 h-3 mr-1" />
                CDN Oficial TSE
              </Badge>
              <Badge className="bg-yellow-400/30 text-yellow-100 border-yellow-300/30 text-xs">
                2012 – 2024
              </Badge>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold mb-1">
              Importação de Resultados Eleitorais
            </h1>
            <p className="text-green-100 text-sm max-w-xl">
              Baixe e importe resultados de votação nominal direto da CDN do TSE, por UF e ano eleitoral, para o banco de dados da plataforma.
            </p>
          </div>
          <div className="hidden lg:grid grid-cols-3 gap-3 text-center">
            {[
              { label: "Fonte", value: "CDN TSE" },
              { label: "Formato", value: "CSV ZIP" },
              { label: "Destino", value: "ElectoralData" },
            ].map((s) => (
              <div key={s.label} className="bg-white/10 rounded-xl px-4 py-3">
                <p className="text-lg font-bold">{s.value}</p>
                <p className="text-green-200 text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Config card */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="w-4 h-4 text-green-600" />
            Configurar Importação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Ano da Eleição *</label>
              <Select value={ano} onValueChange={setAno}>
                <SelectTrigger className="h-11 border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ANOS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Estado (UF) *</label>
              <Select value={uf} onValueChange={setUf}>
                <SelectTrigger className="h-11 border-slate-200">
                  <SelectValue placeholder="Selecione a UF" />
                </SelectTrigger>
                <SelectContent>
                  {ESTADOS.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Filtrar por Cargo</label>
              <Select value={cargo} onValueChange={setCargo}>
                <SelectTrigger className="h-11 border-slate-200">
                  <SelectValue placeholder="Todos os cargos" />
                </SelectTrigger>
                <SelectContent>
                  {CARGOS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Limite de Registros</label>
              <Select value={limit} onValueChange={setLimit}>
                <SelectTrigger className="h-11 border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LIMITS.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Info box */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 flex items-start gap-2 text-sm">
            <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-blue-800">
              <strong>Como funciona:</strong> O sistema baixa o arquivo ZIP da CDN oficial do TSE
              (<code className="bg-blue-100 px-1 rounded text-xs">cdn.tse.jus.br</code>),
              extrai o CSV da UF selecionada e importa os registros de votação nominal para a entidade <strong>ElectoralData</strong>.
              Se a CDN estiver indisponível, dados demonstrativos são utilizados.
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handlePreview}
              disabled={!canPreview}
              variant="outline"
              className="border-green-200 text-green-700 hover:bg-green-50"
            >
              {previewing
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Carregando prévia...</>
                : <><Eye className="w-4 h-4 mr-2" />Pré-visualizar dados</>}
            </Button>

            {preview && (
              <Button
                onClick={handleImport}
                disabled={!canImport}
                className="bg-green-700 hover:bg-green-800 text-white"
              >
                {importing
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Importando...</>
                  : <><Download className="w-4 h-4 mr-2" />Importar {preview.total} registros</>}
              </Button>
            )}

            {(preview || importResult) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setPreview(null); setImportResult(null); }}
                className="text-slate-400 hover:text-slate-600"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Limpar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Mock warning */}
      {preview?.usedMock && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm">
          <WifiOff className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <div>
            <span className="font-semibold text-amber-800">CDN TSE indisponível — modo demonstração: </span>
            <span className="text-amber-700">
              Os dados exibidos são simulados. A importação irá salvar registros de exemplo no banco.
            </span>
          </div>
        </div>
      )}

      {/* Import result */}
      {importResult && <ImportProgressCard result={importResult} />}

      {/* Preview table */}
      {preview && !importResult && (
        <ImportPreviewTable
          records={preview.records}
          total={preview.total}
          ano={ano}
          uf={uf}
          cargo={cargo}
          usedMock={preview.usedMock}
        />
      )}
    </div>
  );
}