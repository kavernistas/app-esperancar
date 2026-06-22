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
import { Save, Loader2 } from "lucide-react";

export default function LeaderForm({ open, onOpenChange, leader, onSave, isLoading }) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    city: "",
    neighborhood: "",
    electoral_zone: "",
    supporters_count: 0,
    political_strength: "medium",
    monthly_goal: 0,
    conversions: 0,
    actions_completed: 0,
    notes: "",
    photo_url: "",
    status: "active",
  });

  useEffect(() => {
    if (leader) {
      setFormData(leader);
    } else {
      setFormData({
        name: "",
        phone: "",
        email: "",
        city: "",
        neighborhood: "",
        electoral_zone: "",
        supporters_count: 0,
        political_strength: "medium",
        monthly_goal: 0,
        conversions: 0,
        actions_completed: 0,
        notes: "",
        photo_url: "",
        status: "active",
      });
    }
  }, [leader, open]);

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