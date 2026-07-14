import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClipboardList, Save, Loader2, Camera } from "lucide-react";
import LocationPicker from "@/components/ui/LocationPicker";
import { geocodeAddress } from "@/lib/geocode";
import * as filesApi from '@/api/files';

const DEMAND_TYPES = [
  { value: "health", label: "Saúde" },
  { value: "education", label: "Educação" },
  { value: "zeladoria", label: "Zeladoria" },
  { value: "iluminacao", label: "Iluminação" },
  { value: "infrastructure", label: "Infraestrutura" },
  { value: "transport", label: "Transporte" },
  { value: "social", label: "Assistência Social" },
  { value: "security", label: "Segurança" },
  { value: "housing", label: "Moradia" },
  { value: "employment", label: "Emprego" },
  { value: "documentacao", label: "Documentação" },
  { value: "other", label: "Outros" },
];

function generateProtocol() {
  return "DEM-" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).substring(2, 6).toUpperCase();
}

export default function CadastrarDemanda({ onSave, user, contacts }) {
  const [form, setForm] = useState({
    title: "", type: "other", description: "", requester_name: "", requester_phone: "",
    address: "", neighborhood: "", priority: "medium", supporter_id: "", photo_url: "",
    latitude: null, longitude: null,
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (f, v) => setForm(p => ({ ...p, [f]: v }));
  const required = form.title.trim() && form.type;

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await filesApi.uploadFile({ file });
      handleChange("photo_url", res.file_url);
    } catch (err) { /* ignore */ }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!required) return;
    setSaving(true);
    const supporter = contacts?.find(c => c.id === form.supporter_id);
    let finalData = { ...form };
    // Geocode on save if no coordinates but address info exists
    if ((!finalData.latitude || !finalData.longitude) && (finalData.address || finalData.neighborhood)) {
      const coords = await geocodeAddress({ street: finalData.address, neighborhood: finalData.neighborhood });
      if (coords) {
        finalData = { ...finalData, latitude: coords.latitude, longitude: coords.longitude };
      }
    }
    await onSave({
      ...finalData,
      protocol: generateProtocol(),
      status: "open",
      created_by_leader_id: user?.id,
      created_by_leader_name: user?.full_name || user?.email,
      supporter_name: supporter?.full_name || "",
    });
    setSaving(false);
    setForm({ title: "", type: "other", description: "", requester_name: "", requester_phone: "", address: "", neighborhood: "", priority: "medium", supporter_id: "", photo_url: "", latitude: null, longitude: null });
  };

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-amber-600" />
          Cadastrar Demanda
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label className="text-xs">Título *</Label>
            <Input value={form.title} onChange={e => handleChange("title", e.target.value)} placeholder="Título da demanda" className="h-9 text-sm" required />
          </div>
          <div>
            <Label className="text-xs">Tipo *</Label>
            <Select value={form.type} onValueChange={v => handleChange("type", v)}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>{DEMAND_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Solicitante</Label>
              <Input value={form.requester_name} onChange={e => handleChange("requester_name", e.target.value)} placeholder="Nome" className="h-9 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Telefone</Label>
              <Input value={form.requester_phone} onChange={e => handleChange("requester_phone", e.target.value)} placeholder="(00) 00000-0000" className="h-9 text-sm" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Endereço</Label>
            <Input value={form.address} onChange={e => handleChange("address", e.target.value)} placeholder="Endereço completo" className="h-9 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Bairro</Label>
              <Input value={form.neighborhood} onChange={e => handleChange("neighborhood", e.target.value)} placeholder="Bairro" className="h-9 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Prioridade</Label>
              <Select value={form.priority} onValueChange={v => handleChange("priority", v)}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs">Vínculo com Apoiador</Label>
            <Select value={form.supporter_id} onValueChange={v => handleChange("supporter_id", v)}>
              <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Nenhum" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>Nenhum</SelectItem>
                {(contacts || []).map(c => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Descrição</Label>
            <Textarea value={form.description} onChange={e => handleChange("description", e.target.value)} placeholder="Descreva a demanda..." rows={3} className="text-sm" />
          </div>
          <div>
            <Label className="text-xs">Localização no Mapa</Label>
            <LocationPicker
              value={{ latitude: form.latitude, longitude: form.longitude }}
              onChange={({ latitude, longitude }) => { handleChange("latitude", latitude); handleChange("longitude", longitude); }}
              height={180}
              placeholder="Buscar endereço da demanda..."
            />
          </div>
          <div className="flex items-center gap-3">
            <Label className="text-xs flex items-center gap-1.5 cursor-pointer text-blue-600 hover:text-blue-700">
              <Camera className="w-4 h-4" />
              {form.photo_url ? "Foto anexada" : "Anexar foto"}
              <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
            </Label>
            {form.photo_url && <span className="text-[10px] text-emerald-600">✓</span>}
          </div>
          <Button type="submit" disabled={!required || saving} size="sm" className="w-full bg-amber-600 hover:bg-amber-700">
            {saving ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Salvando...</> : <><Save className="w-4 h-4 mr-1" /> Registrar Demanda</>}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}