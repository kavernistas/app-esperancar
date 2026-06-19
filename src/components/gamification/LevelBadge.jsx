import React from "react";
import { Badge } from "@/components/ui/badge";
import { Sprout, Users, Building2, Shield, Star } from "lucide-react";

const LEVEL_CONFIG = {
  semente: { label: "Semente", icon: Sprout, color: "bg-amber-100 text-amber-800 border-amber-300" },
  mobilizador: { label: "Mobilizador", icon: Users, color: "bg-blue-100 text-blue-800 border-blue-300" },
  lideranca_local: { label: "Liderança Local", icon: Building2, color: "bg-purple-100 text-purple-800 border-purple-300" },
  coordenador_territorial: { label: "Coordenador Territorial", icon: Shield, color: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  referencia_esperancar: { label: "Referência Esperançar", icon: Star, color: "bg-yellow-100 text-yellow-800 border-yellow-300" },
};

export default function LevelBadge({ level, size = "sm" }) {
  const config = LEVEL_CONFIG[level] || LEVEL_CONFIG.semente;
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={`gap-1 ${config.color} ${size === "lg" ? "px-3 py-1.5 text-sm" : "px-2 py-0.5 text-xs"}`}>
      <Icon className={size === "lg" ? "w-4 h-4" : "w-3 h-3"} />
      {config.label}
    </Badge>
  );
}