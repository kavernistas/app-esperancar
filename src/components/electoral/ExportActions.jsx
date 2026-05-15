import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2, Share2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function ExportActions({ data, filters }) {
  const [exportingPDF, setExportingPDF] = useState(false);

  const handleExportPDF = async () => {
    setExportingPDF(true);
    const response = await base44.functions.invoke("exportMapPDF", {
      yearFilter: filters.ano,
      positionFilter: filters.cargo,
      candidateName: filters.candidato || "Todos os candidatos",
      customData: data.slice(0, 50),
      uf: filters.uf,
    });
    setExportingPDF(false);
    if (response.data?.pdf_base64) {
      const link = document.createElement("a");
      link.href = response.data.pdf_base64;
      link.download = response.data.filename || `tse-${filters.uf}-${filters.ano}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleExportCSV = () => {
    const headers = ["Candidato", "Número", "Partido", "Município", "Zona", "Votos"];
    const rows = data.map((c) => [
      c.nm_candidato || "",
      c.nr_candidato || "",
      c.sg_partido || "",
      c.nm_municipio || "",
      c.nr_zona || "",
      c.qt_votos_nominais || 0,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tse-${filters.uf}-${filters.cargo}-${filters.ano}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleExportCSV}
        className="border-slate-200 text-slate-700 hover:bg-slate-50 text-xs"
      >
        <Share2 className="w-3.5 h-3.5 mr-1.5" />
        Exportar CSV
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleExportPDF}
        disabled={exportingPDF}
        className="border-blue-200 text-blue-700 hover:bg-blue-50 text-xs"
      >
        {exportingPDF
          ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
          : <FileDown className="w-3.5 h-3.5 mr-1.5" />}
        Exportar PDF
      </Button>
    </div>
  );
}