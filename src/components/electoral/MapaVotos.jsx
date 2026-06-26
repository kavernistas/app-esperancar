import { tseApi } from "@/api/client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  Globe, MapPin, Building2, Filter, Layers, Loader2, Database
} from "lucide-react";

const GEO_NIVEL = [
  { value: "municipio", label: "Município", icon: Building2 },
  { value: "zona", label: "Zona Eleitoral", icon: Layers },
  { value: "local_votacao", label: "Local de Votação", icon: MapPin },
  { value: "secao", label: "Seção Eleitoral", icon: Filter },
];

// Coordenadas aproximadas das capitais para centralizar o mapa
const CAPITAIS = {
  AC: [-9.974, -67.824], AL: [-9.666, -35.735], AM: [-3.119, -60.021], AP: [0.034, -51.069],
  BA: [-12.971, -38.501], CE: [-3.717, -38.543], DF: [-15.780, -47.929], ES: [-20.315, -40.312],
  GO: [-16.686, -49.264], MA: [-2.530, -44.302], MG: [-19.916, -43.934], MS: [-20.442, -54.646],
  MT: [-15.598, -56.096], PA: [-1.455, -48.503], PB: [-7.119, -34.845], PE: [-8.047, -34.877],
  PI: [-5.089, -42.801], PR: [-25.428, -49.273], RJ: [-22.906, -43.172], RN: [-5.794, -35.211],
  RO: [-8.761, -63.903], RR: [2.819, -60.673], RS: [-30.034, -51.217], SC: [-27.596, -48.549],
  SE: [-10.947, -37.073], SP: [-23.550, -46.633], TO: [-10.184, -48.333],
};

const HEAT_COLORS = ["#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#d946ef", "#ec4899", "#f43f5e"];

