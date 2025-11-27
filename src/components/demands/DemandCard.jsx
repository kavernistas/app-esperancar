import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  MoreVertical, 
  Edit, 
  Trash2, 
  MapPin, 
  User, 
  Calendar,
  Heart,
  GraduationCap,
  Wrench,
  Shield,
  Users,
  Briefcase,
  Home,
  Bus,
  HelpCircle
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusColors = {
  open: "bg-amber-100 text-amber-700 border-amber-200",
  in_progress: "bg-blue-100 text-blue-700 border-blue-200",
  pending: "bg-orange-100 text-orange-700 border-orange-200",
  resolved: "bg-emerald-100 text-emerald-700 border-emerald-200",
  cancelled: "bg-slate-100 text-slate-600 border-slate-200",
};

const statusLabels = {
  open: "Aberto",
  in_progress: "Em Andamento",
  pending: "Pendente",
  resolved: "Resolvido",
  cancelled: "Cancelado",
};

const priorityColors = {
  low: "bg-slate-500",
  medium: "bg-blue-500",
  high: "bg-orange-500",
  urgent: "bg-red-500",
};

const typeIcons = {
  health: Heart,
  education: GraduationCap,
  infrastructure: Wrench,
  security: Shield,
  social: Users,
  employment: Briefcase,
  housing: Home,
  transport: Bus,
  other: HelpCircle,
};

const typeLabels = {
  health: "Saúde",
  education: "Educação",
  infrastructure: "Infraestrutura",
  security: "Segurança",
  social: "Assistência Social",
  employment: "Emprego",
  housing: "Habitação",
  transport: "Transporte",
  other: "Outros",
};

export default function DemandCard({ demand, onEdit, onDelete, onStatusChange }) {
  const Icon = typeIcons[demand.type] || HelpCircle;

  return (
    <Card className="group border-0 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
      <div className={`h-1 ${priorityColors[demand.priority || "medium"]}`} />
      <CardHeader className="p-4 pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-slate-100">
              <Icon className="w-4 h-4 text-slate-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-800 line-clamp-1">{demand.title}</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {typeLabels[demand.type] || "Outros"}
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(demand)}>
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(demand)} className="text-red-600">
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        {demand.description && (
          <p className="text-sm text-slate-600 line-clamp-2 mb-3">
            {demand.description}
          </p>
        )}

        <div className="space-y-2 mb-3">
          {demand.requester_name && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <User className="w-3.5 h-3.5" />
              <span>{demand.requester_name}</span>
            </div>
          )}
          {(demand.neighborhood || demand.city) && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <MapPin className="w-3.5 h-3.5" />
              <span>{[demand.neighborhood, demand.city].filter(Boolean).join(", ")}</span>
            </div>
          )}
          {demand.due_date && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Calendar className="w-3.5 h-3.5" />
              <span>Prazo: {format(new Date(demand.due_date), "dd/MM/yyyy", { locale: ptBR })}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <Badge className={statusColors[demand.status || "open"]}>
            {statusLabels[demand.status || "open"]}
          </Badge>
          {demand.responsible && (
            <span className="text-xs text-slate-500">
              {demand.responsible}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}