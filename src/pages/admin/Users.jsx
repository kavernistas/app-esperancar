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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, UserCheck, UserX, Edit, Trash2 } from "lucide-react";
import * as usersApi from "@/api/users";

const ROLES = ["ADMIN", "COORDENADOR", "LIDERANCA", "OPERADOR", "FINANCEIRO", "COMUNICACAO", "LEITURA"];
const STATUS_LABELS = { ACTIVE: "Ativo", INACTIVE: "Inativo", PENDENTE: "Pendente" };

export default function AdminUsers() {
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const qc = useQueryClient();

  const { data: resp, isLoading } = useQuery({
    queryKey: ["users", search],
    queryFn: () => usersApi.listUsers({ search, limit: 100 }),
  });
  const users = resp?.data?.data || [];

  const createMut = useMutation({
    mutationFn: usersApi.createUser,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users"] }); setCreateOpen(false); toast.success("Usuário criado"); },
    onError: (e) => toast.error(e?.message || "Erro ao criar usuário"),
  });

  const roleMut = useMutation({
    mutationFn: ({ id, role }) => usersApi.setUserRole(id, role),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users"] }); toast.success("Papel atualizado"); },
    onError: (e) => toast.error(e?.message || "Erro ao atualizar papel"),
  });

  const deactivateMut = useMutation({
    mutationFn: usersApi.deactivateUser,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users"] }); toast.success("Usuário desativado"); },
    onError: (e) => toast.error(e?.message || "Erro ao desativar"),
  });

  const activateMut = useMutation({
    mutationFn: usersApi.activateUser,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users"] }); toast.success("Usuário ativado"); },
    onError: (e) => toast.error(e?.message || "Erro ao ativar"),
  });

  if (isLoading) return <div className="p-6 text-slate-400">Carregando...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <h2 className="text-2xl font-bold">Usuários</h2>
        <Button onClick={() => setCreateOpen(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" /> Novo Usuário
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input placeholder="Buscar por nome ou email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Papel</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => (
            <TableRow key={u.id}>
              <TableCell>{u.full_name}</TableCell>
              <TableCell>{u.email}</TableCell>
              <TableCell>
                <Badge variant="outline">{u.role}</Badge>
              </TableCell>
              <TableCell>
                <Badge className={u.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}>
                  {STATUS_LABELS[u.status] || u.status}
                </Badge>
              </TableCell>
              <TableCell className="flex gap-1">
                <Select onValueChange={(v) => roleMut.mutate({ id: u.id, role: v })}>
                  <SelectTrigger className="w-[130px] h-8"><SelectValue placeholder="Papel" /></SelectTrigger>
                  <SelectContent>
                    {ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
                {u.status === "ACTIVE" ? (
                  <Button size="sm" variant="ghost" onClick={() => deactivateMut.mutate(u.id)} className="text-amber-600">
                    <UserX className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button size="sm" variant="ghost" onClick={() => activateMut.mutate(u.id)} className="text-emerald-600">
                    <UserCheck className="w-4 h-4" />
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
          {users.length === 0 && (
            <TableRow><TableCell colSpan={5} className="text-center text-slate-400 py-8">Nenhum usuário encontrado</TableCell></TableRow>
          )}
        </TableBody>
      </Table>

      {createOpen && (
        <CreateUserDialog
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onSubmit={(data) => createMut.mutate(data)}
        />
      )}
    </div>
  );
}

function CreateUserDialog({ open, onClose, onSubmit }) {
  const [form, setForm] = useState({ email: "", full_name: "", role: "OPERADOR", password: "" });
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Criar Usuário</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <Input placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          <Input placeholder="Nome completo" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
          <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
          </Select>
          <Input placeholder="Senha (min 6)" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => onSubmit(form)} className="bg-blue-600 hover:bg-blue-700">Criar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
