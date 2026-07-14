import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, Save, Loader2, CheckCircle, Search, Car, Home, Target, Star, Tags, X } from "lucide-react";
import LocationPicker from "@/components/ui/LocationPicker";
import { geocodeAddress } from "@/lib/geocode";

const SEGMENTS = ["Jovem", "Mulher", "Idoso", "Trabalhador", "Empresário", "Estudante", "Religioso", "Comunitário", "Outros"];
const SUPPORT_OPTIONS = [
  { value: "apoiador", label: "Apoiador" },
  { value: "indeciso", label: "Indeciso" },
  { value: "contrario", label: "Contrário" },
  { value: "lideranca_potencial", label: "Liderança Potencial" },
];

async function fetchCEP(cep) {
  const clean = cep.replace(/\D/g, "");
  if (clean.length !== 8) return null;
  try {
    const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
    const data = await res.json();
    if (data.erro) return null;
    return {
      address_street: data.logradouro || "",
      neighborhood: data.bairro || "",
      city: data.localidade || "",
      cep: data.cep || clean,
    };
  } catch { return null; }
}

export default function CadastrarApoiador({ onSave, user }) {
  const [tagInput, setTagInput] = useState("");
  const [form, setForm] = useState({
    full_name: "", phone: "", email: "", cep: "", city: "", neighborhood: "", address_street: "", address_number: "",
    electoral_zone: "", electoral_section: "", voting_location: "", position: "", segment: "", support_intent: "indeciso",
    contact_authorized: true, is_leader: false, vote_goal: 0,
    visual_no_carro: false, visual_na_residencia: false,
    engagement_level: 50, status: "active",
    tags: [],
    notes: "", latitude: null, longitude: null,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState("");

  const handleChange = (f, v) => setForm(p => ({ ...p, [f]: v }));
  const required = form.full_name.trim() && form.neighborhood.trim();

  const addTag = (tag) => {
    if (tag && !form.tags.includes(tag)) {
      setForm(p => ({ ...p, tags: [...p.tags, tag] }));
      setTagInput("");
    }
  };
  const removeTag = (tag) => {
    setForm(p => ({ ...p, tags: p.tags.filter(t => t !== tag) }));
  };
  const toggleTag = (tag) => {
    form.tags.includes(tag) ? removeTag(tag) : addTag(tag);
  };

  const handleCepSearch = async (cepValue) => {
    const cepToSearch = cepValue || form.cep;
    if (!cepToSearch || cepToSearch.replace(/\D/g, "").length < 8) return;
    setCepLoading(true);
    setCepError("");
    const result = await fetchCEP(cepToSearch);
    setCepLoading(false);
    if (result) {
      const newStreet = result.address_street || form.address_street;
      const newNeighborhood = result.neighborhood || form.neighborhood;
      const newCity = result.city || form.city;
      setForm(p => ({
        ...p,
        address_street: newStreet,
        neighborhood: newNeighborhood,
        city: newCity,
      }));
      // Auto-geocode so the supporter appears on the territorial map
      const coords = await geocodeAddress({ street: newStreet, neighborhood: newNeighborhood, city: newCity });
      if (coords) {
        setForm(p => ({ ...p, latitude: coords.latitude, longitude: coords.longitude }));
      }
    } else {
      setCepError("CEP não encontrado");
    }
  };

  const handleCepChange = (value) => {
    const clean = value.replace(/\D/g, "").slice(0, 8);
    const masked = clean.length > 5 ? `${clean.slice(0, 5)}-${clean.slice(5)}` : clean;
    setForm(p => ({ ...p, cep: masked }));
    setCepError("");
    if (clean.length === 8) handleCepSearch(clean);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!required) return;
    setSaving(true);
    let finalData = { ...form };
    // Geocode on save if no coordinates but address info exists
    if ((!finalData.latitude || !finalData.longitude) && (finalData.address_street || finalData.neighborhood || finalData.city)) {
      const coords = await geocodeAddress({ street: finalData.address_street, neighborhood: finalData.neighborhood, city: finalData.city });
      if (coords) {
        finalData = { ...finalData, latitude: coords.latitude, longitude: coords.longitude };
      }
    }
    await onSave({
      ...finalData,
      cep: finalData.cep?.replace(/\D/g, ""),
      segment: finalData.tags[0] || "",
      vote_goal: finalData.is_leader ? (finalData.vote_goal || 0) : 0,
      created_by_leader_id: user?.id,
      created_by_leader_name: user?.full_name || user?.email,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setForm({ full_name: "", phone: "", email: "", cep: "", city: "", neighborhood: "", address_street: "", address_number: "", electoral_zone: "", electoral_section: "", voting_location: "", position: "", segment: "", support_intent: "indeciso", contact_authorized: true, is_leader: false, vote_goal: 0,     visual_no_carro: false, visual_na_residencia: false, engagement_level: 50, status: "active", tags: [], notes: "", latitude: null, longitude: null });
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
          {/* Nome + Telefone + Email */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Nome completo *</Label>
              <Input value={form.full_name} onChange={e => handleChange("full_name", e.target.value)} placeholder="Nome do apoiador" className="h-9 text-sm" required />
            </div>
            <div>
              <Label className="text-xs">Telefone / WhatsApp</Label>
              <Input value={form.phone} onChange={e => handleChange("phone", e.target.value)} placeholder="(00) 00000-0000" className="h-9 text-sm" />
            </div>
          </div>

          {/* Email */}
          <div>
            <Label className="text-xs">Email</Label>
            <Input type="email" value={form.email} onChange={e => handleChange("email", e.target.value)} placeholder="email@exemplo.com" className="h-9 text-sm" />
          </div>

          {/* Cargo / Função */}
          <div>
            <Label className="text-xs">Cargo / Função</Label>
            <Input value={form.position} onChange={e => handleChange("position", e.target.value)} placeholder="Ex: Presidente da associação" className="h-9 text-sm" />
          </div>

          {/* CEP + auto preenchimento */}
          <div>
            <Label className="text-xs">CEP</Label>
            <div className="flex gap-1.5">
              <Input
                value={form.cep}
                onChange={e => handleCepChange(e.target.value)}
                placeholder="00000-000"
                className="h-9 text-sm flex-1"
                maxLength={9}
              />
              <Button type="button" size="sm" variant="outline" onClick={handleCepSearch} disabled={cepLoading || !form.cep} className="h-9 text-xs">
                {cepLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              </Button>
            </div>
            {cepError && <p className="text-[10px] text-red-500 mt-0.5">{cepError}</p>}
          </div>

          {/* Endereço */}
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <Label className="text-xs">Rua</Label>
              <Input value={form.address_street} onChange={e => handleChange("address_street", e.target.value)} placeholder="Rua" className="h-9 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Nº</Label>
              <Input value={form.address_number} onChange={e => handleChange("address_number", e.target.value)} placeholder="Nº" className="h-9 text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Bairro *</Label>
              <Input value={form.neighborhood} onChange={e => handleChange("neighborhood", e.target.value)} placeholder="Bairro" className="h-9 text-sm" required />
            </div>
            <div>
              <Label className="text-xs">Cidade</Label>
              <Input value={form.city} onChange={e => handleChange("city", e.target.value)} placeholder="Cidade" className="h-9 text-sm" />
            </div>
          </div>

          {/* Etiquetas (Segmento de atuação) */}
          <div>
            <Label className="text-xs flex items-center gap-1">
              <Tags className="w-3 h-3 text-slate-500" />
              Etiquetas (Segmento de atuação)
            </Label>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {SEGMENTS.map(s => {
                const active = form.tags.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleTag(s)}
                    className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                      active
                        ? "bg-indigo-100 border-indigo-300 text-indigo-700 font-medium"
                        : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                    }`}
                  >
                    {active && <X className="w-3 h-3 inline mr-0.5 -ml-0.5" />}
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Intenção de Apoio */}
          <div>
            <Label className="text-xs">Intenção de Apoio</Label>
            <Select value={form.support_intent} onValueChange={v => handleChange("support_intent", v)}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>{SUPPORT_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          {/* Eleitoral */}
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
            <Label className="text-xs">Local de Votação</Label>
            <Input value={form.voting_location} onChange={e => handleChange("voting_location", e.target.value)} placeholder="Nome do local de votação" className="h-9 text-sm" />
          </div>

          {/* Liderança toggle + Meta de Voto */}
          <div className="bg-slate-50 rounded-lg p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch checked={form.is_leader} onCheckedChange={v => handleChange("is_leader", v)} />
                <Label className="text-xs font-medium flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-amber-500" />
                  É Liderança
                </Label>
              </div>
              {form.is_leader && <BadgeLideranca />}
            </div>

            <div>
              <Label className="text-xs flex items-center gap-1">
                <Target className="w-3 h-3 text-indigo-500" />
                Meta de Votos {!form.is_leader && <span className="text-slate-400">(se ativar como liderança)</span>}
              </Label>
              <Input
                type="number"
                value={form.vote_goal || ""}
                onChange={e => handleChange("vote_goal", parseInt(e.target.value) || 0)}
                placeholder="Ex: 50"
                className="h-9 text-sm mt-0.5"
                min="0"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">Quantos votos essa liderança se compromete a trazer?</p>
            </div>
          </div>

          {/* Visuais */}
          <div className="bg-amber-50/50 rounded-lg p-3 space-y-2">
            <p className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
              <Car className="w-3.5 h-3.5 text-amber-600" />
              Visuais de Campanha
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch checked={form.visual_no_carro} onCheckedChange={v => handleChange("visual_no_carro", v)} />
                <Label className="text-xs flex items-center gap-1">
                  <Car className="w-3.5 h-3.5 text-blue-500" />
                  Adesivo no carro
                </Label>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch checked={form.visual_na_residencia} onCheckedChange={v => handleChange("visual_na_residencia", v)} />
                <Label className="text-xs flex items-center gap-1">
                  <Home className="w-3.5 h-3.5 text-green-500" />
                  Bandeira/adesivo na residência
                </Label>
              </div>
            </div>
          </div>

          {/* Engajamento + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Nível de Engajamento</Label>
              <div className="flex items-center gap-2 mt-1">
                <Slider
                  value={[form.engagement_level]}
                  onValueChange={(v) => handleChange("engagement_level", v[0])}
                  max={100}
                  step={5}
                  className="flex-1"
                />
                <span className="text-xs font-medium text-blue-600 w-8">{form.engagement_level}%</span>
              </div>
            </div>
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={form.status} onValueChange={v => handleChange("status", v)}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Observações */}
          <div>
            <Label className="text-xs">Observações</Label>
            <Textarea value={form.notes} onChange={e => handleChange("notes", e.target.value)} placeholder="Observações relevantes..." rows={2} className="text-sm" />
          </div>

          {/* Localização */}
          <div>
            <Label className="text-xs">Localização no Mapa (ajuste o pin)</Label>
            <LocationPicker
              value={{ latitude: form.latitude, longitude: form.longitude }}
              onChange={({ latitude, longitude }) => { handleChange("latitude", latitude); handleChange("longitude", longitude); }}
              height={180}
              placeholder="Buscar endereço para ajustar o pin..."
            />
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between pt-1">
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

function BadgeLideranca() {
  return (
    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium flex items-center gap-1">
      <Star className="w-3 h-3" /> Liderança
    </span>
  );
}