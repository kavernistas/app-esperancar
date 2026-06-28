import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Search, UserPlus, UserMinus } from "lucide-react";
import * as teamsApi from "@/api/teams";

export default function AdminTeams() {
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const qc = useQueryClient();

  const { data: resp, isLoading } = useQuery({
    queryKey: ["teams", search],
    queryFn: () => teamsApi.listTeams({ search, limit: 100 }),
  });
  const teams = resp?.data?.data || [];

  const { data: membersResp } = useQuery({
    queryKey: ["team-members", selectedTeam?.id],
    queryFn: () => teamsApi.getTeamMembers(selectedTeam.id),
    enabled: !!selectedTeam,
  });
  const members = membersResp?.data?.data || [];

  const createMut = useMutation({
    mutationFn: teamsApi.createTeam,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["teams"] }); setCreateOpen(false); toast.success("Equipe criada"); },
    onError: (e) => toast.error(e?.message || "Erro ao criar equipe"),
  });

  if (isLoading) return <div className="p-6 text-slate-400">Carregando...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <h2 className="text-2xl font-bold">Equipes</h2>
        <Button onClick={() => setCreateOpen(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" /> Nova Equipe
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow><TableHead>Nome</TableHead><TableHead>Descrição</TableHead><TableHead>Membros</TableHead><TableHead>Status</TableHead><TableHead>Ações</TableHead></TableRow>
        </TableHeader>
        <TableBody>
          {teams.map((t) => (
            <TableRow key={t.id}>
              <TableCell>{t.name}</TableCell>
              <TableCell className="text-slate-500 text-sm">{t.description || "-"}</TableCell>
              <TableCell>{t._count?.members || 0}</TableCell>
              <TableCell><Badge className={t.active !== false ? "bg-emerald-100 text-emerald-700" : "bg-slate-100"}>{t.active !== false ? "Ativa" : "Inativa"}</Badge></TableCell>
              <TableCell><Button size="sm" variant="ghost" onClick={() => setSelectedTeam(t)}>Membros</Button></TableCell>
            </TableRow>
          ))}
          {teams.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-slate-400 py-8">Nenhuma equipe</TableCell></TableRow>}
        </TableBody>
      </Table>

      {createOpen && (
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Criar Equipe</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); createMut.mutate({ name: e.target.name.value, description: e.target.description.value }); }} className="space-y-4">
              <Input name="name" placeholder="Nome da equipe" required />
              <Input name="description" placeholder="Descrição (opcional)" />
              <DialogFooter><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button type="submit" className="bg-blue-600">Criar</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {selectedTeam && (
        <Dialog open={!!selectedTeam} onOpenChange={() => setSelectedTeam(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Membros de {selectedTeam.name}</DialogTitle></DialogHeader>
            <Table>
              <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Email</TableHead><TableHead>Papel</TableHead></TableRow></TableHeader>
              <TableBody>
                {members.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>{m.user?.full_name}</TableCell>
                    <TableCell>{m.user?.email}</TableCell>
                    <TableCell><Badge>{m.role || "MEMBER"}</Badge></TableCell>
                  </TableRow>
                ))}
                {members.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-slate-400">Sem membros</TableCell></TableRow>}
              </TableBody>
            </Table>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
