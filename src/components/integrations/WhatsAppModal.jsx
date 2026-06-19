import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  Info,
  Loader2,
  MessageCircle,
  Phone,
  Send,
  Settings,
  Users,
  Zap,
} from "lucide-react";

const STEPS = { COMPOSE: "compose", PREVIEW: "preview", SENDING: "sending", DONE: "done" };

const MESSAGE_TEMPLATES = [
  {
    label: "Convite para evento",
    text: "Olá {{nome}}! 🎉 Convidamos você para nosso evento político no próximo sábado. Sua presença é muito importante! Confirme sua participação respondendo esta mensagem.",
  },
  {
    label: "Agradecimento de apoio",
    text: "Olá {{nome}}! Quero agradecer pessoalmente seu apoio à nossa campanha. Juntos vamos construir uma cidade melhor para todos. Conte comigo! 🤝",
  },
  {
    label: "Informativo geral",
    text: "Olá {{nome}}! Tenho novidades importantes para compartilhar com você sobre nossos projetos no bairro. Posso contar com seu apoio? Responda esta mensagem!",
  },
  {
    label: "Mobilização eleitoral",
    text: "{{nome}}, falta pouco para o dia da eleição! Lembre-se de levar seu documento e comparecer ao seu local de votação. Seu voto faz a diferença! 🗳️",
  },
];

