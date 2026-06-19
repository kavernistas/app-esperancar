import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Search, MessageCircle, Upload, Users, Vote } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import ContactsTable from "@/components/contacts/ContactsTable";
import ContactForm from "@/components/contacts/ContactForm";
import ContactDetailSheet from "@/components/contacts/ContactDetailSheet";
import TSEImportModal from "@/components/integrations/TSEImportModal";
import WhatsAppModal from "@/components/integrations/WhatsAppModal";

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

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ["contacts"],
    queryFn: () => base44.entities.Contact.list("-created_date", 500),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Contact.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      setFormOpen(false);
      setEditingContact(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Contact.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      setFormOpen(false);
      setEditingContact(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Contact.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      setDeleteContact(null);
    },
  });

  const handleSave = (data) => {
    if (editingContact) {
      updateMutation.mutate({ id: editingContact.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (contact) => {
    setEditingContact(contact);
    setFormOpen(true);
  };

  const handleDelete = (contact) => {
    setDeleteContact(contact);
  };

  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch =
      search === "" ||
      contact.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      contact.phone?.includes(search) ||
      contact.email?.toLowerCase().includes(search.toLowerCase()) ||
      contact.city?.toLowerCase().includes(search.toLowerCase()) ||
      contact.neighborhood?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "all" || contact.status === statusFilter;
    const matchesLeader =
      leaderFilter === "all" ||
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Contatos</h1>
          <p className="text-slate-500 mt-1">
            Gerencie sua base de contatos políticos
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={() => setTseModalOpen(true)}
            className="border-blue-200 text-blue-700 hover:bg-blue-50"
          >
            <Vote className="w-4 h-4 mr-2" />
            Importar TSE
          </Button>
          <Button
            variant="outline"
            onClick={() => setWhatsappModalOpen(true)}
            className="border-green-200 text-green-700 hover:bg-green-50"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            WhatsApp
          </Button>
          <Button
            onClick={() => {
              setEditingContact(null);
              setFormOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Contato
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border">
          <p className="text-sm text-slate-500">Total</p>
          <p className="text-2xl font-bold text-slate-900">{contacts.length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border">
          <p className="text-sm text-slate-500">Ativos</p>
          <p className="text-2xl font-bold text-emerald-600">
            {contacts.filter(c => c.status === "active").length}
          </p>
        </div>
        <div className="bg-white rounded-lg p-4 border">
          <p className="text-sm text-slate-500">Lideranças</p>
          <p className="text-2xl font-bold text-blue-600">
            {contacts.filter(c => c.is_leader).length}
          </p>
        </div>
        <div className="bg-white rounded-lg p-4 border">
          <p className="text-sm text-slate-500">Engajamento Médio</p>
          <p className="text-2xl font-bold text-purple-600">
            {contacts.length > 0
              ? Math.round(
                  contacts.reduce((sum, c) => sum + (c.engagement_level || 0), 0) /
                    contacts.length
                )
              : 0}%
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-lg border">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar por nome, telefone, email, cidade..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Status</SelectItem>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="inactive">Inativo</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
            </SelectContent>
          </Select>
          <Select value={leaderFilter} onValueChange={setLeaderFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Liderança" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="yes">Lideranças</SelectItem>
              <SelectItem value="no">Não Lideranças</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Users className="w-4 h-4" />
        <span>{filteredContacts.length} contatos encontrados</span>
      </div>

      {/* Table */}
      <ContactsTable
        contacts={filteredContacts}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={setViewingContact}
      />

      {/* Form */}
      <ContactForm
        open={formOpen}
        onOpenChange={setFormOpen}
        contact={editingContact}
        onSave={handleSave}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* TSE Import Modal */}
      <TSEImportModal
        open={tseModalOpen}
        onOpenChange={setTseModalOpen}
        onImportComplete={() => queryClient.invalidateQueries({ queryKey: ["contacts"] })}
      />

      {/* Contact Detail Sheet */}
      <ContactDetailSheet
        contact={viewingContact}
        open={!!viewingContact}
        onOpenChange={(open) => { if (!open) setViewingContact(null); }}
      />

      {/* WhatsApp Modal */}
      <WhatsAppModal
        open={whatsappModalOpen}
        onOpenChange={setWhatsappModalOpen}
        selectedContacts={selectedContacts}
      />

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteContact} onOpenChange={() => setDeleteContact(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir contato?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O contato "{deleteContact?.full_name}" será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(deleteContact?.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}