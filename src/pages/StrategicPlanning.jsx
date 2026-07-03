import { strategicActionsApi } from "@/api/client";
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
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
import { Skeleton } from "@/components/ui/skeleton";
import PlanningCalendar from "@/components/planning/PlanningCalendar";
import {
  Plus,
  Target,
  Calendar as CalendarIcon,
  MapPin,
  Users,
  Edit,
  Trash2,
  MoreVertical,
  Save,
  Loader2,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const normalizeList = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.data?.data)) return value.data.data;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.results)) return value.results;
  return [];
};


const statusColors = {
  planned: "bg-slate-100 text-slate-600",
  in_progress: "bg-blue-100 text-blue-600",
  completed: "bg-emerald-100 text-emerald-600",
  cancelled: "bg-red-100 text-red-600",
};

const statusLabels = {
  planned: "Planejado",
  in_progress: "Em Andamento",
  completed: "Concluído",
  cancelled: "Cancelado",
};

const typeLabels = {
  event: "Evento",
  campaign: "Campanha",
  visit: "Visita",
  meeting: "Reunião",
  training: "Treinamento",
  other: "Outro",
};

export default function StrategicPlanning() {
  const [formOpen, setFormOpen] = useState(false);
  const [editingAction, setEditingAction] = useState(null);
  const [deleteAction, setDeleteAction] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const queryClient = useQueryClient();

  const { data: actions = [], isLoading } = useQuery({
    queryKey: ["actions"],
    queryFn: () => strategicActionsApi.list({ sort: "-start_date", limit: 200 }),
  });

  const createMutation = useMutation({
    mutationFn: (data) => strategicActionsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["actions"] });
      setFormOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => strategicActionsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["actions"] });
      setFormOpen(false);
      setEditingAction(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => strategicActionsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["actions"] });
      setDeleteAction(null);
    },
  });

  const filteredActions = normalizeList(actions).filter((action) => {
    const matchesStatus = statusFilter === "all" || action.status === statusFilter;
    const matchesType = typeFilter === "all" || action.type === typeFilter;
    return matchesStatus && matchesType;
  });

  // Stats
  const plannedCount = normalizeList(actions).filter((a) => a.status === "planned").length;
  const inProgressCount = normalizeList(actions).filter((a) => a.status === "IN_PROGRESS" || a.status === "in_progress").length;
  const completedCount = normalizeList(actions).filter((a) => a.status === "COMPLETED" || a.status === "completed").length;
  const totalExpectedReach = normalizeList(actions).reduce((sum, a) => sum + (a.expected_reach || 0), 0);
  const totalActualReach = normalizeList(actions).reduce((sum, a) => sum + (a.actual_reach || 0), 0);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-96 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Planejamento Estratégico</h1>
          <p className="text-slate-500 mt-1">Gerencie suas ações e metas</p>
        </div>
        <Button
          onClick={() => {
            setEditingAction(null);
            setFormOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Ação
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-sm">Planejadas</span>
          </div>
          <p className="text-2xl font-bold text-slate-600">{plannedCount}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">Em Andamento</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">{inProgressCount}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">Concluídas</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{completedCount}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Users className="w-4 h-4" />
            <span className="text-sm">Alcance Total</span>
          </div>
          <p className="text-2xl font-bold text-purple-600">{totalActualReach.toLocaleString()}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-lg border">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            <SelectItem value="planned">Planejado</SelectItem>
            <SelectItem value="in_progress">Em Andamento</SelectItem>
            <SelectItem value="completed">Concluído</SelectItem>
            <SelectItem value="cancelled">Cancelado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Tipos</SelectItem>
            <SelectItem value="event">Evento</SelectItem>
            <SelectItem value="campaign">Campanha</SelectItem>
            <SelectItem value="visit">Visita</SelectItem>
            <SelectItem value="meeting">Reunião</SelectItem>
            <SelectItem value="training">Treinamento</SelectItem>
            <SelectItem value="other">Outro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Calendar */}
      {normalizeList(actions).length > 0 && <PlanningCalendar actions={actions} />}

      {/* Actions Grid */}
      {filteredActions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <Target className="w-12 h-12 mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500">Nenhuma ação encontrada</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredActions.map((action) => {
            const progress =
              action.expected_reach > 0
                ? Math.min(100, (action.actual_reach / action.expected_reach) * 100)
                : 0;

            return (
              <Card key={action.id} className="group border-0 shadow-sm hover:shadow-md transition-all">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <Badge className={statusColors[action.status || "planned"]}>
                        {statusLabels[action.status || "planned"]}
                      </Badge>
                      <CardTitle className="text-lg mt-2">{action.title}</CardTitle>
                      <p className="text-xs text-slate-500 mt-1">
                        {typeLabels[action.type || "other"]}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditingAction(action);
                            setFormOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeleteAction(action)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  {action.description && (
                    <p className="text-sm text-slate-600 line-clamp-2 mb-3">
                      {action.description}
                    </p>
                  )}

                  <div className="space-y-2 mb-4">
                    {(action.neighborhood || action.city) && (
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>
                          {[action.neighborhood, action.city].filter(Boolean).join(", ")}
                        </span>
                      </div>
                    )}
                    {action.start_date && (
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <CalendarIcon className="w-3.5 h-3.5" />
                        <span>
                          {format(new Date(action.start_date), "dd/MM/yyyy", { locale: ptBR })}
                          {action.end_date &&
                            ` - ${format(new Date(action.end_date), "dd/MM/yyyy", { locale: ptBR })}`}
                        </span>
                      </div>
                    )}
                  </div>

                  {action.expected_reach > 0 && (
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                        <span>Progresso</span>
                        <span>
                          {action.actual_reach || 0} / {action.expected_reach}
                        </span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Form Sheet */}
      <ActionFormSheet
        open={formOpen}
        onOpenChange={setFormOpen}
        action={editingAction}
        onSave={(data) => {
          if (editingAction) {
            updateMutation.mutate({ id: editingAction.id, data });
          } else {
            createMutation.mutate(data);
          }
        }}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteAction} onOpenChange={() => setDeleteAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir ação?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A ação "{deleteAction?.title}" será removida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(deleteAction?.id)}
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

function ActionFormSheet({ open, onOpenChange, action, onSave, isLoading }) {
  const [formData, setFormData] = React.useState({
    title: "",
    description: "",
    type: "event",
    city: "",
    neighborhood: "",
    start_date: "",
    end_date: "",
    responsible: "",
    goal: "",
    expected_reach: 0,
    actual_reach: 0,
    status: "planned",
    budget: 0,
    notes: "",
  });

  React.useEffect(() => {
    if (action) {
      setFormData(action);
    } else {
      setFormData({
        title: "",
        description: "",
        type: "event",
        city: "",
        neighborhood: "",
        start_date: "",
        end_date: "",
        responsible: "",
        goal: "",
        expected_reach: 0,
        actual_reach: 0,
        status: "planned",
        budget: 0,
        notes: "",
      });
    }
  }, [action, open]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{action ? "Editar Ação" : "Nova Ação"}</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <div>
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="Título da ação"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tipo</Label>
              <Select value={formData.type} onValueChange={(v) => handleChange("type", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="event">Evento</SelectItem>
                  <SelectItem value="campaign">Campanha</SelectItem>
                  <SelectItem value="visit">Visita</SelectItem>
                  <SelectItem value="meeting">Reunião</SelectItem>
                  <SelectItem value="training">Treinamento</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(v) => handleChange("status", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planned">Planejado</SelectItem>
                  <SelectItem value="in_progress">Em Andamento</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleChange("city", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="neighborhood">Bairro</Label>
              <Input
                id="neighborhood"
                value={formData.neighborhood}
                onChange={(e) => handleChange("neighborhood", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_date">Data Início</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => handleChange("start_date", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="end_date">Data Fim</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => handleChange("end_date", e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="responsible">Responsável</Label>
            <Input
              id="responsible"
              value={formData.responsible}
              onChange={(e) => handleChange("responsible", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="expected_reach">Alcance Esperado</Label>
              <Input
                id="expected_reach"
                type="number"
                min="0"
                value={formData.expected_reach}
                onChange={(e) => handleChange("expected_reach", parseInt(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label htmlFor="actual_reach">Alcance Real</Label>
              <Input
                id="actual_reach"
                type="number"
                min="0"
                value={formData.actual_reach}
                onChange={(e) => handleChange("actual_reach", parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="budget">Orçamento (R$)</Label>
            <Input
              id="budget"
              type="number"
              min="0"
              step="0.01"
              value={formData.budget}
              onChange={(e) => handleChange("budget", parseFloat(e.target.value) || 0)}
            />
          </div>

          <SheetFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar
                </>
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