export default function WhatsAppModal({ open, onOpenChange, selectedContacts = [] }) {
  const [step, setStep] = useState(STEPS.COMPOSE);
  const [message, setMessage] = useState("");
  const [sendToAll, setSendToAll] = useState(selectedContacts.length === 0);
  const [filterLeaders, setFilterLeaders] = useState("all");
  const [filterCity, setFilterCity] = useState("all");
  const [instanceUrl, setInstanceUrl] = useState("");
  const [instanceToken, setInstanceToken] = useState("");
  const [showApiConfig, setShowApiConfig] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { data: contacts = [] } = useQuery({
    queryKey: ["contacts"],
    queryFn: () => base44.entities.Contact.list("-created_date", 1000),
    enabled: open,
  });

  const cities = [...new Set(contacts.map(c => c.city).filter(Boolean))];

  const charCount = message.length;
  const hasName = message.includes("{{nome}}");

  const handleReset = () => {
    setStep(STEPS.COMPOSE);
    setMessage("");
    setPreviewData(null);
    setResult(null);
    setError(null);
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(handleReset, 300);
  };

  const handlePreview = async () => {
    if (!message.trim()) { setError("Escreva uma mensagem."); return; }
    setError(null);
    setLoading(true);

    const filters = {};
    if (filterLeaders === "leaders") filters.is_leader = true;
    if (filterLeaders === "contacts") filters.is_leader = false;
    if (filterCity !== "all") filters.city = filterCity;

    const response = await base44.functions.invoke("whatsappSend", {
      contactIds: sendToAll ? [] : selectedContacts.map(c => c.id || c),
      message,
      mode: "preview",
      sendToAll: sendToAll || selectedContacts.length === 0,
      filters,
    });

    setLoading(false);
    if (response.data?.success) {
      setPreviewData(response.data);
      setStep(STEPS.PREVIEW);
    } else {
      setError(response.data?.error || "Erro ao gerar preview.");
    }
  };

  const handleSend = async () => {
    setStep(STEPS.SENDING);
    setLoading(true);

    const filters = {};
    if (filterLeaders === "leaders") filters.is_leader = true;
    if (filterLeaders === "contacts") filters.is_leader = false;
    if (filterCity !== "all") filters.city = filterCity;

    const response = await base44.functions.invoke("whatsappSend", {
      contactIds: sendToAll ? [] : selectedContacts.map(c => c.id || c),
      message,
      mode: "send",
      sendToAll: sendToAll || selectedContacts.length === 0,
      filters,
      instanceUrl: instanceUrl || undefined,
      instanceToken: instanceToken || undefined,
      // Anti-ban rate limiting: 1.5s entre msgs, lotes de 8, pausa 45s
      delayMs: 1500,
      batchSize: 8,
      batchPauseMs: 45000,
      maxPerHour: 30,
      maxPerDay: 200,
    });

    setLoading(false);
    setResult(response.data);
    setStep(STEPS.DONE);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-green-600" />
            </div>
            Envio via WhatsApp
          </DialogTitle>
        </DialogHeader>

        {/* STEP: COMPOSE */}
        {step === STEPS.COMPOSE && (
          <div className="space-y-5">
            {/* API Config */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Settings className="w-4 h-4" />
                <span>Configuração da API Evolution (opcional)</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowApiConfig(!showApiConfig)}
                className="text-xs"
              >
                {showApiConfig ? "Ocultar" : "Configurar"}
              </Button>
            </div>

            {showApiConfig && (
              <div className="p-4 border rounded-lg space-y-3 bg-slate-50">
                <div className="flex gap-2 p-2 bg-blue-50 rounded text-xs text-blue-700 items-start">
                  <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>Configure a Evolution API para envio real. Sem configuração, o envio será simulado.</span>
                </div>
                <div>
                  <Label className="text-xs">URL da Instância Evolution API</Label>
                  <Input
                    value={instanceUrl}
                    onChange={e => setInstanceUrl(e.target.value)}
                    placeholder="https://api.evolution.com"
                    className="text-sm h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs">Token da Instância</Label>
                  <Input
                    value={instanceToken}
                    onChange={e => setInstanceToken(e.target.value)}
                    placeholder="Token da instância"
                    type="password"
                    className="text-sm h-8"
                  />
                </div>
              </div>
            )}

            {/* Recipients */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Destinatários</Label>

              {selectedContacts.length > 0 ? (
                <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-emerald-700">
                    <Users className="w-4 h-4" />
                    <span><strong>{selectedContacts.length}</strong> contatos selecionados</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <span>Enviar para todos</span>
                    <Switch checked={sendToAll} onCheckedChange={setSendToAll} />
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Enviando para todos os contatos ativos
                </div>
              )}

              {(sendToAll || selectedContacts.length === 0) && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-slate-500">Filtrar por tipo</Label>
                    <Select value={filterLeaders} onValueChange={setFilterLeaders}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os contatos</SelectItem>
                        <SelectItem value="leaders">Apenas lideranças</SelectItem>
                        <SelectItem value="contacts">Não lideranças</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Filtrar por cidade</Label>
                    <Select value={filterCity} onValueChange={setFilterCity}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as cidades</SelectItem>
                        {cities.map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>

            {/* Message */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Mensagem</Label>
                <span className="text-xs text-slate-400">{charCount} caracteres</span>
              </div>

              {/* Templates */}
              <div className="flex gap-2 flex-wrap">
                {MESSAGE_TEMPLATES.map((t, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setMessage(t.text)}
                    className="text-xs px-2 py-1 bg-slate-100 hover:bg-blue-100 hover:text-blue-700 rounded-md transition-colors border border-transparent hover:border-blue-200"
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <Textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Digite sua mensagem aqui. Use {{nome}} para personalizar com o nome do contato."
                rows={5}
                className="resize-none"
              />

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setMessage(p => p + "{{nome}}")}
                  className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors font-mono"
                >
                  + inserir {"{{nome}}"}
                </button>
                {hasName && (
                  <div className="flex items-center gap-1 text-xs text-emerald-600">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Mensagem personalizada com nome
                  </div>
                )}
              </div>

              {/* Preview message */}
              {message && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-xs text-green-700 font-medium mb-1">Prévia da mensagem:</p>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">
                    {message.replace("{{nome}}", "João Silva")}
                  </p>
                </div>
              )}
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
              <Button onClick={handlePreview} disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700">
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Eye className="w-4 h-4 mr-2" />}
                Pré-visualizar Envio
              </Button>
            </div>
          </div>
        )}

        {/* STEP: PREVIEW */}
        {step === STEPS.PREVIEW && previewData && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-blue-600">{previewData.total}</p>
                <p className="text-xs text-slate-500">Total</p>
              </div>
              <div className="bg-emerald-50 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-emerald-600">{previewData.withPhone}</p>
                <p className="text-xs text-slate-500">Com WhatsApp</p>
              </div>
              <div className="bg-red-50 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-red-600">{previewData.withoutPhone}</p>
                <p className="text-xs text-slate-500">Sem Telefone</p>
              </div>
            </div>

            {/* Rate limit info */}
            <div className="flex items-center gap-2 p-3 bg-slate-50 border rounded-lg text-xs text-slate-500">
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span>
                <strong>Anti-ban:</strong> intervalo de 1,5s entre mensagens, lotes de 8 com pausa de 45s, máx. 30/hora e 200/dia.
              </span>
            </div>

            {!instanceUrl && (
              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
                <Zap className="w-4 h-4 shrink-0" />
                <span>Sem API configurada — envio será <strong>simulado</strong>. Configure a Evolution API para envio real.</span>
              </div>
            )}

            <div className="border rounded-lg overflow-hidden">
              <div className="bg-slate-50 px-4 py-2 border-b">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Amostra de destinatários (5 de {previewData.withPhone})
                </p>
              </div>
              <div className="divide-y">
                {previewData.preview?.map((p, i) => (
                  <div key={i} className="px-4 py-3 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-xs font-bold shrink-0">
                      {p.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm text-slate-700">{p.name}</p>
                        <span className="text-xs text-slate-400">{p.phone}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                        {p.message_preview}
                      </p>
                    </div>
                    <Phone className="w-3.5 h-3.5 text-green-500 shrink-0" />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setStep(STEPS.COMPOSE)} className="flex-1">
                Voltar
              </Button>
              <Button onClick={handleSend} className="flex-1 bg-green-600 hover:bg-green-700">
                <Send className="w-4 h-4 mr-2" />
                Enviar para {previewData.withPhone} contatos
              </Button>
            </div>
          </div>
        )}

        {/* STEP: SENDING */}
        {step === STEPS.SENDING && (
          <div className="py-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
            </div>
            <div>
              <p className="font-semibold text-slate-800 text-lg">Enviando mensagens...</p>
              <p className="text-slate-500 text-sm mt-1">Aguarde enquanto as mensagens são processadas</p>
            </div>
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
                : <AlertCircle className="w-8 h-8 text-red-600" />}
            </div>
            <div>
              <p className="font-bold text-xl text-slate-800">
                {result.success ? "Mensagens Enviadas!" : "Erro no Envio"}
              </p>
              <p className="text-slate-500 mt-1">{result.message}</p>
              {result.mode === "simulated" && (
                <Badge className="mt-2 bg-amber-100 text-amber-700">Modo simulado</Badge>
              )}
            </div>
            {result.success && (
              <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto">
                <div className="bg-emerald-50 rounded-lg p-4">
                  <p className="text-2xl font-bold text-emerald-600">{result.sent}</p>
                  <p className="text-xs text-slate-500">Enviadas</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <p className="text-2xl font-bold text-red-600">{result.failed}</p>
                  <p className="text-xs text-slate-500">Falhas</p>
                </div>
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={handleReset} className="flex-1">
                Novo Envio
              </Button>
              <Button onClick={handleClose} className="flex-1 bg-green-600 hover:bg-green-700">
                Concluir
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}