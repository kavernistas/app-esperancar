import { tseApi } from "@/api/client";
import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Eye,
  Info,
  Loader2,
  Vote,
} from "lucide-react";

const STEPS = { CONFIG: "config", PREVIEW: "preview", IMPORTING: "importing", DONE: "done" };

export default function TSEImportModal({ open, onOpenChange, onImportComplete }) {
  const [step, setStep] = useState(STEPS.CONFIG);
  const [config, setConfig] = useState({ city: "", zone: "", section: "", count: 30 });
  const [previewData, setPreviewData] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleReset = () => {
    setStep(STEPS.CONFIG);
    setPreviewData([]);
    setResult(null);
    setError(null);
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(handleReset, 300);
  };

  const handlePreview = async () => {
    if (!config.city.trim()) { setError("Informe a cidade."); return; }
    setError(null);
    setLoading(true);
    const response = await tseApi.import({
      city: config.city,
      zone: config.zone,
      section: config.section,
      count: parseInt(config.count) || 30,
      mode: "preview",
    });
    setLoading(false);
    if (response.data?.success) {
      setPreviewData(response.data.voters || []);
      setStep(STEPS.PREVIEW);
    } else {
      setError(response.data?.error || "Erro ao buscar dados.");
    }
  };

  const handleImport = async () => {
    setStep(STEPS.IMPORTING);
    setLoading(true);
    const response = await tseApi.import({
      city: config.city,
      zone: config.zone,
      section: config.section,
      count: parseInt(config.count) || 30,
      mode: "import",
    });
    setLoading(false);
    setResult(response.data);
    setStep(STEPS.DONE);
    if (response.data?.success) onImportComplete?.();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <Vote className="w-4 h-4 text-blue-600" />
            </div>
            Importar Dados do TSE
          </DialogTitle>
        </DialogHeader>

        {/* Notice */}
        <div className="flex gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          <Info className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
          <p>
            Os dados são gerados com base nos parâmetros informados (simulação TSE). 
            Em integração com API real do TSE, os dados viriam diretamente da base oficial.
          </p>
        </div>

        {/* STEP: CONFIG */}
        {step === STEPS.CONFIG && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="city">Município *</Label>
                <Input
                  id="city"
                  value={config.city}
                  onChange={e => setConfig(p => ({ ...p, city: e.target.value }))}
                  placeholder="Ex: São Paulo, Campinas, Santos..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="zone">Zona Eleitoral</Label>
                  <Input
                    id="zone"
                    value={config.zone}
                    onChange={e => setConfig(p => ({ ...p, zone: e.target.value }))}
                    placeholder="Ex: 372"
                  />
                  <p className="text-xs text-slate-400 mt-1">Deixe vazio para todas as zonas</p>
                </div>
                <div>
                  <Label htmlFor="section">Seção Eleitoral</Label>
                  <Input
                    id="section"
                    value={config.section}
                    onChange={e => setConfig(p => ({ ...p, section: e.target.value }))}
                    placeholder="Ex: 0015"
                  />
                  <p className="text-xs text-slate-400 mt-1">Deixe vazio para todas as seções</p>
                </div>
              </div>
              <div>
                <Label htmlFor="count">Quantidade de registros</Label>
                <div className="flex gap-3 mt-1">
                  {[20, 50, 100].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setConfig(p => ({ ...p, count: n }))}
                      className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        config.count === n
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                      }`}
                    >
                      {n} eleitores
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4" /> {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handlePreview} disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700">
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Eye className="w-4 h-4 mr-2" />}
                Pré-visualizar
              </Button>
            </div>
          </div>
        )}

        {/* STEP: PREVIEW */}
        {step === STEPS.PREVIEW && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-800">{previewData.length} eleitores encontrados</p>
                <p className="text-sm text-slate-500">{config.city} · Zona {config.zone || "Todas"} · Seção {config.section || "Todas"}</p>
              </div>
              <Badge className="bg-emerald-100 text-emerald-700">Pronto para importar</Badge>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <div className="bg-slate-50 px-4 py-2 border-b flex items-center gap-2 text-xs font-medium text-slate-500 uppercase tracking-wide">
                <span className="w-44">Nome</span>
                <span className="w-28">Telefone</span>
                <span className="w-28">Bairro</span>
                <span className="flex-1">Zona / Seção</span>
              </div>
              <div className="divide-y max-h-64 overflow-y-auto">
                {previewData.map((v, i) => (
                  <div key={i} className="px-4 py-2.5 flex items-center gap-2 text-sm hover:bg-slate-50">
                    <div className="w-44 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold shrink-0">
                        {v.full_name.charAt(0)}
                      </div>
                      <span className="font-medium text-slate-700 truncate">{v.full_name}</span>
                    </div>
                    <span className="w-28 text-slate-500 text-xs">{v.phone}</span>
                    <span className="w-28 text-slate-500 text-xs truncate">{v.neighborhood}</span>
                    <span className="flex-1 text-slate-400 text-xs">Z{v.electoral_zone} / S{v.electoral_section}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setStep(STEPS.CONFIG)} className="flex-1">
                Voltar
              </Button>
              <Button onClick={handleImport} className="flex-1 bg-blue-600 hover:bg-blue-700">
                <Download className="w-4 h-4 mr-2" />
                Importar {previewData.length} Contatos
              </Button>
            </div>
          </div>
        )}

        {/* STEP: IMPORTING */}
        {step === STEPS.IMPORTING && (
          <div className="py-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
            <div>
              <p className="font-semibold text-slate-800 text-lg">Importando eleitores...</p>
              <p className="text-slate-500 text-sm mt-1">Aguarde enquanto os dados são processados</p>
            </div>
            <Progress value={66} className="w-48 mx-auto h-2" />
          </div>
        )}

        {/* STEP: DONE */}
        {step === STEPS.DONE && result && (
          <div className="py-8 text-center space-y-5">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${
              result.success ? "bg-emerald-100" : "bg-red-100"
            }`}>
              {result.success
                ? <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                : <AlertCircle className="w-8 h-8 text-red-600" />
              }
            </div>
            <div>
              <p className="font-bold text-xl text-slate-800">
                {result.success ? "Importação Concluída!" : "Erro na Importação"}
              </p>
              <p className="text-slate-500 mt-1">{result.message}</p>
            </div>
            {result.success && (
              <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto">
                <div className="bg-emerald-50 rounded-lg p-4">
                  <p className="text-2xl font-bold text-emerald-600">{result.imported}</p>
                  <p className="text-xs text-slate-500">Importados</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <p className="text-2xl font-bold text-red-600">{result.errors}</p>
                  <p className="text-xs text-slate-500">Erros</p>
                </div>
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={handleReset} className="flex-1">
                Nova Importação
              </Button>
              <Button onClick={handleClose} className="flex-1 bg-blue-600 hover:bg-blue-700">
                Concluir
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}