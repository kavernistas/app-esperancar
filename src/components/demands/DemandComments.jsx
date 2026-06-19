import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send } from "lucide-react";
import moment from "moment";

export default function DemandComments({ demand, onAddComment }) {
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);

  const history = (demand?.history || []).filter(h => h.action === "comment");

  const handleSend = async () => {
    if (!comment.trim()) return;
    setSending(true);
    try {
      await onAddComment(demand.id, comment.trim());
      setComment("");
    } catch (e) { /* erro */ }
    setSending(false);
  };

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1.5">
        <MessageSquare className="w-3.5 h-3.5" /> Comentários ({history.length})
      </h4>

      {history.length > 0 ? (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {history.map((h, i) => (
            <div key={i} className="bg-slate-50 rounded-lg p-2 text-sm">
              <div className="flex items-center justify-between mb-0.5">
                <span className="font-medium text-slate-700 text-xs">{h.user || "Usuário"}</span>
                <span className="text-[10px] text-slate-400">{h.date ? moment(h.date).format("DD/MM HH:mm") : ""}</span>
              </div>
              <p className="text-slate-600 text-xs whitespace-pre-wrap">{h.new_value || h.old_value}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-400 py-2">Nenhum comentário ainda.</p>
      )}

      <div className="flex gap-2">
        <Textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Adicionar comentário..."
          rows={2}
          className="text-xs resize-none"
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
        />
        <Button size="icon" className="h-auto flex-shrink-0 bg-blue-600 hover:bg-blue-700" onClick={handleSend} disabled={sending || !comment.trim()}>
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}