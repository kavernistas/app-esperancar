import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Plus,
  FileText,
  Calendar,
  TrendingUp,
  Edit,
  Trash2,
  MoreVertical,
  Save,
  Loader2,
  Vote,
  Users,
  DollarSign,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import * as campaignsApi from '@/api/campaigns';

const statusColors = {
  planning: "bg-slate-100 text-slate-600",
  active: "bg-emerald-100 text-emerald-600",
  finished: "bg-blue-100 text-blue-600",
};

const statusLabels = {
  planning: "Planejamento",
  active: "Ativa",
  finished: "Finalizada",
};

const typeLabels = {
  municipal: "Municipal",
  state: "Estadual",
  federal: "Federal",
};

const positionLabels = {
  mayor: "Prefeito",
  councilor: "Vereador",
  governor: "Governador",
  state_deputy: "Dep. Estadual",
  federal_deputy: "Dep. Federal",
  senator: "Senador",
  president: "Presidente",
};

export default function Campaigns() {
  const [formOpen, setFormOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [deleteCampaign, setDeleteCampaign] = useState(null);

  const queryClient = useQueryClient();

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ["campaigns"],
    queryFn: () => campaignsApi.listCampaigns({ sort: "-created_at", limit: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: (data) => campaignsApi.createCampaign(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      setFormOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => campaignsApi.updateCampaign(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      setFormOpen(false);
      setEditingCampaign(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => campaignsApi.deleteCampaign(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      setDeleteCampaign(null);
    },
  });

  // Stats
  const activeCampaigns = campaigns.filter((c) => c.status === "ACTIVE" || c.status === "active").length;
  const totalVoteGoal = campaigns.reduce((sum, c) => sum + (c.vote_goal || 0), 0);
  const totalCurrentVotes = campaigns.reduce((sum, c) => sum + (c.current_votes_estimate || 0), 0);
  const totalBudget = campaigns.reduce((sum, c) => sum + (c.budget || 0), 0);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-lg" />
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
          <h1 className="text-2xl font-bold text-slate-900">Campanhas</h1>
          <p className="text-slate-500 mt-1">Gerencie suas campanhas eleitorais</p>
        </div>
        <Button
          onClick={() => {
            setEditingCampaign(null);
            setFormOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Campanha
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <FileText className="w-4 h-4" />
            <span className="text-sm">Total</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{campaigns.length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm">Ativas</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{activeCampaigns}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Vote className="w-4 h-4" />
            <span className="text-sm">Meta de Votos</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">{totalVoteGoal.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <DollarSign className="w-4 h-4" />
            <span className="text-sm">Orçamento Total</span>
          </div>
          <p className="text-2xl font-bold text-purple-600">
            R$ {totalBudget.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Campaigns Grid */}
      {campaigns.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <FileText className="w-12 h-12 mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500">Nenhuma campanha cadastrada</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => {
            const progress =
              campaign.vote_goal > 0
                ? Math.min(100, (campaign.current_votes_estimate / campaign.vote_goal) * 100)
                : 0;

            return (
              <Card key={campaign.id} className="group border-0 shadow-sm hover:shadow-md transition-all overflow-hidden">
                <div className={`h-2 ${campaign.status === "ACTIVE" || campaign.status === "active" ? "bg-gradient-to-r from-emerald-500 to-emerald-600" : campaign.status === "PLANNING" || campaign.status === "planning" ? "bg-gradient-to-r from-slate-400 to-slate-500" : "bg-gradient-to-r from-blue-500 to-blue-600"}`} />
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <Badge className={statusColors[campaign.status || "planning"]}>
                        {statusLabels[campaign.status || "planning"]}
                      </Badge>
                      <CardTitle className="text-lg mt-2">{campaign.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {typeLabels[campaign.type || "municipal"]}
                        </Badge>
                        {campaign.position && (
                          <Badge variant="outline" className="text-xs">
                            {positionLabels[campaign.position]}
                          </Badge>
                        )}
                      </div>
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
                            setEditingCampaign(campaign);
                            setFormOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeleteCampaign(campaign)}
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
                  {campaign.candidate_name && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                      <Users className="w-4 h-4" />
                      <span>{campaign.candidate_name}</span>
                      {campaign.party && <span className="text-slate-400">({campaign.party})</span>}
                    </div>
                  )}

                  {campaign.start_date && (
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>
                        {format(new Date(campaign.start_date), "dd/MM/yyyy", { locale: ptBR })}
                        {campaign.end_date &&
                          ` - ${format(new Date(campaign.end_date), "dd/MM/yyyy", { locale: ptBR })}`}
                      </span>
                    </div>
                  )}

                  {campaign.vote_goal > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                        <span>Progresso de Votos</span>
                        <span>
                          {(campaign.current_votes_estimate || 0).toLocaleString()} / {campaign.vote_goal.toLocaleString()}
                        </span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  )}

                  {campaign.budget > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Orçamento</span>
                      <span className="font-semibold">R$ {campaign.budget.toLocaleString()}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Form Sheet */}
      <CampaignFormSheet
        open={formOpen}
        onOpenChange={setFormOpen}
        campaign={editingCampaign}
        onSave={(data) => {
          if (editingCampaign) {
            updateMutation.mutate({ id: editingCampaign.id, data });
          } else {
            createMutation.mutate(data);
          }
        }}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteCampaign} onOpenChange={() => setDeleteCampaign(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir campanha?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A campanha "{deleteCampaign?.name}" será removida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(deleteCampaign?.id)}
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

function CampaignFormSheet({ open, onOpenChange, campaign, onSave, isLoading }) {
  const [formData, setFormData] = React.useState({
    name: "",
    type: "municipal",
    year: new Date().getFullYear(),
    position: "",
    candidate_name: "",
    party: "",
    coalition: "",
    vote_goal: 0,
    current_votes_estimate: 0,
    budget: 0,
    status: "planning",
    start_date: "",
    end_date: "",
  });

  React.useEffect(() => {
    if (campaign) {
      setFormData(campaign);
    } else {
      setFormData({
        name: "",
        type: "municipal",
        year: new Date().getFullYear(),
        position: "",
        candidate_name: "",
        party: "",
        coalition: "",
        vote_goal: 0,
        current_votes_estimate: 0,
        budget: 0,
        status: "planning",
        start_date: "",
        end_date: "",
      });
    }
  }, [campaign, open]);

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
          <SheetTitle>{campaign ? "Editar Campanha" : "Nova Campanha"}</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <div>
            <Label htmlFor="name">Nome da Campanha *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Ex: Campanha Municipal 2024"
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
                  <SelectItem value="municipal">Municipal</SelectItem>
                  <SelectItem value="state">Estadual</SelectItem>
                  <SelectItem value="federal">Federal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="year">Ano</Label>
              <Input
                id="year"
                type="number"
                value={formData.year}
                onChange={(e) => handleChange("year", parseInt(e.target.value) || new Date().getFullYear())}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Cargo</Label>
              <Select value={formData.position} onValueChange={(v) => handleChange("position", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mayor">Prefeito</SelectItem>
                  <SelectItem value="councilor">Vereador</SelectItem>
                  <SelectItem value="governor">Governador</SelectItem>
                  <SelectItem value="state_deputy">Dep. Estadual</SelectItem>
                  <SelectItem value="federal_deputy">Dep. Federal</SelectItem>
                  <SelectItem value="senator">Senador</SelectItem>
                  <SelectItem value="president">Presidente</SelectItem>
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
                  <SelectItem value="planning">Planejamento</SelectItem>
                  <SelectItem value="active">Ativa</SelectItem>
                  <SelectItem value="finished">Finalizada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="candidate_name">Nome do Candidato</Label>
            <Input
              id="candidate_name"
              value={formData.candidate_name}
              onChange={(e) => handleChange("candidate_name", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="party">Partido</Label>
              <Input
                id="party"
                value={formData.party}
                onChange={(e) => handleChange("party", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="coalition">Coligação</Label>
              <Input
                id="coalition"
                value={formData.coalition}
                onChange={(e) => handleChange("coalition", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="vote_goal">Meta de Votos</Label>
              <Input
                id="vote_goal"
                type="number"
                min="0"
                value={formData.vote_goal}
                onChange={(e) => handleChange("vote_goal", parseInt(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label htmlFor="current_votes_estimate">Estimativa Atual</Label>
              <Input
                id="current_votes_estimate"
                type="number"
                min="0"
                value={formData.current_votes_estimate}
                onChange={(e) => handleChange("current_votes_estimate", parseInt(e.target.value) || 0)}
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