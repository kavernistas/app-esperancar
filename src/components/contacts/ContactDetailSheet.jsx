import {
  Sheet, SheetContent, SheetHeader, SheetTitle
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Phone, Mail, MapPin, Star, Hash, Activity, Layers
} from "lucide-react";
import ContactMissionList from "@/components/contacts/ContactMissionList";

const statusColors = {
  active: "bg-emerald-100 text-emerald-700",
  inactive: "bg-slate-100 text-slate-600",
  pending: "bg-amber-100 text-amber-700",
};

const statusLabels = { active: "Ativo", inactive: "Inativo", pending: "Pendente" };

export default function ContactDetailSheet({ contact, open, onOpenChange }) {
  if (!contact) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="w-14 h-14">
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xl">
                {contact.full_name?.charAt(0)?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <SheetTitle className="text-lg">{contact.full_name}</SheetTitle>
                {contact.is_leader && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
              </div>
              <Badge className={`mt-1 ${statusColors[contact.status || "active"]}`}>
                {statusLabels[contact.status || "active"]}
              </Badge>
            </div>
          </div>
        </SheetHeader>

        {/* Info */}
        <div className="space-y-3 mb-6">
          {contact.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span className="text-slate-700">{contact.phone}</span>
            </div>
          )}
          {contact.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span className="text-slate-700">{contact.email}</span>
            </div>
          )}
          {(contact.city || contact.neighborhood) && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span className="text-slate-700">{[contact.neighborhood, contact.city].filter(Boolean).join(", ")}</span>
            </div>
          )}
        </div>

        {/* Electoral data */}
        {(contact.electoral_zone || contact.electoral_section || contact.voting_location) && (
          <div className="mb-6 p-3 bg-slate-50 rounded-lg">
            <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Dados Eleitorais</p>
            <div className="space-y-1.5 text-sm">
              {contact.electoral_zone && (
                <div className="flex items-center gap-2"><Hash className="w-3.5 h-3.5 text-slate-400" /><span>Zona {contact.electoral_zone}</span></div>
              )}
              {contact.electoral_section && (
                <div className="flex items-center gap-2"><Layers className="w-3.5 h-3.5 text-slate-400" /><span>Seção {contact.electoral_section}</span></div>
              )}
              {contact.voting_location && (
                <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-slate-400" /><span>{contact.voting_location}</span></div>
              )}
            </div>
          </div>
        )}

        {/* Engagement */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Engajamento</p>
          <div className="flex items-center gap-3">
            <Progress value={contact.engagement_level || 0} className="flex-1 h-2.5" />
            <span className="text-sm font-semibold text-slate-700">{contact.engagement_level || 0}%</span>
          </div>
        </div>

        {/* Tags */}
        {contact.tags?.length > 0 && (
          <div className="mb-6">
            <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Tags</p>
            <div className="flex flex-wrap gap-1">
              {contact.tags.map((tag, i) => (
                <Badge key={i} variant="outline" className="text-[10px]">{tag}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {contact.notes && (
          <div className="mb-6">
            <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Histórico</p>
            <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3 whitespace-pre-wrap">{contact.notes}</p>
          </div>
        )}

        {/* Missions */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase mb-2 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5" />Missões
          </p>
          <ContactMissionList contactId={contact.id} />
        </div>
      </SheetContent>
    </Sheet>
  );
}