import React, { useState, useEffect } from "react";
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
import { Save, Loader2 } from "lucide-react";
import LocationPicker from "@/components/ui/LocationPicker";

const DEMAND_TYPES = [
  { value: "health", label: "Saúde" },
  { value: "education", label: "Educação" },
  { value: "zeladoria", label: "Zeladoria" },
  { value: "iluminacao", label: "Iluminação" },
  { value: "infrastructure", label: "Infraestrutura" },
  { value: "security", label: "Segurança" },
  { value: "social", label: "Assistência Social" },
  { value: "employment", label: "Emprego" },
  { value: "housing", label: "Habitação" },
  { value: "transport", label: "Transporte" },
  { value: "documentacao", label: "Documentação" },
  { value: "other", label: "Outros" },
];

export default function DemandForm({ open, onOpenChange, demand, onSave, isLoading }) {
  const [formData, setFormData] = useState({
    title: "",
    type: "other",
    description: "",
    requester_name: "",
    requester_phone: "",
    requester_email: "",
    city: "",
    neighborhood: "",
    priority: "medium",
    status: "open",
    responsible: "",
    due_date: "",
    latitude: null,
    longitude: null,
    address: "",
  });

  useEffect(() => {
    if (demand) {
      setFormData({
        ...demand,
        latitude: demand.latitude || null,
        longitude: demand.longitude || null,
        address: demand.address || "",
      });
    } else {
      setFormData({
        title: "",
        type: "other",
        description: "",
        requester_name: "",
        requester_phone: "",
        requester_email: "",
        city: "",
        neighborhood: "",
        priority: "medium",
        status: "open",
        responsible: "",
        due_date: "",
        latitude: null,
        longitude: null,
        address: "",
      });
    }
  }, [demand, open]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {demand ? "Editar Demanda" : "Nova Demanda"}
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder="Título da demanda"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleChange("type", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEMAND_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Prioridade</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => handleChange("priority", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
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
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Descreva a demanda em detalhes..."
                rows={4}
              />
            </div>
          </div>

          {/* Requester Info */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-slate-700">Solicitante</h3>
            <div>
              <Label htmlFor="requester_name">Nome</Label>
              <Input
                id="requester_name"
                value={formData.requester_name}
                onChange={(e) => handleChange("requester_name", e.target.value)}
                placeholder="Nome do solicitante"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="requester_phone">Telefone</Label>
                <Input
                  id="requester_phone"
                  value={formData.requester_phone}
                  onChange={(e) => handleChange("requester_phone", e.target.value)}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div>
                <Label htmlFor="requester_email">Email</Label>
                <Input
                  id="requester_email"
                  type="email"
                  value={formData.requester_email}
                  onChange={(e) => handleChange("requester_email", e.target.value)}
                  placeholder="email@exemplo.com"
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-slate-700">Localização</h3>
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
              <Label htmlFor="address">Endereço</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
                placeholder="Endereço completo"
              />
            </div>
            <div>
              <LocationPicker
                value={{ latitude: formData.latitude, longitude: formData.longitude }}
                onChange={({ latitude, longitude }) => { handleChange("latitude", latitude); handleChange("longitude", longitude); }}
                height={200}
                placeholder="Buscar endereço da demanda..."
              />
            </div>
          </div>

          {/* Management */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-slate-700">Gestão</h3>
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
                    <SelectItem value="open">Aberto</SelectItem>
                    <SelectItem value="in_progress">Em Andamento</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="resolved">Resolvido</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="due_date">Prazo</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => handleChange("due_date", e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="responsible">Responsável</Label>
              <Input
                id="responsible"
                value={formData.responsible}
                onChange={(e) => handleChange("responsible", e.target.value)}
                placeholder="Nome do responsável"
              />
            </div>
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