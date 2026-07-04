import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Phone, MapPin, Edit, MessageCircle, UserCheck, Car, Home, Target, Tags } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { normalizeList } from "@/lib/normalizeList";
const intentColors = {
  apoiador: "bg-emerald-100 text-emerald-700",
  indeciso: "bg-amber-100 text-amber-700",
  contrario: "bg-red-100 text-red-700",
  lideranca_potencial: "bg-purple-100 text-purple-700",
};

const intentLabels = {
  apoiador: "Apoiador",
  indeciso: "Indeciso",
  contrario: "Contrário",
  lideranca_potencial: "Líder em Potencial",
};

export default function MinhaBase({ contacts, onEdit, onAddInteraction, onSendWhatsApp, onConvertLeader }) {
  const [search, setSearch] = useState("");
  const [filterBairro, setFilterBairro] = useState("");
  const [filterSegment, setFilterSegment] = useState("");
  const [filterIntent, setFilterIntent] = useState("");
  const [filterPhone, setFilterPhone] = useState("");

  const bairros = [...new Set(normalizeList(contacts).map(c => c.neighborhood).filter(Boolean))];
  const allTags = [...new Set(contacts.flatMap(c => c.tags || []).filter(Boolean))];

  let filtered = contacts || [];
  if (search) filtered = filtered.filter(c => c.full_name?.toLowerCase().includes(search.toLowerCase()));
  if (filterBairro) filtered = filtered.filter(c => c.neighborhood === filterBairro);
  if (filterSegment) filtered = filtered.filter(c => (c.tags || []).includes(filterSegment) || c.segment === filterSegment);
  if (filterIntent) filtered = filtered.filter(c => c.support_intent === filterIntent);
  if (filterPhone === "com") filtered = filtered.filter(c => c.phone);
  if (filterPhone === "sem") filtered = filtered.filter(c => !c.phone);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome..." className="h-9 text-sm" />
      </div>

      <div className="flex gap-2 flex-wrap">
        <Select value={filterBairro} onValueChange={setFilterBairro}>
          <SelectTrigger className="h-8 text-xs w-auto"><SelectValue placeholder="Bairro" /></SelectTrigger>
          <SelectContent>{bairros.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={filterSegment} onValueChange={setFilterSegment}>
          <SelectTrigger className="h-8 text-xs w-auto"><SelectValue placeholder="Etiqueta" /></SelectTrigger>
          <SelectContent>{allTags.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={filterIntent} onValueChange={setFilterIntent}>
          <SelectTrigger className="h-8 text-xs w-auto"><SelectValue placeholder="Intenção" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="apoiador">Apoiador</SelectItem>
            <SelectItem value="indeciso">Indeciso</SelectItem>
            <SelectItem value="contrario">Contrário</SelectItem>
            <SelectItem value="lideranca_potencial">Líder em Potencial</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterPhone} onValueChange={setFilterPhone}>
          <SelectTrigger className="h-8 text-xs w-auto"><SelectValue placeholder="WhatsApp" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="com">Com WhatsApp</SelectItem>
            <SelectItem value="sem">Sem WhatsApp</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-slate-400 self-center ml-auto">{filtered.length} registros</span>
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-slate-400 py-8 text-sm">Nenhum apoiador encontrado.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map(c => (
            <Card key={c.id} className="border-slate-200">
              <CardContent className="p-3">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-sm text-slate-800">{c.full_name}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <Badge className={`text-[10px] ${intentColors[c.support_intent] || intentColors.indeciso}`}>
                        {intentLabels[c.support_intent] || "Indeciso"}
                      </Badge>
                      {(c.tags || []).map((t, i) => (
                        <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                          <Tags className="w-2.5 h-2.5" />{t}
                        </span>
                      ))}
                      {(!c.tags || c.tags.length === 0) && c.segment && (
                        <span className="text-[10px] text-slate-500">{c.segment}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {c.phone && (
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600" onClick={() => onSendWhatsApp?.(c)} title="WhatsApp">
                        <MessageCircle className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onEdit?.(c)} title="Editar">
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-purple-600" onClick={() => onConvertLeader?.(c)} title="Converter em Liderança">
                      <UserCheck className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-1 text-[11px] text-slate-500">
                  {c.phone && <div className="flex items-center gap-1"><Phone className="w-3 h-3" />{c.phone}</div>}
                  {(c.neighborhood || c.address_street) && <div className="flex items-center gap-1"><MapPin className="w-3 h-3" />{[c.address_street, c.address_number, c.neighborhood].filter(Boolean).join(", ")}</div>}
                  {c.electoral_zone && <div className="flex items-center gap-1"><span className="text-[10px]">Zona {c.electoral_zone} | Seção {c.electoral_section || "-"}</span></div>}
                </div>
                {c.is_leader && (
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {c.vote_goal > 0 && (
                      <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-medium flex items-center gap-0.5">
                        <Target className="w-3 h-3" /> Meta: {c.vote_goal} votos
                      </span>
                    )}
                    {c.converted_by_leader_name && (
                      <span className="text-[10px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded">
                        Convertida por: {c.converted_by_leader_name}
                      </span>
                    )}
                  </div>
                )}
                {(c.visual_no_carro || c.visual_na_residencia) && (
                  <div className="flex items-center gap-2 mt-1">
                    {c.visual_no_carro && <span className="text-[10px] text-blue-600 flex items-center gap-0.5"><Car className="w-3 h-3" /> Carro</span>}
                    {c.visual_na_residencia && <span className="text-[10px] text-green-600 flex items-center gap-0.5"><Home className="w-3 h-3" /> Residência</span>}
                  </div>
                )}
                {c.notes && <p className="text-[11px] text-slate-400 mt-1 italic line-clamp-1">{c.notes}</p>}
                
                {/* Interactions */}
                {c.interactions?.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-100">
                    <p className="text-[10px] font-medium text-slate-600 mb-1">Últimas interações:</p>
                    {c.interactions.slice(-2).map((ix, i) => (
                      <p key={i} className="text-[10px] text-slate-400">
                        {ix.date ? format(new Date(ix.date), "dd/MM", { locale: ptBR }) : ""} - {ix.description}
                      </p>
                    ))}
                  </div>
                )}

                {/* Quick add interaction */}
                <div className="mt-2 pt-2 border-t border-slate-100">
                  <Button variant="ghost" size="sm" className="text-[10px] h-6 text-blue-600" onClick={() => onAddInteraction?.(c)}>
                    + Nova Interação
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
