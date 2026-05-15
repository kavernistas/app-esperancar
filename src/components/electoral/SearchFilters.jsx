import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Loader2 } from "lucide-react";

const ANOS = ["2024", "2022", "2020", "2018", "2016", "2014", "2012"];

const ESTADOS = [
  "AC","AL","AM","AP","BA","CE","DF","ES","GO","MA",
  "MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN",
  "RO","RR","RS","SC","SE","SP","TO"
];

const CARGOS = [
  { value: "presidente", label: "Presidente" },
  { value: "governador", label: "Governador" },
  { value: "senador", label: "Senador" },
  { value: "deputado_federal", label: "Deputado Federal" },
  { value: "deputado_estadual", label: "Deputado Estadual" },
  { value: "prefeito", label: "Prefeito" },
  { value: "vereador", label: "Vereador" },
];

export default function SearchFilters({ filters, onFiltersChange, onSearch, loading }) {
  const handleChange = (key, value) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Ano */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Ano da Eleição
          </label>
          <Select value={filters.ano} onValueChange={(v) => handleChange("ano", v)}>
            <SelectTrigger className="h-11 border-slate-200 focus:border-blue-500">
              <SelectValue placeholder="Selecione o ano" />
            </SelectTrigger>
            <SelectContent>
              {ANOS.map((ano) => (
                <SelectItem key={ano} value={ano}>{ano}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Estado */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Estado (UF)
          </label>
          <Select value={filters.uf} onValueChange={(v) => handleChange("uf", v)}>
            <SelectTrigger className="h-11 border-slate-200 focus:border-blue-500">
              <SelectValue placeholder="Selecione a UF" />
            </SelectTrigger>
            <SelectContent>
              {ESTADOS.map((uf) => (
                <SelectItem key={uf} value={uf}>{uf}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Cargo */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Cargo
          </label>
          <Select value={filters.cargo} onValueChange={(v) => handleChange("cargo", v)}>
            <SelectTrigger className="h-11 border-slate-200 focus:border-blue-500">
              <SelectValue placeholder="Selecione o cargo" />
            </SelectTrigger>
            <SelectContent>
              {CARGOS.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Candidato */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Candidato ou Número
          </label>
          <Input
            className="h-11 border-slate-200 focus:border-blue-500"
            placeholder="Nome ou número..."
            value={filters.candidato}
            onChange={(e) => handleChange("candidato", e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearch()}
          />
        </div>

        {/* Botão */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide opacity-0 select-none">
            Ação
          </label>
          <Button
            onClick={onSearch}
            disabled={loading || !filters.ano || !filters.uf || !filters.cargo}
            className="w-full h-11 bg-blue-700 hover:bg-blue-800 text-white font-semibold"
          >
            {loading
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Consultando...</>
              : <><Search className="w-4 h-4 mr-2" />Consultar API TSE</>
            }
          </Button>
        </div>
      </div>
    </div>
  );
}