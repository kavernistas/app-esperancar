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
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { 
  MoreVertical, 
  Edit, 
  Trash2, 
  MapPin, 
  User, 
  Calendar as CalIcon,
  Heart,
  GraduationCap,
  Wrench,
  Shield,
  Users,
  Briefcase,
  Home,
  Bus,
  HelpCircle,
  MessageSquare
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import DemandComments from "./DemandComments";
import { useState } from "react";

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

export default function DemandCard({ demand, onEdit, onDelete, onStatusChange, onAddComment }) {
  const [detailOpen, setDetailOpen] = useState(false);
  const Icon = typeIcons[demand.type] || HelpCircle;

  return (
    <>
    <Card className="group border-0 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden cursor-pointer" onClick={() => setDetailOpen(true)}>
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
            <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(demand); }}>
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(demand); }} className="text-red-600">
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
              <CalIcon className="w-3.5 h-3.5" />
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

        {/* Comment count */}
        {(demand.history || []).filter(h => h.action === "comment").length > 0 && (
          <div className="flex items-center gap-1 mt-2 text-xs text-blue-500">
            <MessageSquare className="w-3 h-3" />
            {(demand.history || []).filter(h => h.action === "comment").length} comentário(s)
          </div>
        )}
      </CardContent>
    </Card>

    {/* Detail Sheet */}
    <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle className="text-lg">{demand.title}</SheetTitle>
          <div className="flex items-center gap-2 mt-1">
            <Badge className={statusColors[demand.status || "open"]}>{statusLabels[demand.status || "open"]}</Badge>
            <Badge variant="outline">{typeLabels[demand.type] || "Outros"}</Badge>
          </div>
        </SheetHeader>
        <div className="space-y-4">
          {demand.description && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Descrição</p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{demand.description}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {demand.requester_name && <div><span className="text-xs text-slate-400">Solicitante</span><p className="font-medium">{demand.requester_name}</p></div>}
            {demand.requester_phone && <div><span className="text-xs text-slate-400">Telefone</span><p className="font-medium">{demand.requester_phone}</p></div>}
            {demand.city && <div><span className="text-xs text-slate-400">Cidade</span><p className="font-medium">{demand.city}</p></div>}
            {demand.neighborhood && <div><span className="text-xs text-slate-400">Bairro</span><p className="font-medium">{demand.neighborhood}</p></div>}
            {demand.responsible && <div><span className="text-xs text-slate-400">Responsável</span><p className="font-medium">{demand.responsible}</p></div>}
            {demand.due_date && <div><span className="text-xs text-slate-400">Prazo</span><p className="font-medium">{format(new Date(demand.due_date), "dd/MM/yyyy", { locale: ptBR })}</p></div>}
          </div>
          <DemandComments demand={demand} onAddComment={onAddComment} />
        </div>
      </SheetContent>
    </Sheet>
    </>
  );
}