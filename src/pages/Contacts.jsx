import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Search, MessageCircle, Users, Vote, Download } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import ContactsTable from "@/components/contacts/ContactsTable";
import ContactForm from "@/components/contacts/ContactForm";
import ContactDetailSheet from "@/components/contacts/ContactDetailSheet";
import TSEImportModal from "@/components/integrations/TSEImportModal";
import WhatsAppModal from "@/components/integrations/WhatsAppModal";
import * as contactsApi from "@/api/contacts";

const sanitizeContactPayload = (contact) => {
  const allowed = [
    "full_name",
    "phone",
    "email",
    "status",
    "cep",
    "address",
    "number",
    "complement",
    "neighborhood",
    "city",
    "state",
    "birth_date",
    "gender",
    "notes",
    "tags",
    "source",
    "leader_id"
  ];

  const payload = {};
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(contact || {}, key)) {
      payload[key] = contact[key];
    }
  }

  if (typeof payload.status === "string") {
    payload.status = payload.status.toUpperCase();
  }

  return payload;
};


const exportContactsCSV = (contacts) => {
  const headers = ["Nome","Telefone","Email","Cidade","Bairro","Zona","Secao","Local de Votacao","Cargo","Engajamento","Status","E Lideranca","Tags"];
  const rows = contacts.map(c => [
    c.full_name || "", c.phone || "", c.email || "", c.city || "", c.neighborhood || "",
    c.electoral_zone || "", c.electoral_section || "", c.voting_location || "", c.position || "",
    c.engagement_level || 0, c.status || "", c.is_leader ? "Sim" : "Não", (c.tags || []).join("; ")
  ].map(v => `"${String(v).replace(/"/g,'""')}"`).join(","));
  const csv = "﻿" + headers.join(",") + "\n" + rows.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = "contatos.csv"; a.click();
  URL.revokeObjectURL(url);
};

