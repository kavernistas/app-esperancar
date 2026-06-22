import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Edit, Trash2, Phone, Mail, MapPin, Users, Target } from "lucide-react";

const strengthColors = {
  low: "bg-slate-100 text-slate-600 border-slate-200",
  medium: "bg-blue-100 text-blue-600 border-blue-200",
  high: "bg-emerald-100 text-emerald-600 border-emerald-200",
  very_high: "bg-purple-100 text-purple-600 border-purple-200",
};

const strengthLabels = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  very_high: "Muito Alta",
};

export default function LeaderCard({ leader, onEdit, onDelete }) {
  const progress = leader.monthly_goal > 0
    ? Math.min(100, (leader.conversions / leader.monthly_goal) * 100)
    : 0;

  return (
    <Card className="group border-0 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
      <div className="h-1.5 bg-gradient-to-r from-blue-500 to-blue-600" />
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12 ring-2 ring-blue-100">
              {leader.photo_url ? (
                <img src={leader.photo_url} alt={leader.name} className="object-cover" />
              ) : (
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-lg">
                  {leader.name?.charAt(0)?.toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <h3 className="font-semibold text-slate-800">{leader.name}</h3>
              <Badge className={`text-xs mt-1 ${strengthColors[leader.political_strength || "medium"]}`}>
                Força {strengthLabels[leader.political_strength || "medium"]}
              </Badge>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(leader)}>
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(leader)} className="text-red-600">
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Contact Info */}
        <div className="space-y-2 mb-4">
          {leader.phone && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Phone className="w-3.5 h-3.5" />
              <span>{leader.phone}</span>
            </div>
          )}
          {leader.email && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Mail className="w-3.5 h-3.5" />
              <span className="truncate">{leader.email}</span>
            </div>
          )}
          {(leader.neighborhood || leader.city) && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <MapPin className="w-3.5 h-3.5" />
              <span>{[leader.neighborhood, leader.city].filter(Boolean).join(", ")}</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-slate-50 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-slate-500 mb-1">
              <Users className="w-3.5 h-3.5" />
              <span className="text-xs">Apoiadores</span>
            </div>
            <p className="text-lg font-bold text-slate-800">{leader.supporters_count || 0}</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-slate-500 mb-1">
              <Target className="w-3.5 h-3.5" />
              <span className="text-xs">Conversões</span>
            </div>
            <p className="text-lg font-bold text-slate-800">{leader.conversions || 0}</p>
          </div>
        </div>

        {/* Progress */}
        {leader.monthly_goal > 0 && (
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
              <span>Meta Mensal</span>
              <span>{leader.conversions || 0} / {leader.monthly_goal}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}