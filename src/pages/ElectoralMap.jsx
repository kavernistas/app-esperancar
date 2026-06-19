import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from "react-leaflet";
import {
  MapPin, Users, UserCheck, ClipboardList, Target, Filter, Search, X, Layers,
  Thermometer, ChevronDown, ChevronUp, Phone, Star, MessageCircle, Vote,
  ArrowUpDown
} from "lucide-react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix default marker
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Custom icons
const contactIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

const leaderIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

const demandIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

const demandTypeLabels = {
  health: "Saúde", education: "Educação", zeladoria: "Zeladoria", iluminacao: "Iluminação",
  infrastructure: "Infraestrutura", transport: "Transporte", social: "Assistência Social",
  security: "Segurança", housing: "Moradia", employment: "Emprego", documentacao: "Documentação", other: "Outros",
};

const heatColors = { cold: "#3b82f6", warm: "#f59e0b", hot: "#ef4444" };
const heatLabels = { cold: "Frio", warm: "Morno", hot: "Quente" };

const intentColors = {
  apoiador: "bg-emerald-100 text-emerald-700",
  indeciso: "bg-amber-100 text-amber-700",
  contrario: "bg-red-100 text-red-700",
  lideranca_potencial: "bg-purple-100 text-purple-700",
};
const intentLabels = {
  apoiador: "Apoiador", indeciso: "Indeciso", contrario: "Contrário", lideranca_potencial: "Líder em Potencial",
};