export default function Contacts() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [leaderFilter, setLeaderFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [deleteContact, setDeleteContact] = useState(null);
  const [tseModalOpen, setTseModalOpen] = useState(false);
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [viewingContact, setViewingContact] = useState(null);

  const queryClient = useQueryClient();

  const queryParams = {
    search: search || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    is_leader: leaderFilter !== "all" ? leaderFilter : undefined,
    page: 1,
    limit: 500,
  };

  const { data: contactsResponse, isLoading } = useQuery({
    queryKey: ["contacts", queryParams],
    queryFn: () => contactsApi.listContacts(queryParams),
  });

  const contacts = contactsResponse?.data || contactsResponse || [];

  const closeForm = useCallback(() => {
    setFormOpen(false);
    setEditingContact(null);
  }, []);

  const createMutation = useMutation({
    mutationFn: (data) => contactsApi.createContact(data),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Contato cadastrado com sucesso");
      closeForm();
    },
    onError: (error) => {
      console.error("Erro ao cadastrar contato:", error);
      toast.error(error?.message || "Não foi possível cadastrar o contato");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => contactsApi.updateContact(id, sanitizeContactPayload(data)),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      queryClient.invalidateQueries({ queryKey: ["contact", updated?.id] });
      toast.success("Contato atualizado com sucesso");
      closeForm();
    },
    onError: (error) => {
      console.error("Erro ao atualizar contato:", error);
      toast.error(error?.message || "Não foi possível atualizar o contato");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => contactsApi.deleteContact(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      setDeleteContact(null);
      toast.success("Contato excluído");
    },
    onError: (error) => {
      toast.error(error?.message || "Não foi possível excluir");
    },
  });

  const handleSave = useCallback((data) => {
    if (editingContact?.id) {
      updateMutation.mutate({ id: editingContact.id, data });
    } else {
      createMutation.mutate(data);
    }
  }, [editingContact, createMutation, updateMutation]);

  const handleEdit = useCallback((contact) => {
    setEditingContact(contact);
    setFormOpen(true);
    setViewingContact(null);
  }, []);

  const handleNew = useCallback(() => {
    setEditingContact(null);
    setFormOpen(true);
  }, []);

  const handleDelete = useCallback((contact) => {
    setDeleteContact(contact);
  }, []);

  const isPending = createMutation.isPending || updateMutation.isPending;

  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch = !search ||
      contact.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      contact.phone?.includes(search) ||
      contact.email?.toLowerCase().includes(search.toLowerCase()) ||
      contact.city?.toLowerCase().includes(search.toLowerCase()) ||
      contact.neighborhood?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" ||
      (contact.status || "").toUpperCase() === statusFilter.toUpperCase();
    const matchesLeader = leaderFilter === "all" ||
      (leaderFilter === "yes" && contact.is_leader) ||
      (leaderFilter === "no" && !contact.is_leader);
    return matchesSearch && matchesStatus && matchesLeader;
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Contatos</h1>
          <p className="text-slate-500 mt-1">Gerencie sua base de contatos politicos</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => exportContactsCSV(contacts)} className="border-slate-200 text-slate-700 hover:bg-slate-50">
            <Download className="w-4 h-4 mr-2" /> Exportar CSV
          </Button>
          <Button variant="outline" onClick={() => setTseModalOpen(true)} className="border-blue-200 text-blue-700 hover:bg-blue-50">
            <Vote className="w-4 h-4 mr-2" /> Importar TSE
          </Button>
          <Button variant="outline" onClick={() => setWhatsappModalOpen(true)} className="border-green-200 text-green-700 hover:bg-green-50">
            <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
          </Button>
          <Button onClick={handleNew} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" /> Novo Contato
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border"><p className="text-sm text-slate-500">Total</p><p className="text-2xl font-bold text-slate-900">{contacts.length}</p></div>
        <div className="bg-white rounded-lg p-4 border"><p className="text-sm text-slate-500">Ativos</p><p className="text-2xl font-bold text-emerald-600">{contacts.filter(c => (c.status||"").toUpperCase() === "ACTIVE").length}</p></div>
        <div className="bg-white rounded-lg p-4 border"><p className="text-sm text-slate-500">Liderancas</p><p className="text-2xl font-bold text-blue-600">{contacts.filter(c => c.is_leader).length}</p></div>
        <div className="bg-white rounded-lg p-4 border"><p className="text-sm text-slate-500">Engajamento Medio</p><p className="text-2xl font-bold text-purple-600">{contacts.length > 0 ? Math.round(contacts.reduce((sum, c) => sum + (c.engagement_level || 0), 0) / contacts.length) : 0}%</p></div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-lg border">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Buscar por nome, telefone, email, cidade..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Status</SelectItem>
              <SelectItem value="ACTIVE">Ativo</SelectItem>
              <SelectItem value="INACTIVE">Inativo</SelectItem>
              <SelectItem value="PENDING">Pendente</SelectItem>
            </SelectContent>
          </Select>
          <Select value={leaderFilter} onValueChange={setLeaderFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Lideranca" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="yes">Liderancas</SelectItem>
              <SelectItem value="no">Nao Liderancas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Users className="w-4 h-4" />
        <span>{filteredContacts.length} contatos encontrados</span>
      </div>

      <ContactsTable contacts={filteredContacts} onEdit={handleEdit} onDelete={handleDelete} onView={setViewingContact} />

      <ContactForm
        open={formOpen}
        onOpenChange={(open) => { if (!open && !isPending) closeForm(); }}
        contact={editingContact}
        onSave={handleSave}
        isLoading={isPending}
      />

      <TSEImportModal open={tseModalOpen} onOpenChange={setTseModalOpen} onImportComplete={() => queryClient.invalidateQueries({ queryKey: ["contacts"] })} />

      <ContactDetailSheet
        contact={viewingContact}
        open={!!viewingContact && !formOpen}
        onOpenChange={(open) => { if (!open) setViewingContact(null); }}
        onEdit={handleEdit}
      />

      <WhatsAppModal open={whatsappModalOpen} onOpenChange={setWhatsappModalOpen} selectedContacts={selectedContacts} />

      <AlertDialog open={!!deleteContact} onOpenChange={() => setDeleteContact(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir contato?</AlertDialogTitle>
            <AlertDialogDescription>Esta acao nao pode ser desfeita. O contato "{deleteContact?.full_name}" sera removido permanentemente.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate(deleteContact?.id)} className="bg-red-600 hover:bg-red-700">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
