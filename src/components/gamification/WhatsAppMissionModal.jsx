import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Send, Loader2, CheckCircle2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import moment from "moment";

const TEMPLATES = {
  new_mission: `Olá, {{nome}}! 🌟 Nova missão no Esperançar:
📌 {{titulo}}
📍 Região: {{bairro}}
⏰ Prazo: {{prazo}}
⭐ Pontos: {{pontos}}
Acesse o app e marque como concluída quando finalizar.`,
  reminder: `⏰ Lembrete Esperançar:
Sua missão "{{titulo}}" vence em breve!
Prazo: {{prazo}}
Não deixe para depois — conclua e garanta seus {{pontos}} pontos!`,
  congratulations: `🎉 Parabéns, {{nome}}!
Missão "{{titulo}}" concluída com sucesso!
+{{pontos}} pontos adicionados ao seu perfil.
Continue assim! 🚀`,
};

export default function WhatsAppMissionModal({ open, onClose, mission, leader }) {
  const [templateType, setTemplateType] = useState("new_mission");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const buildMessage = () => {
    const tpl = TEMPLATES[templateType];
    return tpl
      .replace("{{nome}}", leader?.name || mission?.leader_name || "Liderança")
      .replace("{{titulo}}", mission?.title || "")
      .replace("{{bairro}}", mission?.neighborhood || leader?.neighborhood || "Não informado")
      .replace("{{prazo}}", mission?.deadline ? moment(mission.deadline).format("DD/MM/YYYY") : "Sem prazo")
      .replace("{{pontos}}", String(mission?.points || 30));
  };

  React.useEffect(() => {
    if (open) {
      setMessage(buildMessage());
      setSent(false);
    }
  }, [open, templateType]);

  const handleSend = async () => {
    if (!leader?.phone) return;
    setSending(true);
    try {
      await base44.functions.invoke("whatsappSend", {
        contactIds: [],
        message,
        mode: "send",
        sendToAll: false,
      });
      setSent(true);
      if (templateType === "new_mission") {
        await base44.entities.Mission.update(mission.id, { notified_at: new Date().toISOString() });
      }
    } catch (e) {
      console.error("Erro ao enviar:", e);
    }
    setSending(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5 text-emerald-600" />
            Enviar por WhatsApp
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="flex gap-2">
            {Object.entries(TEMPLATES).map(([key]) => (
              <Button
                key={key}
                size="sm"
                variant={templateType === key ? "default" : "outline"}
                className="text-xs"
                onClick={() => setTemplateType(key)}
              >
                {key === "new_mission" ? "Nova Missão" : key === "reminder" ? "Lembrete" : "Parabéns"}
              </Button>
            ))}
          </div>
          <div>
            <Label>Mensagem</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              className="text-sm"
            />
          </div>
          <div className="text-xs text-slate-500">
            📱 Enviando para: <strong>{leader?.name || mission?.leader_name}</strong> — {leader?.phone || "Sem telefone"}
          </div>
          {!leader?.phone && (
            <p className="text-xs text-red-500">⚠️ Esta liderança não possui telefone cadastrado.</p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Fechar</Button>
            {!sent ? (
              <Button
                onClick={handleSend}
                disabled={!leader?.phone || sending}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                {sending ? "Enviando..." : "Enviar"}
              </Button>
            ) : (
              <Button disabled variant="outline" className="text-emerald-600">
                <CheckCircle2 className="w-4 h-4 mr-2" />Enviado
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}