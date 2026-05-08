import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from "react-leaflet";
import { Filter, Users, Vote, MapPin, TrendingUp, Thermometer, FileDown, Loader2, MessageCircle } from "lucide-react";
import "leaflet/dist/leaflet.css";
import WhatsAppModal from "@/components/integrations/WhatsAppModal";

const heatColors = {
  cold: "#3b82f6",
  warm: "#f59e0b",
  hot: "#ef4444",
};

const heatLabels = {
  cold: "Frio",
  warm: "Morno",
  hot: "Quente",
};

export default function ElectoralMap() {
  const [yearFilter, setYearFilter] = useState("all");
  const [positionFilter, setPositionFilter] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [whatsappOpen, setWhatsappOpen] = useState(false);

  const handleExportPDF = async () => {
    setExportingPDF(true);
    const response = await base44.functions.invoke("exportMapPDF", {
      yearFilter,
      positionFilter,
      candidateName: "Candidato",
    });
    setExportingPDF(false);
    if (response.data?.pdf_base64) {
      const link = document.createElement("a");
      link.href = response.data.pdf_base64;
      link.download = response.data.filename || "mapa-eleitoral.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const { data: electoralData = [], isLoading } = useQuery({
    queryKey: ["electoralData"],
    queryFn: () => base44.entities.ElectoralData.list("-votes", 500),
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ["contacts"],
    queryFn: () => base44.entities.Contact.list("-created_date", 1000),
  });

  const filteredData = electoralData.filter((item) => {
    const matchesYear = yearFilter === "all" || item.year?.toString() === yearFilter;
    const matchesPosition = positionFilter === "all" || item.position === positionFilter;
    return matchesYear && matchesPosition;
  });

  // Group data by neighborhood
  const neighborhoodStats = filteredData.reduce((acc, item) => {
    const key = item.neighborhood || "Sem Bairro";
    if (!acc[key]) {
      acc[key] = {
        neighborhood: key,
        city: item.city,
        totalVotes: 0,
        totalVoters: 0,
        locations: [],
        heatLevel: item.heat_level,
        lat: item.latitude,
        lng: item.longitude,
      };
    }
    acc[key].totalVotes += item.votes || 0;
    acc[key].totalVoters += item.total_voters || 0;
    acc[key].locations.push(item);
    return acc;
  }, {});

  // Contact count by neighborhood
  const contactsByNeighborhood = contacts.reduce((acc, c) => {
    if (c.neighborhood) {
      acc[c.neighborhood] = (acc[c.neighborhood] || 0) + 1;
    }
    return acc;
  }, {});

  // Stats
  const totalVotes = filteredData.reduce((sum, d) => sum + (d.votes || 0), 0);
  const totalVoters = filteredData.reduce((sum, d) => sum + (d.total_voters || 0), 0);
  const uniqueNeighborhoods = Object.keys(neighborhoodStats).length;

  // Get unique years and positions for filters
  const years = [...new Set(electoralData.map(d => d.year).filter(Boolean))].sort((a, b) => b - a);
  const positions = [...new Set(electoralData.map(d => d.position).filter(Boolean))];

  const positionLabels = {
    mayor: "Prefeito",
    councilor: "Vereador",
    governor: "Governador",
    state_deputy: "Deputado Estadual",
    federal_deputy: "Deputado Federal",
    senator: "Senador",
    president: "Presidente",
  };

  // Default center (Brazil)
  const defaultCenter = [-15.7801, -47.9292];
  const defaultZoom = 4;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[500px] w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mapa Eleitoral</h1>
          <p className="text-slate-500 mt-1">
            Visualize a distribuição de votos por região
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setWhatsappOpen(true)}
            className="border-green-200 text-green-700 hover:bg-green-50"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            WhatsApp
          </Button>
          <Button
            onClick={handleExportPDF}
            disabled={exportingPDF}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {exportingPDF
              ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              : <FileDown className="w-4 h-4 mr-2" />}
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Vote className="w-4 h-4" />
            <span className="text-sm">Total de Votos</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">{totalVotes.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Users className="w-4 h-4" />
            <span className="text-sm">Eleitores</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{totalVoters.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <MapPin className="w-4 h-4" />
            <span className="text-sm">Bairros</span>
          </div>
          <p className="text-2xl font-bold text-purple-600">{uniqueNeighborhoods}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm">% Conversão</span>
          </div>
          <p className="text-2xl font-bold text-orange-600">
            {totalVoters > 0 ? ((totalVotes / totalVoters) * 100).toFixed(1) : 0}%
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-lg border">
        <div className="flex items-center gap-2 text-slate-500">
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium">Filtros:</span>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Select value={yearFilter} onValueChange={setYearFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Anos</SelectItem>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={positionFilter} onValueChange={setPositionFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Cargo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Cargos</SelectItem>
              {positions.map((pos) => (
                <SelectItem key={pos} value={pos}>
                  {positionLabels[pos] || pos}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Map and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <div className="h-[500px]">
                <MapContainer
                  center={defaultCenter}
                  zoom={defaultZoom}
                  style={{ height: "100%", width: "100%" }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  />
                  {Object.values(neighborhoodStats).map((stat, index) => {
                    if (!stat.lat || !stat.lng) return null;
                    return (
                      <CircleMarker
                        key={index}
                        center={[stat.lat, stat.lng]}
                        radius={Math.max(10, Math.min(30, stat.totalVotes / 100))}
                        fillColor={heatColors[stat.heatLevel || "warm"]}
                        color={heatColors[stat.heatLevel || "warm"]}
                        weight={2}
                        opacity={0.8}
                        fillOpacity={0.5}
                        eventHandlers={{
                          click: () => setSelectedLocation(stat),
                        }}
                      >
                        <Popup>
                          <div className="p-2">
                            <h3 className="font-semibold">{stat.neighborhood}</h3>
                            <p className="text-sm text-slate-500">{stat.city}</p>
                            <p className="text-sm mt-1">
                              <strong>{stat.totalVotes.toLocaleString()}</strong> votos
                            </p>
                          </div>
                        </Popup>
                      </CircleMarker>
                    );
                  })}
                </MapContainer>
              </div>
            </CardContent>
          </Card>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-4 bg-white p-3 rounded-lg border">
            <div className="flex items-center gap-2 text-sm">
              <Thermometer className="w-4 h-4 text-slate-500" />
              <span className="text-slate-500">Temperatura:</span>
            </div>
            {Object.entries(heatColors).map(([level, color]) => (
              <div key={level} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="text-sm text-slate-600">{heatLabels[level]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Side Panel */}
        <div className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Ranking por Bairro</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {Object.values(neighborhoodStats)
                  .sort((a, b) => b.totalVotes - a.totalVotes)
                  .slice(0, 10)
                  .map((stat, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedLocation?.neighborhood === stat.neighborhood
                          ? "bg-blue-50 border border-blue-200"
                          : "bg-slate-50 hover:bg-slate-100"
                      }`}
                      onClick={() => setSelectedLocation(stat)}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                          style={{ backgroundColor: heatColors[stat.heatLevel || "warm"] }}
                        >
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{stat.neighborhood}</p>
                          <p className="text-xs text-slate-500">{stat.city}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm">{stat.totalVotes.toLocaleString()}</p>
                        <p className="text-xs text-slate-500">votos</p>
                      </div>
                    </div>
                  ))}
                {Object.keys(neighborhoodStats).length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-4">
                    Nenhum dado eleitoral cadastrado
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Selected Location Details */}
          {selectedLocation && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-500" />
                  {selectedLocation.neighborhood}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">Cidade</span>
                    <span className="font-medium">{selectedLocation.city}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">Total de Votos</span>
                    <span className="font-medium">{selectedLocation.totalVotes.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">Eleitores</span>
                    <span className="font-medium">{selectedLocation.totalVoters.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">Contatos Cadastrados</span>
                    <span className="font-medium">
                      {contactsByNeighborhood[selectedLocation.neighborhood] || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">Temperatura</span>
                    <Badge
                      style={{
                        backgroundColor: heatColors[selectedLocation.heatLevel || "warm"] + "20",
                        color: heatColors[selectedLocation.heatLevel || "warm"],
                      }}
                    >
                      {heatLabels[selectedLocation.heatLevel || "warm"]}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      {/* WhatsApp Modal */}
      <WhatsAppModal open={whatsappOpen} onOpenChange={setWhatsappOpen} selectedContacts={[]} />
    </div>
  );
}