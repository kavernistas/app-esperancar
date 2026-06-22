import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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
import { Plus, Search, UserCheck, TrendingUp, Target, Award, MessageCircle, Download } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import LeaderCard from "@/components/leaders/LeaderCard";
import LeaderForm from "@/components/leaders/LeaderForm";
import WhatsAppModal from "@/components/integrations/WhatsAppModal";
import * as leadersApi from '@/api/leaders';

const exportLeadersCSV = (leaders) => {
  const headers = ["Nome","Telefone","Email","Cidade","Bairro","Zona","Força Política","Apoiadores","Conversões","Meta Mensal","Status","Segmento"];
  const rows = leaders.map(l => [
    l.name||"", l.phone||"", l.email||"", l.city||"", l.neighborhood||"",
    l.electoral_zone||"", l.political_strength||"", l.supporters_count||0, l.conversions||0,
    l.monthly_goal||0, l.status||"", l.segment||""
  ].map(v => `"${String(v).replace(/"/g,'""')}"`).join(","));
  const csv = "\uFEFF" + headers.join(",") + "\n" + rows.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = "liderancas.csv"; a.click();
  URL.revokeObjectURL(url);
};

export default function Leaders() {
  const [search, setSearch] = useState("");
  const [strengthFilter, setStrengthFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingLeader, setEditingLeader] = useState(null);
  const [deleteLeader, setDeleteLeader] = useState(null);
  const [whatsappOpen, setWhatsappOpen] = useState(false);

  const queryClient = useQueryClient();

  const { data: leaders = [], isLoading } = useQuery({
    queryKey: ["leaders"],
    queryFn: () => leadersApi.listLeaders("-supporters_count", 200),
  });

  const createMutation = useMutation({
    mutationFn: (data) => leadersApi.createLeader(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaders"] });
      setFormOpen(false);
      setEditingLeader(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => leadersApi.updateLeader(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaders"] });
      setFormOpen(false);
      setEditingLeader(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => leadersApi.deleteLeader(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaders"] });
      setDeleteLeader(null);
    },
  });

  const handleSave = (data) => {
    if (editingLeader) {
      updateMutation.mutate({ id: editingLeader.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (leader) => {
    setEditingLeader(leader);
    setFormOpen(true);
  };

  const handleDelete = (leader) => {
    setDeleteLeader(leader);
  };

  const filteredLeaders = leaders.filter((leader) => {
    const matchesSearch =
      search === "" ||
      leader.name?.toLowerCase().includes(search.toLowerCase()) ||
      leader.city?.toLowerCase().includes(search.toLowerCase()) ||
      leader.neighborhood?.toLowerCase().includes(search.toLowerCase());

    const matchesStrength = strengthFilter === "all" || leader.political_strength === strengthFilter;
    const matchesStatus = statusFilter === "all" || leader.status === statusFilter;

    return matchesSearch && matchesStrength && matchesStatus;
  });

  // Stats
  const totalSupporters = leaders.reduce((sum, l) => sum + (l.supporters_count || 0), 0);
  const totalConversions = leaders.reduce((sum, l) => sum + (l.conversions || 0), 0);
  const avgGoalProgress = leaders.length > 0
    ? Math.round(
        leaders.reduce((sum, l) => {
          if (l.monthly_goal > 0) {
            return sum + Math.min(100, (l.conversions / l.monthly_goal) * 100);
          }
          return sum;
        }, 0) / leaders.filter(l => l.monthly_goal > 0).length || 0
      )
    : 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-lg" />
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
          <h1 className="text-2xl font-bold text-slate-900">Lideranças</h1>
          <p className="text-slate-500 mt-1">
            Gerencie suas lideranças e multiplicadores
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingLeader(null);
            setFormOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Liderança
        </Button>
        <Button
          variant="outline"
          onClick={() => exportLeadersCSV(leaders)}
          className="border-slate-200 text-slate-700 hover:bg-slate-50"
        >
          <Download className="w-4 h-4 mr-2" />
          Exportar CSV
        </Button>
        <Button
          variant="outline"
          onClick={() => setWhatsappOpen(true)}
          className="border-green-200 text-green-700 hover:bg-green-50"
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          WhatsApp
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <UserCheck className="w-4 h-4" />
            <span className="text-sm">Total</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{leaders.length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm">Apoiadores</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">{totalSupporters.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Target className="w-4 h-4" />
            <span className="text-sm">Conversões</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{totalConversions}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Award className="w-4 h-4" />
            <span className="text-sm">Meta Média</span>
          </div>
          <p className="text-2xl font-bold text-purple-600">{avgGoalProgress}%</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-lg border">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar por nome, cidade, bairro..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-3">
          <Select value={strengthFilter} onValueChange={setStrengthFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Força" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="low">Baixa</SelectItem>
              <SelectItem value="medium">Média</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="very_high">Muito Alta</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="inactive">Inativos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Grid */}
      {filteredLeaders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <UserCheck className="w-12 h-12 mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500">Nenhuma liderança encontrada</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLeaders.map((leader) => (
            <LeaderCard
              key={leader.id}
              leader={leader}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Form */}
      <LeaderForm
        open={formOpen}
        onOpenChange={setFormOpen}
        leader={editingLeader}
        onSave={handleSave}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* WhatsApp Modal */}
      <WhatsAppModal open={whatsappOpen} onOpenChange={setWhatsappOpen} selectedContacts={[]} />

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteLeader} onOpenChange={() => setDeleteLeader(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir liderança?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A liderança "{deleteLeader?.name}" será removida permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(deleteLeader?.id)}
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