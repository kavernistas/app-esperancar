import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
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
import { X, Save, Loader2, Search, MapPin, Car, Home, Target, Star } from "lucide-react";
import LocationPicker from "@/components/ui/LocationPicker";
import { fetchCep, formatCep, normalizeCep, isCepComplete, cancelPendingCep } from "@/lib/cep";
import { geocodeAddress } from "@/lib/geocode";

const SUPPORT_OPTIONS = [
  { value: "apoiador", label: "Apoiador" },
  { value: "indeciso", label: "Indeciso" },
  { value: "contrario", label: "Contrário" },
  { value: "lideranca_potencial", label: "Liderança Potencial" },
];

export default function ContactForm({ open, onOpenChange, contact, onSave, isLoading }) {
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    email: "",
    cep: "",
    address_street: "",
    address_number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    electoral_zone: "",
    electoral_section: "",
    voting_location: "",
    position: "",
    is_leader: false,
    vote_goal: 0,
    engagement_level: 50,
    support_intent: "indeciso",
    contact_authorized: true,
    visual_no_carro: false,
    visual_na_residencia: false,
    tags: [],
    notes: "",
    status: "active",
    latitude: null,
    longitude: null,
  });

  const [tagInput, setTagInput] = useState("");
  const [cepInput, setCepInput] = useState("");
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState(null);
  const [cepManual, setCepManual] = useState(false);

  // CEP handlers
  const handleCepChange = (value) => {
    setCepInput(formatCep(value));
  };

  const handleCepBlur = async () => {
    if (cepManual || !isCepComplete(cepInput)) return;
    await runCepLookup();
  };

  const handleCepSearch = async () => {
    if (!isCepComplete(cepInput)) {
      setCepError("Informe 8 dígitos para buscar.");
      return;
    }
    await runCepLookup();
  };

  const runCepLookup = async () => {
    setCepLoading(true);
    setCepError(null);
    try {
      const data = await fetchCep(cepInput);
      if (!data) {
        setCepError("CEP não encontrado. Preencha manualmente.");
        return;
      }
      const merge = (newVal, oldVal) => (newVal && String(newVal).trim() ? newVal : oldVal);
      const newStreet = merge(data.street, formData.address_street);
      const newNeighborhood = merge(data.neighborhood, formData.neighborhood);
      const newCity = merge(data.city, formData.city);
      const newState = merge(data.state, formData.state);
      setFormData((prev) => ({
        ...prev,
        cep: data.cep || normalizeCep(cepInput),
        address_street: newStreet,
        complement: merge(data.complement, prev.complement),
        neighborhood: newNeighborhood,
        city: newCity,
        state: newState,
        address_number: prev.address_number || "",
      }));
      // Auto-geocode the address so the contact appears on the territorial map
      const coords = await geocodeAddress({ street: newStreet, neighborhood: newNeighborhood, city: newCity, state: newState });
      if (coords) {
        setFormData((prev) => ({ ...prev, latitude: coords.latitude, longitude: coords.longitude }));
      }
    } catch (e) {
      setCepError("Erro ao consultar CEP — preencha manualmente.");
    } finally {
      setCepLoading(false);
    }
  };

  useEffect(() => () => cancelPendingCep(), []);

  useEffect(() => {
    if (contact) {
      setFormData({
        ...contact,
        tags: contact.tags || [],
        latitude: contact.latitude || null,
        longitude: contact.longitude || null,
        cep: contact.cep || "",
        address_street: contact.address_street || "",
        address_number: contact.address_number || "",
        complement: contact.complement || "",
        state: contact.state || "",
        support_intent: contact.support_intent || "indeciso",
        contact_authorized: contact.contact_authorized !== undefined ? contact.contact_authorized : true,
        vote_goal: contact.vote_goal || 0,
        visual_no_carro: contact.visual_no_carro || false,
        visual_na_residencia: contact.visual_na_residencia || false,
      });
      setCepInput(formatCep(contact.cep || ""));
    } else {
      setFormData({
        full_name: "",
        phone: "",
        email: "",
        cep: "",
        address_street: "",
        address_number: "",
        complement: "",
        neighborhood: "",
        city: "",
        state: "",
        electoral_zone: "",
        electoral_section: "",
        voting_location: "",
        position: "",
        is_leader: false,
        vote_goal: 0,
        engagement_level: 50,
        support_intent: "indeciso",
        contact_authorized: true,
        visual_no_carro: false,
        visual_na_residencia: false,
        tags: [],
        notes: "",
        status: "active",
        latitude: null,
        longitude: null,
      });
      setCepInput("");
      setCepLoading(false);
      setCepError(null);
      setCepManual(false);
    }
  }, [contact, open]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLocation = ({ latitude, longitude }) => {
    setFormData(prev => ({ ...prev, latitude, longitude }));
  };

  const handleAddTag = (e) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      if (!formData.tags.includes(tagInput.trim())) {
        handleChange("tags", [...formData.tags, tagInput.trim()]);
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    handleChange("tags", formData.tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let finalData = { ...formData };
    // Geocode on save if no coordinates but address info exists
    if ((!finalData.latitude || !finalData.longitude) && (finalData.address_street || finalData.neighborhood || finalData.city)) {
      const coords = await geocodeAddress({ street: finalData.address_street, neighborhood: finalData.neighborhood, city: finalData.city, state: finalData.state });
      if (coords) {
        finalData = { ...finalData, latitude: coords.latitude, longitude: coords.longitude };
      }
    }
    onSave(finalData);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {contact ? "Editar Contato" : "Novo Contato"}
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="full_name">Nome Completo *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => handleChange("full_name", e.target.value)}
                placeholder="Nome do contato"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="email@exemplo.com"
                />
              </div>
            </div>
          </div>

          {/* CEP + Address */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-slate-700">Endereço</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                <Label htmlFor="cep">CEP</Label>
                <div className="flex gap-1.5">
                  <Input
                    id="cep"
                    value={cepInput}
                    onChange={(e) => handleCepChange(e.target.value)}
                    onBlur={handleCepBlur}
                    placeholder="00000-000"
                    className="text-xs"
                    maxLength={9}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleCepSearch}
                    disabled={cepLoading || !cepInput.trim()}
                    className="h-8 w-8 p-0 flex-shrink-0"
                  >
                    {cepLoading
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Search className="w-3.5 h-3.5" />}
                  </Button>
                </div>
                {cepError && (
                  <p className="text-[10px] text-red-500 mt-1">{cepError}</p>
                )}
                <button
                  type="button"
                  className="text-[10px] text-blue-600 mt-0.5 underline"
                  onClick={() => setCepManual(m => !m)}
                >
                  {cepManual ? "Buscar automaticamente" : "Não sei meu CEP"}
                </button>
              </div>
              <div className="col-span-2">
                <Label htmlFor="address_street">Logradouro</Label>
                <Input
                  id="address_street"
                  value={formData.address_street}
                  onChange={(e) => handleChange("address_street", e.target.value)}
                  placeholder="Rua, avenida..."
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="address_number">Número</Label>
                <Input
                  id="address_number"
                  value={formData.address_number}
                  onChange={(e) => handleChange("address_number", e.target.value)}
                  placeholder="Nº"
                />
              </div>
              <div>
                <Label htmlFor="complement">Complemento</Label>
                <Input
                  id="complement"
                  value={formData.complement}
                  onChange={(e) => handleChange("complement", e.target.value)}
                  placeholder="Apto, bloco..."
                />
              </div>
              <div>
                <Label htmlFor="neighborhood">Bairro</Label>
                <Input
                  id="neighborhood"
                  value={formData.neighborhood}
                  onChange={(e) => handleChange("neighborhood", e.target.value)}
                  placeholder="Bairro"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  placeholder="Cidade"
                />
              </div>
              <div>
                <Label htmlFor="state">UF</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => handleChange("state", e.target.value)}
                  placeholder="UF"
                  maxLength={2}
                />
              </div>
            </div>
          </div>

          {/* Map Picker */}
          <div className="space-y-2">
            <h3 className="font-medium text-sm text-slate-700">Marcar no Mapa</h3>
            <LocationPicker
              value={{ latitude: formData.latitude, longitude: formData.longitude }}
              onChange={handleLocation}
              height={220}
              placeholder="Buscar endereço ou CEP..."
            />
            {formData.latitude && formData.longitude && (
              <p className="text-[10px] text-slate-400 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
              </p>
            )}
          </div>

          {/* Electoral Info */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-slate-700">Dados Eleitorais</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="electoral_zone">Zona Eleitoral</Label>
                <Input
                  id="electoral_zone"
                  value={formData.electoral_zone}
                  onChange={(e) => handleChange("electoral_zone", e.target.value)}
                  placeholder="Zona"
                />
              </div>
              <div>
                <Label htmlFor="electoral_section">Seção</Label>
                <Input
                  id="electoral_section"
                  value={formData.electoral_section}
                  onChange={(e) => handleChange("electoral_section", e.target.value)}
                  placeholder="Seção"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="voting_location">Local de Votação</Label>
              <Input
                id="voting_location"
                value={formData.voting_location}
                onChange={(e) => handleChange("voting_location", e.target.value)}
                placeholder="Nome do local de votação"
              />
            </div>
          </div>

          {/* Role & Engagement */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="position">Cargo / Função</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) => handleChange("position", e.target.value)}
                placeholder="Ex: Presidente da associação"
              />
            </div>

            <div>
              <Label htmlFor="support_intent">Intenção de Apoio</Label>
              <Select
                value={formData.support_intent}
                onValueChange={(value) => handleChange("support_intent", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORT_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>É Liderança?</Label>
                <p className="text-xs text-slate-500">Marque se este contato é uma liderança</p>
              </div>
              <Switch
                checked={formData.is_leader}
                onCheckedChange={(checked) => handleChange("is_leader", checked)}
              />
            </div>

            {formData.is_leader && (
              <div>
                <Label htmlFor="vote_goal">Meta de Votos</Label>
                <Input
                  id="vote_goal"
                  type="number"
                  value={formData.vote_goal || ""}
                  onChange={(e) => handleChange("vote_goal", parseInt(e.target.value) || 0)}
                  placeholder="Ex: 50"
                  min="0"
                />
                <p className="text-xs text-slate-500 mt-1">Quantos votos essa liderança se compromete a trazer?</p>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Nível de Engajamento</Label>
                <span className="text-sm font-medium text-blue-600">{formData.engagement_level}%</span>
              </div>
              <Slider
                value={[formData.engagement_level]}
                onValueChange={(value) => handleChange("engagement_level", value[0])}
                max={100}
                step={5}
                className="py-2"
              />
            </div>
          </div>

          {/* Visuais de Campanha */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-slate-700">Visuais de Campanha</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.visual_no_carro}
                  onCheckedChange={(checked) => handleChange("visual_no_carro", checked)}
                />
                <Label className="flex items-center gap-1.5">
                  <Car className="w-4 h-4 text-blue-500" />
                  Adesivo no carro
                </Label>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.visual_na_residencia}
                  onCheckedChange={(checked) => handleChange("visual_na_residencia", checked)}
                />
                <Label className="flex items-center gap-1.5">
                  <Home className="w-4 h-4 text-green-500" />
                  Bandeira/adesivo na residência
                </Label>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <Label htmlFor="tags">Etiquetas</Label>
            <Input
              id="tags"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="Digite e pressione Enter"
              className="mb-2"
            />
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-blue-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Status + Autorização */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleChange("status", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.contact_authorized}
                  onCheckedChange={(checked) => handleChange("contact_authorized", checked)}
                />
                <Label>Autoriza contato</Label>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Histórico de relacionamento, anotações..."
              rows={3}
            />
          </div>

          <SheetFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
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