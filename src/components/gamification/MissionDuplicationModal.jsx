import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Copy } from "lucide-react";
import moment from "moment";

export default function MissionDuplicationModal({ open, onClose, mission, onDuplicate }) {
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");

  useEffect(() => {
    if (open && mission) {
      setTitle(mission.title ? `${mission.title} (cópia)` : "");
      setDeadline("");
    }
  }, [open, mission]);

  const handleDuplicate = () => {
    if (!mission || !title.trim()) return;
    onDuplicate(mission, { title: title.trim(), deadline });
  };

  if (!mission) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Copy className="w-5 h-5" />Duplicar Missão</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-600">
            <p>A missão será copiada com:</p>
            <ul className="list-disc pl-4 mt-1 space-y-0.5 text-xs">
              <li>Título e descrição</li>
              <li>Checklist e anexos</li>
              <li>Pontuação e tipo</li>
              <li>Responsáveis <strong>limpos</strong></li>
              <li>Status <strong>resetado</strong></li>
            </ul>
          </div>
          <div>
            <Label>Novo título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <Label>Novo prazo</Label>
            <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleDuplicate} disabled={!title.trim()}>Duplicar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}