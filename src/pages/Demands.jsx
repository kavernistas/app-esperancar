import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Plus, Search, ClipboardList, Clock, CheckCircle, AlertTriangle, Download } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import DemandCard from "@/components/demands/DemandCard";
import DemandForm from "@/components/demands/DemandForm";

const exportDemandsCSV = (demands) => {
  const headers = ["Título","Tipo","Descrição","Solicitante","Telefone","Email","Cidade","Bairro","Prioridade","Status","Responsável","Prazo"];
  const rows = demands.map(d => [
    d.title||"", d.type||"", d.description||"", d.requester_name||"", d.requester_phone||"",
    d.requester_email||"", d.city||"", d.neighborhood||"", d.priority||"", d.status||"",
    d.responsible||"", d.due_date||""
  ].map(v => `"${String(v).replace(/"/g,'""')}"`).join(","));
  const csv = "\uFEFF" + headers.join(",") + "\n" + rows.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = "demandas.csv"; a.click();
  URL.revokeObjectURL(url);
};

export default function Demands() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingDemand, setEditingDemand] = useState(null);
  const [deleteDemand, setDeleteDemand] = useState(null);

  const queryClient = useQueryClient();

  const { data: demands = [], isLoading } = useQuery({
    queryKey: ["demands"],
    queryFn: () => base44.entities.Demand.list("-created_date", 500),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Demand.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["demands"] });
      setFormOpen(false);
      setEditingDemand(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Demand.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["demands"] });
      setFormOpen(false);
      setEditingDemand(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Demand.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["demands"] });
      setDeleteDemand(null);
    },
  });

  const handleSave = (data) => {
    if (editingDemand) {
      updateMutation.mutate({ id: editingDemand.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (demand) => {
    setEditingDemand(demand);
    setFormOpen(true);
  };

  const handleAddComment = async (demandId, text) => {
    const demand = demands.find(d => d.id === demandId);
    if (!demand) return;
    const entry = { date: new Date().toISOString(), action: "comment", user: "Admin", new_value: text };
    await updateMutation.mutateAsync({ id: demandId, data: { history: [...(demand.history || []), entry] } });
  };

  const handleDelete = (demand) => {
    setDeleteDemand(demand);
  };

  const filteredDemands = demands.filter((demand) => {
    const matchesSearch =
      search === "" ||
      demand.title?.toLowerCase().includes(search.toLowerCase()) ||
      demand.requester_name?.toLowerCase().includes(search.toLowerCase()) ||
      demand.city?.toLowerCase().includes(search.toLowerCase()) ||
      demand.neighborhood?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "all" || demand.status === statusFilter;
    const matchesType = typeFilter === "all" || demand.type === typeFilter;
    const matchesPriority = priorityFilter === "all" || demand.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesType && matchesPriority;
  });

  // Stats
  const openCount = demands.filter(d => d.status === "open").length;
  const inProgressCount = demands.filter(d => d.status === "in_progress").length;
  const resolvedCount = demands.filter(d => d.status === "resolved").length;
  const urgentCount = demands.filter(d => d.priority === "urgent" && d.status !== "resolved").length;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Demandas</h1>
          <p className="text-slate-500 mt-1">
            Gerencie as demandas e atendimentos
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => exportDemandsCSV(demands)}
          className="border-slate-200 text-slate-700 hover:bg-slate-50"
        >
          <Download className="w-4 h-4 mr-2" />
          Exportar CSV
        </Button>
        <Button
          onClick={() => {
            setEditingDemand(null);
            setFormOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Demanda
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <ClipboardList className="w-4 h-4" />
            <span className="text-sm">Abertas</span>
          </div>
          <p className="text-2xl font-bold text-amber-600">{openCount}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-sm">Em Andamento</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">{inProgressCount}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">Resolvidas</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{resolvedCount}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm">Urgentes</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{urgentCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 bg-white p-4 rounded-lg border">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar demandas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-3 flex-wrap">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Tipos</SelectItem>
                <SelectItem value="health">Saúde</SelectItem>
                <SelectItem value="education">Educação</SelectItem>
                <SelectItem value="infrastructure">Infraestrutura</SelectItem>
                <SelectItem value="security">Segurança</SelectItem>
                <SelectItem value="social">Assistência Social</SelectItem>
                <SelectItem value="employment">Emprego</SelectItem>
                <SelectItem value="housing">Habitação</SelectItem>
                <SelectItem value="transport">Transporte</SelectItem>
                <SelectItem value="other">Outros</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="low">Baixa</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            <TabsTrigger value="all">Todas ({demands.length})</TabsTrigger>
            <TabsTrigger value="open">Abertas ({openCount})</TabsTrigger>
            <TabsTrigger value="in_progress">Em Andamento ({inProgressCount})</TabsTrigger>
            <TabsTrigger value="pending">Pendentes ({demands.filter(d => d.status === "pending").length})</TabsTrigger>
            <TabsTrigger value="resolved">Resolvidas ({resolvedCount})</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Grid */}
      {filteredDemands.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <ClipboardList className="w-12 h-12 mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500">Nenhuma demanda encontrada</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDemands.map((demand) => (
            <DemandCard
                key={demand.id}
                demand={demand}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onAddComment={handleAddComment}
              />
          ))}
        </div>
      )}

      {/* Form */}
      <DemandForm
        open={formOpen}
        onOpenChange={setFormOpen}
        demand={editingDemand}
        onSave={handleSave}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteDemand} onOpenChange={() => setDeleteDemand(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir demanda?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A demanda "{deleteDemand?.title}" será removida permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(deleteDemand?.id)}
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