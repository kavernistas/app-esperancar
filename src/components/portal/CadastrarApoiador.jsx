import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, Save, Loader2, CheckCircle } from "lucide-react";
import LocationPicker from "@/components/ui/LocationPicker";

const SEGMENTS = ["Jovem", "Mulher", "Idoso", "Trabalhador", "Empresário", "Estudante", "Religioso", "Comunitário", "Outros"];
const SUPPORT_OPTIONS = [
  { value: "apoiador", label: "Apoiador" },
  { value: "indeciso", label: "Indeciso" },
  { value: "contrario", label: "Contrário" },
  { value: "lideranca_potencial", label: "Liderança Potencial" },
];

export default function CadastrarApoiador({ onSave, user }) {
  const [form, setForm] = useState({
    full_name: "", phone: "", neighborhood: "", address_street: "", address_number: "",
    electoral_zone: "", electoral_section: "", segment: "", support_intent: "indeciso",
    contact_authorized: true, notes: "", latitude: null, longitude: null,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleChange = (f, v) => setForm(p => ({ ...p, [f]: v }));
  const required = form.full_name.trim() && form.neighborhood.trim();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!required) return;
    setSaving(true);
    await onSave({
      ...form,
      created_by_leader_id: user?.id,
      created_by_leader_name: user?.full_name || user?.email,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setForm({ full_name: "", phone: "", neighborhood: "", address_street: "", address_number: "", electoral_zone: "", electoral_section: "", segment: "", support_intent: "indeciso", contact_authorized: true, notes: "", latitude: null, longitude: null });
    }, 1500);
  };

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-blue-600" />
          Cadastrar Apoiador
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label className="text-xs">Nome completo *</Label>
            <Input value={form.full_name} onChange={e => handleChange("full_name", e.target.value)} placeholder="Nome do apoiador" className="h-9 text-sm" required />
          </div>
          <div>
            <Label className="text-xs">Telefone / WhatsApp</Label>
            <Input value={form.phone} onChange={e => handleChange("phone", e.target.value)} placeholder="(00) 00000-0000" className="h-9 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Bairro *</Label>
              <Input value={form.neighborhood} onChange={e => handleChange("neighborhood", e.target.value)} placeholder="Bairro" className="h-9 text-sm" required />
            </div>
            <div>
              <Label className="text-xs">Segmento</Label>
              <Select value={form.segment} onValueChange={v => handleChange("segment", v)}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>{SEGMENTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Rua</Label>
              <Input value={form.address_street} onChange={e => handleChange("address_street", e.target.value)} placeholder="Rua" className="h-9 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Número</Label>
              <Input value={form.address_number} onChange={e => handleChange("address_number", e.target.value)} placeholder="Nº" className="h-9 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Zona Eleitoral</Label>
              <Input value={form.electoral_zone} onChange={e => handleChange("electoral_zone", e.target.value)} placeholder="Zona" className="h-9 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Seção Eleitoral</Label>
              <Input value={form.electoral_section} onChange={e => handleChange("electoral_section", e.target.value)} placeholder="Seção" className="h-9 text-sm" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Intenção de Apoio</Label>
            <Select value={form.support_intent} onValueChange={v => handleChange("support_intent", v)}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>{SUPPORT_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Observações</Label>
            <Textarea value={form.notes} onChange={e => handleChange("notes", e.target.value)} placeholder="Observações relevantes..." rows={2} className="text-sm" />
          </div>
          <div>
            <Label className="text-xs">Localização no Mapa</Label>
            <LocationPicker
              value={{ latitude: form.latitude, longitude: form.longitude }}
              onChange={({ latitude, longitude }) => { handleChange("latitude", latitude); handleChange("longitude", longitude); }}
              height={180}
              placeholder="Buscar endereço..."
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch checked={form.contact_authorized} onCheckedChange={v => handleChange("contact_authorized", v)} />
              <Label className="text-xs">Autoriza contato</Label>
            </div>
            <Button type="submit" disabled={!required || saving || saved} size="sm" className="bg-blue-600 hover:bg-blue-700">
              {saved ? <><CheckCircle className="w-4 h-4 mr-1" /> Salvo!</> : saving ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Salvando...</> : <><Save className="w-4 h-4 mr-1" /> Salvar</>}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}