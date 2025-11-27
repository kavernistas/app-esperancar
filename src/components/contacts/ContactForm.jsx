import React, { useState, useEffect } from "react";
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
import { X, Save, Loader2 } from "lucide-react";

export default function ContactForm({ open, onOpenChange, contact, onSave, isLoading }) {
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    email: "",
    city: "",
    neighborhood: "",
    electoral_zone: "",
    electoral_section: "",
    voting_location: "",
    position: "",
    is_leader: false,
    engagement_level: 50,
    tags: [],
    notes: "",
    status: "active",
  });

  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    if (contact) {
      setFormData({
        ...contact,
        tags: contact.tags || [],
      });
    } else {
      setFormData({
        full_name: "",
        phone: "",
        email: "",
        city: "",
        neighborhood: "",
        electoral_zone: "",
        electoral_section: "",
        voting_location: "",
        position: "",
        is_leader: false,
        engagement_level: 50,
        tags: [],
        notes: "",
        status: "active",
      });
    }
  }, [contact, open]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
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
                <SelectItem value="pending">Pendente</SelectItem>
              </SelectContent>
            </Select>
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