export default function ElectoralMap() {
  // --- Filters ---
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [searchBairro, setSearchBairro] = useState("");
  const [filterBairro, setFilterBairro] = useState("");
  const [filterZona, setFilterZona] = useState("");
  const [filterSecao, setFilterSecao] = useState("");
  const [filterLeaderId, setFilterLeaderId] = useState("");

  // Layer toggles
  const [showElectoral, setShowElectoral] = useState(true);
  const [showContacts, setShowContacts] = useState(true);
  const [showLeaders, setShowLeaders] = useState(true);
  const [showDemands, setShowDemands] = useState(true);

  // Side panel tab
  const [sideTab, setSideTab] = useState("ranking");
  const [selectedItem, setSelectedItem] = useState(null);

  // --- Data ---
  const { data: electoralData = [], isLoading: loadingElectoral } = useQuery({
    queryKey: ["electoralData"],
    queryFn: () => base44.entities.ElectoralData.list("-votes", 500),
  });

  const { data: contacts = [], isLoading: loadingContacts } = useQuery({
    queryKey: ["contacts"],
    queryFn: () => base44.entities.Contact.list("-created_date", 1000),
  });

  const { data: leadersRaw = [], isLoading: loadingLeaders } = useQuery({
    queryKey: ["leaders"],
    queryFn: () => base44.entities.Leader.list("-supporters_count", 200),
  });

  const { data: demands = [], isLoading: loadingDemands } = useQuery({
    queryKey: ["demands"],
    queryFn: () => base44.entities.Demand.list("-created_date", 1000),
  });

  const isLoading = loadingElectoral || loadingContacts || loadingLeaders || loadingDemands;

  // --- Apply CRM filters ---
  const filteredContacts = useMemo(() => {
    let result = contacts.filter(c => c.latitude && c.longitude);
    if (filterBairro) result = result.filter(c => c.neighborhood === filterBairro);
    if (filterZona) result = result.filter(c => c.electoral_zone === filterZona);
    if (filterSecao) result = result.filter(c => c.electoral_section === filterSecao);
    if (filterLeaderId) result = result.filter(c => c.created_by_leader_id === filterLeaderId);
    return result;
  }, [contacts, filterBairro, filterZona, filterSecao, filterLeaderId]);

  const filteredLeaders = useMemo(() => {
    let result = leadersRaw.filter(l => l.latitude && l.longitude);
    if (filterBairro) result = result.filter(l => l.neighborhood === filterBairro);
    if (filterZona) result = result.filter(l => l.electoral_zone === filterZona);
    return result;
  }, [leadersRaw, filterBairro, filterZona]);

  const filteredDemands = useMemo(() => {
    let result = demands.filter(d => d.latitude && d.longitude);
    if (filterBairro) result = result.filter(d => d.neighborhood === filterBairro);
    if (filterLeaderId) result = result.filter(d => d.created_by_leader_id === filterLeaderId);
    return result;
  }, [demands, filterBairro, filterLeaderId]);

  // --- Electoral data: neighborhood aggregation ---
  const neighborhoodStats = useMemo(() => {
    return electoralData.reduce((acc, item) => {
      const key = item.neighborhood || "Sem Bairro";
      if (!acc[key]) {
        acc[key] = {
          neighborhood: key, city: item.city, totalVotes: 0, totalVoters: 0,
          heatLevel: item.heat_level, lat: item.latitude, lng: item.longitude,
          zone: item.electoral_zone, section: item.electoral_section,
        };
      }
      acc[key].totalVotes += item.votes || 0;
      acc[key].totalVoters += item.total_voters || 0;
      return acc;
    }, {});
  }, [electoralData]);

  // --- Extract filter options from data ---
  const bairros = useMemo(() => [...new Set([
    ...contacts.map(c => c.neighborhood),
    ...leadersRaw.map(l => l.neighborhood),
    ...demands.map(d => d.neighborhood),
    ...Object.keys(neighborhoodStats),
  ].filter(Boolean))].sort(), [contacts, leadersRaw, demands, neighborhoodStats]);

  const zonas = useMemo(() => [...new Set([
    ...contacts.map(c => c.electoral_zone),
    ...leadersRaw.map(l => l.electoral_zone),
  ].filter(Boolean))].sort(), [contacts, leadersRaw]);

  const secoes = useMemo(() => [...new Set(
    contacts.map(c => c.electoral_section).filter(Boolean)
  )].sort(), [contacts]);

  const leadersForFilter = useMemo(() => [
    ...leadersRaw.map(l => ({ id: l.id, name: l.name })),
    ...contacts.filter(c => c.is_leader).map(c => ({ id: c.id, name: c.full_name })),
  ], [leadersRaw, contacts]);

  // Contacts/leaders count by neighborhood for side panel
  const crmByNeighborhood = useMemo(() => {
    const map = {};
    contacts.forEach(c => {
      if (!c.neighborhood) return;
      if (!map[c.neighborhood]) map[c.neighborhood] = { contacts: 0, leaders: 0, demands: 0 };
      map[c.neighborhood].contacts++;
    });
    leadersRaw.forEach(l => {
      if (!l.neighborhood) return;
      if (!map[l.neighborhood]) map[l.neighborhood] = { contacts: 0, leaders: 0, demands: 0 };
      map[l.neighborhood].leaders++;
    });
    demands.forEach(d => {
      if (!d.neighborhood) return;
      if (!map[d.neighborhood]) map[d.neighborhood] = { contacts: 0, leaders: 0, demands: 0 };
      map[d.neighborhood].demands++;
    });
    return map;
  }, [contacts, leadersRaw, demands]);

  // Stats
  const totalVotes = electoralData.reduce((s, d) => s + (d.votes || 0), 0);
  const totalVoters = electoralData.reduce((s, d) => s + (d.total_voters || 0), 0);
  const uniqueNeighborhoods = Object.keys(neighborhoodStats).length;

  // Get all neighborhood entries merged for ranking
  const neighborhoodEntries = useMemo(() => {
    const entries = {};
    Object.entries(neighborhoodStats).forEach(([key, val]) => {
      entries[key] = { ...val, contacts: crmByNeighborhood[key]?.contacts || 0, leadersCount: crmByNeighborhood[key]?.leaders || 0, demandsCount: crmByNeighborhood[key]?.demands || 0 };
    });
    Object.entries(crmByNeighborhood).forEach(([key, val]) => {
      if (!entries[key]) entries[key] = { neighborhood: key, city: "", totalVotes: 0, totalVoters: 0, heatLevel: "cold", lat: null, lng: null, contacts: val.contacts, leadersCount: val.leaders, demandsCount: val.demands };
    });
    return Object.values(entries);
  }, [neighborhoodStats, crmByNeighborhood]);

  const sortedNeighborhoods = useMemo(() => {
    return neighborhoodEntries.sort((a, b) => b.totalVotes - a.totalVotes || (b.contacts + b.leadersCount) - (a.contacts + a.leadersCount));
  }, [neighborhoodEntries]);

  const defaultCenter = [-15.7801, -47.9292];
  const defaultZoom = 4;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[550px] w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ===== HEADER ===== */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Mapa Territorial</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Camadas eleitorais e CRM integradas — filtre por bairro, zona, seção e liderança
        </p>
      </div>

      {/* ===== STATS BAR ===== */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { icon: Vote, label: "Votos Totais", value: totalVotes.toLocaleString(), color: "text-blue-600", bg: "bg-blue-50" },
          { icon: Users, label: "Eleitores", value: totalVoters.toLocaleString(), color: "text-emerald-600", bg: "bg-emerald-50" },
          { icon: MapPin, label: "Bairros Mapeados", value: uniqueNeighborhoods, color: "text-purple-600", bg: "bg-purple-50" },
          { icon: UserCheck, label: "Contatos Geo", value: contacts.filter(c => c.latitude && c.longitude).length, color: "text-blue-600", bg: "bg-blue-50" },
          { icon: ClipboardList, label: "Demandas Geo", value: demands.filter(d => d.latitude && d.longitude).length, color: "text-orange-600", bg: "bg-orange-50" },
        ].map((s, i) => (
          <Card key={i} className={`border-slate-200 ${s.bg} border-none`}>
            <CardContent className="p-3">
              <s.icon className={`w-4 h-4 ${s.color} mb-1`} />
              <p className="text-xl font-bold text-slate-800">{s.value}</p>
              <p className="text-[10px] text-slate-500">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ===== FILTER PANEL ===== */}
      <Card className="border-slate-200">
        <CardContent className="p-3">
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="flex items-center justify-between w-full text-sm font-medium text-slate-700"
          >
            <span className="flex items-center gap-2"><Filter className="w-4 h-4 text-indigo-600" />Filtros Territoriais</span>
            {filtersOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {filtersOpen && (
            <div className="mt-3 space-y-3">
              {/* Search + Filters row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div>
                  <Label className="text-[10px] text-slate-500 mb-0.5 block">Bairro</Label>
                  <Select value={filterBairro} onValueChange={setFilterBairro}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
                    <SelectContent className="max-h-48">
                      <SelectItem value={null}>Todos os bairros</SelectItem>
                      {bairros.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[10px] text-slate-500 mb-0.5 block">Zona Eleitoral</Label>
                  <Select value={filterZona} onValueChange={setFilterZona}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Todas" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>Todas as zonas</SelectItem>
                      {zonas.map(z => <SelectItem key={z} value={z}>Zona {z}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[10px] text-slate-500 mb-0.5 block">Seção Eleitoral</Label>
                  <Select value={filterSecao} onValueChange={setFilterSecao}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Todas" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>Todas as seções</SelectItem>
                      {secoes.map(s => <SelectItem key={s} value={s}>Seção {s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[10px] text-slate-500 mb-0.5 block">Liderança</Label>
                  <Select value={filterLeaderId} onValueChange={setFilterLeaderId}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Todas" /></SelectTrigger>
                    <SelectContent className="max-h-48">
                      <SelectItem value={null}>Todas as lideranças</SelectItem>
                      {leadersForFilter.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Layer toggles */}
              <div>
                <Label className="text-[10px] text-slate-500 mb-1.5 block">Camadas</Label>
                <div className="flex flex-wrap gap-3">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <Switch checked={showElectoral} onCheckedChange={setShowElectoral} className="scale-75" />
                    <span className="text-xs text-slate-600">Votos (círculos)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <Switch checked={showContacts} onCheckedChange={setShowContacts} className="scale-75" />
                    <span className="text-xs text-slate-600">Contatos <span className="text-blue-500">●</span></span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <Switch checked={showLeaders} onCheckedChange={setShowLeaders} className="scale-75" />
                    <span className="text-xs text-slate-600">Lideranças <span className="text-green-500">●</span></span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <Switch checked={showDemands} onCheckedChange={setShowDemands} className="scale-75" />
                    <span className="text-xs text-slate-600">Demandas <span className="text-orange-500">●</span></span>
                  </label>
                </div>
              </div>

              {/* Active filter chips */}
              {(filterBairro || filterZona || filterSecao || filterLeaderId) && (
                <div className="flex flex-wrap gap-1.5">
                  {filterBairro && (
                    <Badge variant="outline" className="text-[10px] gap-1 cursor-pointer" onClick={() => setFilterBairro("")}>
                      Bairro: {filterBairro} <X className="w-3 h-3" />
                    </Badge>
                  )}
                  {filterZona && (
                    <Badge variant="outline" className="text-[10px] gap-1 cursor-pointer" onClick={() => setFilterZona("")}>
                      Zona: {filterZona} <X className="w-3 h-3" />
                    </Badge>
                  )}
                  {filterSecao && (
                    <Badge variant="outline" className="text-[10px] gap-1 cursor-pointer" onClick={() => setFilterSecao("")}>
                      Seção: {filterSecao} <X className="w-3 h-3" />
                    </Badge>
                  )}
                  {filterLeaderId && (
                    <Badge variant="outline" className="text-[10px] gap-1 cursor-pointer" onClick={() => setFilterLeaderId("")}>
                      Liderança: {leadersForFilter.find(l => l.id === filterLeaderId)?.name || filterLeaderId} <X className="w-3 h-3" />
                    </Badge>
                  )}
                  <span className="text-[10px] text-slate-400 self-center ml-1">
                    {filteredContacts.length + filteredLeaders.length + filteredDemands.length} itens no mapa
                  </span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ===== MAP + SIDE PANEL ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* MAP */}
        <div className="lg:col-span-2">
          <Card className="border-slate-200 overflow-hidden">
            <CardContent className="p-0">
              <div className="h-[550px]">
                <MapContainer center={defaultCenter} zoom={defaultZoom} style={{ height: "100%", width: "100%" }}>
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                  />

                  {/* Electoral circles */}
                  {showElectoral && Object.values(neighborhoodStats).map((stat, idx) => {
                    if (!stat.lat || !stat.lng) return null;
                    return (
                      <CircleMarker
                        key={`elec-${idx}`}
                        center={[stat.lat, stat.lng]}
                        radius={Math.max(8, Math.min(28, stat.totalVotes / 100))}
                        fillColor={heatColors[stat.heatLevel || "warm"]}
                        color={heatColors[stat.heatLevel || "warm"]}
                        weight={2} opacity={0.7} fillOpacity={0.4}
                        eventHandlers={{ click: () => setSelectedItem({ type: "electoral", data: stat }) }}
                      >
                        <Popup>
                          <div className="text-xs">
                            <p className="font-semibold">{stat.neighborhood}</p>
                            <p className="text-slate-500">{stat.city}</p>
                            <p className="mt-1"><strong>{stat.totalVotes.toLocaleString()}</strong> votos</p>
                            {stat.zone && <p>Zona: {stat.zone}</p>}
                          </div>
                        </Popup>
                      </CircleMarker>
                    );
                  })}

                  {/* Contact markers */}
                  {showContacts && filteredContacts.map(c => (
                    <Marker key={`ct-${c.id}`} position={[c.latitude, c.longitude]} icon={contactIcon}
                      eventHandlers={{ click: () => setSelectedItem({ type: "contact", data: c }) }}
                    >
                      <Popup>
                        <div className="text-xs min-w-[140px]">
                          <p className="font-semibold">{c.full_name}</p>
                          {c.phone && <p className="flex items-center gap-1"><Phone className="w-3 h-3" />{c.phone}</p>}
                          {c.neighborhood && <p className="text-slate-400">Bairro: {c.neighborhood}</p>}
                          {c.electoral_zone && <p className="text-slate-400">Zona: {c.electoral_zone} | Seção: {c.electoral_section || "-"}</p>}
                          {c.support_intent && <Badge className={`text-[9px] mt-1 ${intentColors[c.support_intent] || ""}`}>{intentLabels[c.support_intent] || c.support_intent}</Badge>}
                          {c.created_by_leader_name && <p className="text-slate-400 mt-0.5">Cadastrado por: {c.created_by_leader_name}</p>}
                        </div>
                      </Popup>
                    </Marker>
                  ))}

                  {/* Leader markers */}
                  {showLeaders && filteredLeaders.map(l => (
                    <Marker key={`ld-${l.id}`} position={[l.latitude, l.longitude]} icon={leaderIcon}
                      eventHandlers={{ click: () => setSelectedItem({ type: "leader", data: l }) }}
                    >
                      <Popup>
                        <div className="text-xs min-w-[140px]">
                          <p className="font-semibold">{l.name}</p>
                          <div className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-500" />{l.political_strength || "medium"}</div>
                          {l.phone && <p className="flex items-center gap-1"><Phone className="w-3 h-3" />{l.phone}</p>}
                          {l.neighborhood && <p className="text-slate-400">Bairro: {l.neighborhood}</p>}
                          <p className="mt-1"><strong>{l.supporters_count || 0}</strong> apoiadores</p>
                        </div>
                      </Popup>
                    </Marker>
                  ))}

                  {/* Demand markers */}
                  {showDemands && filteredDemands.map(d => (
                    <Marker key={`dm-${d.id}`} position={[d.latitude, d.longitude]} icon={demandIcon}
                      eventHandlers={{ click: () => setSelectedItem({ type: "demand", data: d }) }}
                    >
                      <Popup>
                        <div className="text-xs min-w-[140px]">
                          <p className="font-semibold">{d.title}</p>
                          <p>{demandTypeLabels[d.type] || d.type}</p>
                          {d.requester_name && <p className="text-slate-400">Solicitante: {d.requester_name}</p>}
                          {d.neighborhood && <p className="text-slate-400">Bairro: {d.neighborhood}</p>}
                          {d.created_by_leader_name && <p className="text-slate-400">Cadastrado por: {d.created_by_leader_name}</p>}
                          <Badge className={`text-[9px] mt-1 ${d.status === "open" ? "bg-amber-100 text-amber-700" : d.status === "resolved" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{d.status}</Badge>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            </CardContent>
          </Card>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-3 bg-white px-4 py-2 rounded-lg border flex-wrap">
            <div className="flex items-center gap-1.5">
              <Thermometer className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[10px] text-slate-500">Temperatura:</span>
            </div>
            {Object.entries(heatColors).map(([level, color]) => (
              <div key={level} className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-[10px] text-slate-600">{heatLabels[level]}</span>
              </div>
            ))}
            <span className="text-slate-300 text-xs">|</span>
            <div className="flex items-center gap-1"><img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png" alt="" className="w-3.5 h-5 object-contain" /><span className="text-[10px] text-slate-600">Contatos</span></div>
            <div className="flex items-center gap-1"><img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png" alt="" className="w-3.5 h-5 object-contain" /><span className="text-[10px] text-slate-600">Lideranças</span></div>
            <div className="flex items-center gap-1"><img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png" alt="" className="w-3.5 h-5 object-contain" /><span className="text-[10px] text-slate-600">Demandas</span></div>
          </div>
        </div>

        {/* SIDE PANEL */}
        <div className="space-y-3">
          {/* Tabs */}
          <Tabs value={sideTab} onValueChange={setSideTab}>
            <TabsList className="w-full h-9 bg-slate-100">
              <TabsTrigger value="ranking" className="text-[11px] h-7 flex-1">Bairros</TabsTrigger>
              <TabsTrigger value="contatos" className="text-[11px] h-7 flex-1">Contatos</TabsTrigger>
              <TabsTrigger value="liderancas" className="text-[11px] h-7 flex-1">Lideranças</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* RANKING */}
          {sideTab === "ranking" && (
            <Card className="border-slate-200">
              <CardContent className="p-0 max-h-[420px] overflow-y-auto">
                {sortedNeighborhoods.slice(0, 15).map((stat, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedItem({ type: "neighborhood", data: stat })}
                    className={`w-full flex items-center justify-between p-3 border-b border-slate-50 transition-colors text-left ${
                      selectedItem?.data?.neighborhood === stat.neighborhood ? "bg-indigo-50" : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                        idx === 0 ? "bg-amber-500 text-white" : idx === 1 ? "bg-slate-400 text-white" : idx === 2 ? "bg-amber-700 text-white" : "bg-slate-100 text-slate-600"
                      }`}>{idx + 1}</span>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-700 truncate">{stat.neighborhood}</p>
                        <p className="text-[10px] text-slate-400 truncate">{stat.city || ""}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className="text-xs font-semibold text-slate-700">{stat.totalVotes.toLocaleString()}</p>
                      <p className="text-[9px] text-slate-400">{stat.contacts || 0} cont. • {stat.leadersCount || 0} lid.</p>
                    </div>
                  </button>
                ))}
                {sortedNeighborhoods.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-8">Nenhum bairro mapeado</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* CONTACTS LIST */}
          {sideTab === "contatos" && (
            <Card className="border-slate-200">
              <CardContent className="p-0 max-h-[420px] overflow-y-auto">
                {filteredContacts.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-8">Nenhum contato nos filtros atuais</p>
                ) : (
                  filteredContacts.slice(0, 20).map(c => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedItem({ type: "contact", data: c })}
                      className={`w-full text-left p-3 border-b border-slate-50 hover:bg-slate-50 transition-colors ${
                        selectedItem?.data?.id === c.id ? "bg-blue-50" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="w-7 h-7"><AvatarFallback className="text-[10px] bg-blue-100 text-blue-700">{c.full_name?.charAt(0)}</AvatarFallback></Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-slate-700 truncate">{c.full_name}</p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400">
                            {c.neighborhood && <span>{c.neighborhood}</span>}
                            {c.support_intent && <Badge className={`text-[9px] ${intentColors[c.support_intent] || ""}`}>{intentLabels[c.support_intent] || c.support_intent}</Badge>}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </CardContent>
            </Card>
          )}

          {/* LEADERS LIST */}
          {sideTab === "liderancas" && (
            <Card className="border-slate-200">
              <CardContent className="p-0 max-h-[420px] overflow-y-auto">
                {filteredLeaders.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-8">Nenhuma liderança nos filtros atuais</p>
                ) : (
                  filteredLeaders.slice(0, 20).map(l => (
                    <button
                      key={l.id}
                      onClick={() => setSelectedItem({ type: "leader", data: l })}
                      className={`w-full text-left p-3 border-b border-slate-50 hover:bg-slate-50 transition-colors ${
                        selectedItem?.data?.id === l.id ? "bg-green-50" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="w-7 h-7"><AvatarFallback className="text-[10px] bg-green-100 text-green-700">{l.name?.charAt(0)}</AvatarFallback></Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-slate-700 truncate">{l.name}</p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400">
                            {l.neighborhood && <span>{l.neighborhood}</span>}
                            <span>{l.supporters_count || 0} apoiadores</span>
                          </div>
                        </div>
                        <Badge className={`text-[9px] ${l.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{l.status}</Badge>
                      </div>
                    </button>
                  ))
                )}
              </CardContent>
            </Card>
          )}

          {/* SELECTED ITEM DETAIL */}
          {selectedItem && (
            <Card className="border-slate-200">
              <CardHeader className="pb-1 pt-3 px-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-indigo-500" />
                    {selectedItem.type === "electoral" || selectedItem.type === "neighborhood"
                      ? selectedItem.data.neighborhood
                      : selectedItem.type === "contact"
                      ? selectedItem.data.full_name
                      : selectedItem.type === "leader"
                      ? selectedItem.data.name
                      : selectedItem.data.title}
                  </CardTitle>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelectedItem(null)}>
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <div className="space-y-1.5 text-xs">
                  {(selectedItem.type === "electoral" || selectedItem.type === "neighborhood") && (
                    <>
                      {selectedItem.data.city && <div className="flex justify-between"><span className="text-slate-400">Cidade</span><span>{selectedItem.data.city}</span></div>}
                      <div className="flex justify-between"><span className="text-slate-400">Votos</span><span className="font-semibold">{selectedItem.data.totalVotes?.toLocaleString()}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Eleitores</span><span>{selectedItem.data.totalVoters?.toLocaleString()}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Contatos</span><span>{selectedItem.data.contacts || 0}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Lideranças</span><span>{selectedItem.data.leadersCount || 0}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Demandas</span><span>{selectedItem.data.demandsCount || 0}</span></div>
                    </>
                  )}
                  {selectedItem.type === "contact" && (
                    <>
                      {selectedItem.data.phone && <div className="flex justify-between"><span className="text-slate-400">Telefone</span><span>{selectedItem.data.phone}</span></div>}
                      {selectedItem.data.neighborhood && <div className="flex justify-between"><span className="text-slate-400">Bairro</span><span>{selectedItem.data.neighborhood}</span></div>}
                      {selectedItem.data.electoral_zone && <div className="flex justify-between"><span className="text-slate-400">Zona</span><span>{selectedItem.data.electoral_zone}</span></div>}
                      {selectedItem.data.electoral_section && <div className="flex justify-between"><span className="text-slate-400">Seção</span><span>{selectedItem.data.electoral_section}</span></div>}
                      {selectedItem.data.created_by_leader_name && <div className="flex justify-between"><span className="text-slate-400">Liderança</span><span>{selectedItem.data.created_by_leader_name}</span></div>}
                    </>
                  )}
                  {selectedItem.type === "leader" && (
                    <>
                      {selectedItem.data.phone && <div className="flex justify-between"><span className="text-slate-400">Telefone</span><span>{selectedItem.data.phone}</span></div>}
                      <div className="flex justify-between"><span className="text-slate-400">Apoiadores</span><span className="font-semibold">{selectedItem.data.supporters_count || 0}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Força Política</span><Badge className="text-[9px]">{selectedItem.data.political_strength || "medium"}</Badge></div>
                      <div className="flex justify-between"><span className="text-slate-400">Status</span><span>{selectedItem.data.status}</span></div>
                    </>
                  )}
                  {selectedItem.type === "demand" && (
                    <>
                      <div className="flex justify-between"><span className="text-slate-400">Tipo</span><span>{demandTypeLabels[selectedItem.data.type] || selectedItem.data.type}</span></div>
                      {selectedItem.data.requester_name && <div className="flex justify-between"><span className="text-slate-400">Solicitante</span><span>{selectedItem.data.requester_name}</span></div>}
                      <div className="flex justify-between"><span className="text-slate-400">Status</span><Badge className={`text-[9px] ${selectedItem.data.status === "open" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>{selectedItem.data.status}</Badge></div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}