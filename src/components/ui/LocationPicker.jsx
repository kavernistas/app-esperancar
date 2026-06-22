import { useState, useEffect, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Loader2, X } from "lucide-react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const redIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Nominatim geocoding
async function geocode(query) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=br`;
  const res = await fetch(url, { headers: { "Accept-Language": "pt-BR" } });
  const data = await res.json();
  if (data.length > 0) {
    return {
      latitude: parseFloat(data[0].lat),
      longitude: parseFloat(data[0].lon),
      display_name: data[0].display_name,
    };
  }
  return null;
}

async function reverseGeocode(lat, lng) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=pt-BR`;
  const res = await fetch(url);
  const data = await res.json();
  return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

// Map click handler
function MapClickHandler({ onClick }) {
  useMapEvents({
    click(e) {
      onClick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

// Auto-center when position changes externally
function AutoCenter({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView([position.lat, position.lng], map.getZoom());
    }
  }, [position?.lat, position?.lng, map]);
  return null;
}

export default function LocationPicker({ 
  value, 
  onChange, 
  height = 220,
  placeholder = "Buscar endereço ou CEP...",
  label,
}) {
  const [position, setPosition] = useState(value?.latitude && value?.longitude ? { lat: value.latitude, lng: value.longitude } : null);
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [address, setAddress] = useState("");
  const [error, setError] = useState(null);
  const searchRef = useRef(null);

  // Default center: Brazil
  const defaultCenter = position || { lat: -15.7801, lng: -47.9292 };

  const handleSearch = useCallback(async () => {
    if (!search.trim()) return;
    setSearching(true);
    setError(null);
    try {
      const result = await geocode(search);
      if (result) {
        const pos = { lat: result.latitude, lng: result.longitude };
        setPosition(pos);
        setAddress(result.display_name);
        onChange?.({ latitude: result.latitude, longitude: result.longitude, address: result.display_name });
      } else {
        setError("Endereço não encontrado. Tente ser mais específico.");
      }
    } catch (e) {
      setError("Erro ao buscar endereço.");
    }
    setSearching(false);
  }, [search, onChange]);

  const handleMapClick = useCallback(async (pos) => {
    setPosition(pos);
    setSearching(true);
    try {
      const addr = await reverseGeocode(pos.lat, pos.lng);
      setAddress(addr);
      onChange?.({ latitude: pos.lat, longitude: pos.lng, address: addr });
    } catch (e) {
      const addr = `${pos.lat.toFixed(6)}, ${pos.lng.toFixed(6)}`;
      setAddress(addr);
      onChange?.({ latitude: pos.lat, longitude: pos.lng, address: addr });
    }
    setSearching(false);
  }, [onChange]);

  const handleClear = () => {
    setPosition(null);
    setAddress("");
    setSearch("");
    setError(null);
    onChange?.({ latitude: null, longitude: null, address: "" });
  };

  // Sync external value changes
  useEffect(() => {
    if (value?.latitude && value?.longitude) {
      setPosition({ lat: value.latitude, lng: value.longitude });
    }
  }, [value?.latitude, value?.longitude]);

  return (
    <div className="space-y-2">
      {label && <p className="text-xs font-medium text-slate-700">{label}</p>}
      
      {/* Search */}
      <div className="flex gap-1.5">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <Input
            ref={searchRef}
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            placeholder={placeholder}
            className="h-8 pl-7 pr-2 text-xs"
          />
        </div>
        <Button size="sm" onClick={handleSearch} disabled={searching || !search.trim()} className="h-8 text-xs px-2.5">
          {searching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Buscar"}
        </Button>
        {position && (
          <Button size="sm" variant="ghost" onClick={handleClear} className="h-8 w-8 p-0 text-slate-400">
            <X className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>

      {error && <p className="text-[10px] text-red-500">{error}</p>}

      {/* Selected address */}
      {address && (
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
          <p className="text-[10px] text-slate-600 line-clamp-1">{address}</p>
        </div>
      )}

      {/* Map */}
      <div className="rounded-lg overflow-hidden border border-slate-200" style={{ height }}>
        <MapContainer
          center={[defaultCenter.lat, defaultCenter.lng]}
          zoom={position ? 16 : 5}
          style={{ height: "100%", width: "100%" }}
          zoomControl={true}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          />
          <MapClickHandler onClick={handleMapClick} />
          {position && <AutoCenter position={position} />}
          {position && (
            <Marker
              position={[position.lat, position.lng]}
              icon={redIcon}
              draggable={true}
              eventHandlers={{
                dragend: (e) => {
                  const { lat, lng } = e.target.getLatLng();
                  handleMapClick({ lat, lng });
                },
              }}
            />
          )}
        </MapContainer>
      </div>
      {!position && (
        <p className="text-[10px] text-slate-400 text-center">
          Busque um endereço ou clique no mapa para marcar a localização
        </p>
      )}
    </div>
  );
}