export default function MapaVotos({ filters, syncStatuses }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [nivel, setNivel] = useState("municipio");
  const [candidatoFiltro, setCandidatoFiltro] = useState("");

  const { ano, uf, cargo } = filters;

  useEffect(() => {
    if (ano && uf) loadData();
  }, [ano, uf, cargo]);

  const loadData = async () => {
    setLoading(true);
    setData(null);
    try {
      const res = await tseApi.getData({
        action: "query", ano, uf, cargo: cargo || undefined, limit: 5000,
      });
      if (res.data?.success) setData(res.data);
    } catch (e) { console.error("Erro ao carregar dados do mapa:", e); }
    setLoading(false);
  };

  const center = CAPITAIS[uf?.toUpperCase()] || CAPITAIS["DF"];
  const isSynced = syncStatuses?.some(s => s.ano === parseInt(ano) && s.uf === uf?.toUpperCase() && (s.status || "").toUpperCase() === "IMPORTADO");

  if (!isSynced) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-8 text-center">
          <Database className="w-12 h-12 text-amber-300 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-700 mb-2">Base não sincronizada</h3>
          <p className="text-sm text-slate-500">Dados oficiais ainda não importados para {uf}/{ano}.</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>;
  }

  if (!data || data.data?.length === 0) {
    return (
      <Card className="border-slate-200">
        <CardContent className="p-8 text-center">
          <Globe className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Nenhum dado disponível para os filtros selecionados.</p>
        </CardContent>
      </Card>
    );
  }

  // Agrupar por nível geográfico
  const grouped = {};
  const allCandidatos = new Set();
  data.data.forEach(r => {
    const key = r[nivel] || "—";
    if (!grouped[key]) {
      grouped[key] = {
        nome: key,
        municipio: r.municipio || "",
        zona: r.zona || "",
        secao: r.secao || "",
        local_votacao: r.local_votacao || "",
        totalVotos: 0,
        candidatos: {},
      };
    }
    grouped[key].totalVotos += r.votos || 0;
    const cn = r.nome_candidato || "—";
    allCandidatos.add(cn);
    grouped[key].candidatos[cn] = (grouped[key].candidatos[cn] || 0) + (r.votos || 0);
  });

  // Ordenar
  const sorted = Object.values(grouped).sort((a, b) => b.totalVotos - a.totalVotos);
  const topCandidatos = [...allCandidatos].slice(0, 7);
  const maxVotos = sorted.length > 0 ? sorted[0].totalVotos : 1;

  // Filtrar por candidato
  const filtered = candidatoFiltro
    ? sorted.filter(g => g.candidatos[candidatoFiltro])
    : sorted;

  // Gerar pontos no mapa (distribuição circular ao redor do centro do estado)
  const pontos = filtered.slice(0, 50).map((g, i) => {
    const angle = (i / Math.min(filtered.length, 50)) * Math.PI * 2;
    const radius = 1.5 + (i % 3) * 0.8;
    return {
      ...g,
      lat: center[0] + Math.cos(angle) * radius * 0.3,
      lng: center[1] + Math.sin(angle) * radius * 0.5,
    };
  });

  const nivelAtual = GEO_NIVEL.find(n => n.value === nivel);

  return (
    <div className="space-y-6">
      {/* Seletor de nível */}
      <div className="flex flex-wrap gap-1.5">
        {GEO_NIVEL.map(n => (
          <button
            key={n.value}
            onClick={() => setNivel(n.value)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
              nivel === n.value ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
            }`}
          >
            <n.icon className="w-3.5 h-3.5" />{n.label}
          </button>
        ))}
      </div>

      {/* Candidato filter chips */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-slate-400 mr-1">Candidato:</span>
        <button
          onClick={() => setCandidatoFiltro("")}
          className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
            !candidatoFiltro ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Todos
        </button>
        {topCandidatos.map(cn => (
          <button
            key={cn}
            onClick={() => setCandidatoFiltro(cn === candidatoFiltro ? "" : cn)}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
              cn === candidatoFiltro ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-700 hover:bg-blue-100"
            }`}
          >
            {cn}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mapa */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <div className="h-[500px]">
                <MapContainer center={center} zoom={7} style={{ height: "100%", width: "100%" }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
                  {pontos.map((p, i) => {
                    const candidatoVotos = candidatoFiltro ? (p.candidatos[candidatoFiltro] || 0) : p.totalVotos;
                    const ratio = candidatoVotos / maxVotos;
                    const colorIdx = Math.min(Math.floor(ratio * HEAT_COLORS.length), HEAT_COLORS.length - 1);
                    return (
                      <CircleMarker
                        key={i}
                        center={[p.lat, p.lng]}
                        radius={Math.max(8, Math.min(28, ratio * 25))}
                        fillColor={HEAT_COLORS[colorIdx]}
                        color={HEAT_COLORS[colorIdx]}
                        weight={2}
                        opacity={0.7}
                        fillOpacity={0.4}
                      >
                        <Tooltip direction="top" offset={[0, -8]} opacity={1}>
                          <div className="text-xs">
                            <p className="font-semibold">{p.nome}</p>
                            <p>{p.municipio}</p>
                            <p className="font-bold mt-1">{candidatoVotos.toLocaleString()} votos</p>
                          </div>
                        </Tooltip>
                        <Popup>
                          <div className="p-1 min-w-[180px]">
                            <h3 className="font-semibold text-sm">{p.nome}</h3>
                            <p className="text-xs text-slate-500">{p.municipio}</p>
                            {p.zona && <p className="text-xs text-slate-500">Zona: {p.zona}</p>}
                            {p.local_votacao && <p className="text-xs text-slate-500">Local: {p.local_votacao}</p>}
                            <div className="mt-2 border-t pt-2">
                              <p className="text-xs font-semibold text-slate-500 mb-1">Votos por candidato:</p>
                              {Object.entries(p.candidatos).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([cn, v], j) => (
                                <div key={j} className="flex justify-between text-xs">
                                  <span className="truncate mr-2 max-w-[120px]">{cn}</span>
                                  <span className="font-semibold">{v.toLocaleString()}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </Popup>
                      </CircleMarker>
                    );
                  })}
                </MapContainer>
              </div>
            </CardContent>
          </Card>

          {/* Legenda */}
          <div className="flex items-center justify-center gap-3 mt-3 bg-white p-2 rounded-lg border text-xs">
            <span className="text-slate-500">Intensidade:</span>
            {HEAT_COLORS.map((c, i) => (
              <div key={i} className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c }} />
                <span className="text-slate-400">{i === 0 ? "Baixa" : i === HEAT_COLORS.length - 1 ? "Alta" : ""}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Painel lateral: ranking por nível */}
        <div className="space-y-4">
          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                {nivelAtual && <nivelAtual.icon className="w-4 h-4 text-blue-600" />}
                Ranking por {nivelAtual?.label || "Município"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[440px] overflow-y-auto">
                {filtered.slice(0, 15).map((g, i) => {
                  const votosCand = candidatoFiltro ? (g.candidatos[candidatoFiltro] || 0) : g.totalVotos;
                  const pct = ((votosCand / maxVotos) * 100).toFixed(0);
                  return (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                        i === 0 ? "bg-blue-600 text-white" : i === 1 ? "bg-blue-400 text-white" : i === 2 ? "bg-blue-300 text-blue-800" : "bg-slate-200 text-slate-500"
                      }`}>{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">{g.nome}</p>
                        <p className="text-[11px] text-slate-400">{g.municipio}{g.zona ? ` • Zona ${g.zona}` : ""}</p>
                        <div className="mt-1 w-full bg-slate-200 rounded-full h-1.5">
                          <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-slate-800">{votosCand.toLocaleString()}</p>
                        <p className="text-[10px] text-slate-400">votos</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Resumo */}
          <Card className="border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50/30">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-3 text-center">
                <div>
                  <p className="text-2xl font-bold text-blue-700">{sorted.length}</p>
                  <p className="text-[11px] text-slate-500">{nivelAtual?.label || "Municípios"}</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-700">{data.total?.toLocaleString()}</p>
                  <p className="text-[11px] text-slate-500">Registros</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-700">{allCandidatos.size}</p>
                  <p className="text-[11px] text-slate-500">Candidatos</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-700">
                    {(sorted.reduce((s, g) => s + g.totalVotos, 0)).toLocaleString()}
                  </p>
                  <p className="text-[11px] text-slate-500">Votos totais</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}