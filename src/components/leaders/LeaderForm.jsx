import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Save, Loader2, Search, MapPin } from "lucide-react";
import LocationPicker from "@/components/ui/LocationPicker";
import { fetchCep, formatCep, normalizeCep, isCepComplete, cancelPendingCep } from "@/lib/cep";
import { geocodeAddress } from "@/lib/geocode";

export default function LeaderForm({ open, onOpenChange, leader, onSave, isLoading }) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    cep: "",
    address: "",
    city: "",
    neighborhood: "",
    electoral_zone: "",
    latitude: null,
    longitude: null,
    supporters_count: 0,
    political_strength: "medium",
    monthly_goal: 0,
    conversions: 0,
    actions_completed: 0,
    notes: "",
    photo_url: "",
    status: "active",
  });

  const [cepInput, setCepInput] = useState("");
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState(null);

  const handleCepChange = (value) => setCepInput(formatCep(value));

  const runCepLookup = async () => {
    setCepLoading(true);
    setCepError(null);
    try {
      const data = await fetchCep(cepInput);
      if (!data) {
        setCepError("CEP não encontrado.");
        return;
      }
      const merge = (n, o) => (n && String(n).trim() ? n : o);
      const newAddress = merge(data.street, formData.address);
      const newNeighborhood = merge(data.neighborhood, formData.neighborhood);
      const newCity = merge(data.city, formData.city);
      setFormData((prev) => ({
        ...prev,
        cep: data.cep || normalizeCep(cepInput),
        address: newAddress,
        neighborhood: newNeighborhood,
        city: newCity,
      }));
      const coords = await geocodeAddress({ street: newAddress, neighborhood: newNeighborhood, city: newCity, state: data.state });
      if (coords) {
        setFormData((prev) => ({ ...prev, latitude: coords.latitude, longitude: coords.longitude }));
      }
    } catch (e) {
      setCepError("Erro ao consultar CEP.");
    } finally {
      setCepLoading(false);
    }
  };

  const handleCepBlur = async () => {
    if (!isCepComplete(cepInput)) return;
    await runCepLookup();
  };

  useEffect(() => () => cancelPendingCep(), []);

  useEffect(() => {
    if (leader) {
      setFormData({
        ...leader,
        cep: leader.cep || "",
        address: leader.address || "",
        latitude: leader.latitude || null,
        longitude: leader.longitude || null,
      });
      setCepInput(formatCep(leader.cep || ""));
    } else {
      setFormData({
        name: "",
        phone: "",
        email: "",
        cep: "",
        address: "",
        city: "",
        neighborhood: "",
        electoral_zone: "",
        latitude: null,
        longitude: null,
        supporters_count: 0,
        political_strength: "medium",
        monthly_goal: 0,
        conversions: 0,
        actions_completed: 0,
        notes: "",
        photo_url: "",
        status: "active",
      });
      setCepInput("");
      setCepError(null);
    }
  }, [leader, open]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let finalData = { ...formData };
    if ((!finalData.latitude || !finalData.longitude) && (finalData.address || finalData.neighborhood || finalData.city)) {
      const coords = await geocodeAddress({ street: finalData.address, neighborhood: finalData.neighborhood, city: finalData.city });
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
            {leader ? "Editar Liderança" : "Nova Liderança"}
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Nome da liderança"
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

          {/* Location */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-slate-700">Região de Atuação</h3>
            <div>
              <Label htmlFor="cep">CEP</Label>
              <div className="flex gap-2">
                <Input
                  id="cep"
                  value={cepInput}
                  onChange={(e) => handleCepChange(e.target.value)}
                  onBlur={handleCepBlur}
                  placeholder="00000-000"
                  className="flex-1"
                />
                <Button type="button" variant="outline" size="icon" onClick={runCepLookup} disabled={cepLoading || !isCepComplete(cepInput)}>
                  {cepLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
              </div>
              {cepError && <p className="text-[10px] text-red-500 mt-1">{cepError}</p>}
            </div>
            <div>
              <Label htmlFor="address">Endereço</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
                placeholder="Rua, avenida..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  placeholder="Cidade"
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
              <LocationPicker
                value={{ latitude: formData.latitude, longitude: formData.longitude }}
                onChange={({ latitude, longitude }) => {
                  handleChange("latitude", latitude);
                  handleChange("longitude", longitude);
                }}
                height={200}
                placeholder="Buscar endereço da liderança..."
              />
              {formData.latitude && formData.longitude && (
                <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3" />
                  {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                </p>
              )}
            </div>
          </div>

          {/* Political Info */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-slate-700">Dados Políticos</h3>
            
            <div>
              <Label>Força Política</Label>
              <Select
                value={formData.political_strength}
                onValueChange={(value) => handleChange("political_strength", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="very_high">Muito Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="supporters_count">Nº de Apoiadores</Label>
                <Input
                  id="supporters_count"
                  type="number"
                  min="0"
                  value={formData.supporters_count}
                  onChange={(e) => handleChange("supporters_count", parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="monthly_goal">Meta Mensal</Label>
                <Input
                  id="monthly_goal"
                  type="number"
                  min="0"
                  value={formData.monthly_goal}
                  onChange={(e) => handleChange("monthly_goal", parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="conversions">Conversões</Label>
                <Input
                  id="conversions"
                  type="number"
                  min="0"
                  value={formData.conversions}
                  onChange={(e) => handleChange("conversions", parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="actions_completed">Ações Realizadas</Label>
                <Input
                  id="actions_completed"
                  type="number"
                  min="0"
                  value={formData.actions_completed}
                  onChange={(e) => handleChange("actions_completed", parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>

          {/* Status */}
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
              </SelectContent>
            </Select>
          </div>

          {/* Photo URL */}
          <div>
            <Label htmlFor="photo_url">URL da Foto</Label>
            <Input
              id="photo_url"
              value={formData.photo_url}
              onChange={(e) => handleChange("photo_url", e.target.value)}
              placeholder="https://..."
            />
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Anotações sobre a liderança..."
              rows={3}
            />
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