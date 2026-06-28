import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import * as invitationsApi from "@/api/invitations";

export default function AdminInvitations({ organizationId }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ email: "", role: "OPERADOR" });
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ["invitations", organizationId],
    queryFn: () => invitationsApi.listInvitations(organizationId),
    enabled: !!organizationId,
  });
  const invitations = data?.data?.data || [];

  const createMut = useMutation({
    mutationFn: () => invitationsApi.createInvitation(organizationId, form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["invitations"] }); setCreateOpen(false); toast.success("Convite enviado"); },
    onError: (e) => toast.error(e?.message || "Erro ao criar convite"),
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h2 className="text-2xl font-bold">Convites</h2>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Novo Convite
        </Button>
      </div>

      <Table>
        <TableHeader><TableRow><TableHead>Email</TableHead><TableHead>Papel</TableHead><TableHead>Status</TableHead><TableHead>Expira</TableHead></TableRow></TableHeader>
        <TableBody>
          {invitations.map((inv) => (
            <TableRow key={inv.id}>
              <TableCell>{inv.email}</TableCell>
              <TableCell><Badge>{inv.role}</Badge></TableCell>
              <TableCell>{inv.accepted_at ? <Badge className="bg-emerald-100 text-emerald-700">Aceito</Badge> : inv.expires_at && new Date(inv.expires_at) < new Date() ? <Badge variant="outline">Expirado</Badge> : <Badge variant="outline">Pendente</Badge>}</TableCell>
              <TableCell className="text-sm text-slate-500">{new Date(inv.expires_at).toLocaleDateString()}</TableCell>
            </TableRow>
          ))}
          {invitations.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-slate-400 py-8">Nenhum convite</TableCell></TableRow>}
        </TableBody>
      </Table>

      {createOpen && (
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Criar Convite</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              <Input placeholder="Papel" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
              <Button onClick={() => createMut.mutate()} className="bg-blue-600">Enviar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
