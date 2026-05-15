import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Loader2, SlidersHorizontal, ChevronDown, ChevronUp } from "lucide-react";

const ANOS = ["2024", "2022", "2020", "2018", "2016", "2014", "2012"];

const ESTADOS = [
  { value: "AC", label: "AC – Acre" }, { value: "AL", label: "AL – Alagoas" },
  { value: "AM", label: "AM – Amazonas" }, { value: "AP", label: "AP – Amapá" },
  { value: "BA", label: "BA – Bahia" }, { value: "CE", label: "CE – Ceará" },
  { value: "DF", label: "DF – Distrito Federal" }, { value: "ES", label: "ES – Espírito Santo" },
  { value: "GO", label: "GO – Goiás" }, { value: "MA", label: "MA – Maranhão" },
  { value: "MG", label: "MG – Minas Gerais" }, { value: "MS", label: "MS – Mato Grosso do Sul" },
  { value: "MT", label: "MT – Mato Grosso" }, { value: "PA", label: "PA – Pará" },
  { value: "PB", label: "PB – Paraíba" }, { value: "PE", label: "PE – Pernambuco" },
  { value: "PI", label: "PI – Piauí" }, { value: "PR", label: "PR – Paraná" },
  { value: "RJ", label: "RJ – Rio de Janeiro" }, { value: "RN", label: "RN – Rio Grande do Norte" },
  { value: "RO", label: "RO – Rondônia" }, { value: "RR", label: "RR – Roraima" },
  { value: "RS", label: "RS – Rio Grande do Sul" }, { value: "SC", label: "SC – Santa Catarina" },
  { value: "SE", label: "SE – Sergipe" }, { value: "SP", label: "SP – São Paulo" },
  { value: "TO", label: "TO – Tocantins" },
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
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleChange = (key, value) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
      {/* Main filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Ano da Eleição</label>
          <Select value={filters.ano} onValueChange={(v) => handleChange("ano", v)}>
            <SelectTrigger className="h-11 border-slate-200">
              <SelectValue placeholder="Selecione o ano" />
            </SelectTrigger>
            <SelectContent>
              {ANOS.map((ano) => (
                <SelectItem key={ano} value={ano}>{ano}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Estado (UF)</label>
          <Select value={filters.uf} onValueChange={(v) => handleChange("uf", v)}>
            <SelectTrigger className="h-11 border-slate-200">
              <SelectValue placeholder="Selecione a UF" />
            </SelectTrigger>
            <SelectContent>
              {ESTADOS.map((e) => (
                <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Cargo</label>
          <Select value={filters.cargo} onValueChange={(v) => handleChange("cargo", v)}>
            <SelectTrigger className="h-11 border-slate-200">
              <SelectValue placeholder="Selecione o cargo" />
            </SelectTrigger>
            <SelectContent>
              {CARGOS.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Candidato ou Número</label>
          <Input
            className="h-11 border-slate-200"
            placeholder="Nome, número ou partido..."
            value={filters.candidato}
            onChange={(e) => handleChange("candidato", e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearch()}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide opacity-0 select-none">Ação</label>
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

      {/* Advanced filters toggle */}
      <div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-xs text-slate-500 hover:text-blue-600 transition-colors"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filtros avançados (Município, Zona, Seção)
          {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showAdvanced && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3 pt-3 border-t border-slate-100">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Município</label>
              <Input
                className="h-10 border-slate-200 text-sm"
                placeholder="Ex: SÃO PAULO"
                value={filters.municipio || ""}
                onChange={(e) => handleChange("municipio", e.target.value.toUpperCase())}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Zona Eleitoral</label>
              <Input
                className="h-10 border-slate-200 text-sm"
                placeholder="Ex: 001"
                value={filters.zona || ""}
                onChange={(e) => handleChange("zona", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Seção Eleitoral</label>
              <Input
                className="h-10 border-slate-200 text-sm"
                placeholder="Ex: 0001"
                value={filters.secao || ""}
                onChange={(e) => handleChange("secao", e.target.value)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}