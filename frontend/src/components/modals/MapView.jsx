import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { X, Fuel, BatteryCharging, Gauge, Camera, Cone, Plus, ChevronLeft, LocateFixed, ParkingCircle, Flame, Search } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

const CENTER = [-34.9214, -57.9544];
const PARKING_RADIUS = 700;
const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

const LAYERS = [
  { key: "combustible", label: "Combustible", color: "#0088FF", Icon: Fuel },
  { key: "gnc", label: "GNC", color: "#10B981", Icon: Flame },
  { key: "carga", label: "Carga EV", color: "#A3E635", Icon: BatteryCharging },
  { key: "radar", label: "Radares", color: "#FF2A3B", Icon: Gauge },
  { key: "camara", label: "Cámaras", color: "#A78BFA", Icon: Camera },
  { key: "desvios", label: "Desvíos", color: "#FF8C00", Icon: Cone },
  { key: "parking", label: "Estacionamientos", color: "#38BDF8", Icon: ParkingCircle },
];

const NONE = Object.fromEntries(LAYERS.map((l) => [l.key, false]));
// Capas encendidas segun el boton del tablero que abre el mapa.
const INITIALS = {
  gps: { desvios: true },
  combustible: { combustible: true },
  radares: { radar: true, camara: true },
  parking: { parking: true },
  radar: { radar: true },
  camara: { camara: true },
  desvios: { desvios: true },
  carga: { carga: true },
  gnc: { gnc: true },
};
const AUTO_LOCATE = new Set(["gps", "parking"]);

const PARKING_COLORS = { paid: "#EF4444", free: "#22C55E", unknown: "#9CA3AF" };

function parkingStatus(tags = {}) {
  const fee = tags.fee;
  if (fee && fee !== "no") return "paid";
  if (fee === "no") return "free";
  return "unknown";
}

function overpassQuery(lat, lng) {
  const a = `(around:${PARKING_RADIUS},${lat},${lng})`;
  return `[out:json][timeout:25];
(
  nwr["amenity"="parking"]${a};
  nwr["amenity"="parking_space"]${a};
);
out center tags;
(
  way["highway"]["parking:lane:both"~"no_parking|no_stopping"]${a};
  way["highway"]["parking:lane:left"~"no_parking|no_stopping"]${a};
  way["highway"]["parking:lane:right"~"no_parking|no_stopping"]${a};
  way["highway"]["parking:condition:both"~"no_parking|no_stopping"]${a};
  way["highway"]["parking:both"="no"]${a};
);
out geom tags;`;
}

function pinIcon(color) {
  return L.divIcon({
    className: "",
    html: `<div class="aulp-pin" style="background:${color}"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 20],
    popupAnchor: [0, -18],
  });
}

export function MapView({ onClose, focus, initial }) {
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const groupsRef = useRef({});
  const userMarkerRef = useRef(null);
  const initialParkingDone = useRef(initial === "parking");
  const [active, setActive] = useState(() => ({ ...NONE, ...(INITIALS[initial] || {}) }));
  const [data, setData] = useState({ fuel: [], radars: [], cameras: [], desvios: [] });
  const [reporting, setReporting] = useState(false);
  const [parkingLoading, setParkingLoading] = useState(false);

  const locate = () =>
    new Promise((resolve) => {
      if (!navigator.geolocation) { toast.error("Tu dispositivo no permite ubicación"); resolve(null); return; }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const ll = [pos.coords.latitude, pos.coords.longitude];
          const map = mapRef.current;
          if (!map) { resolve(null); return; }
          if (userMarkerRef.current) userMarkerRef.current.remove();
          userMarkerRef.current = L.circleMarker(ll, { radius: 8, color: "#FFFFFF", weight: 3, fillColor: "#2563EB", fillOpacity: 1 })
            .bindPopup("Estás acá").addTo(map);
          map.setView(ll, 16);
          resolve(ll);
        },
        () => { toast.error("No se pudo obtener tu ubicación"); resolve(null); },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });

  const searchParking = async (center) => {
    const grp = groupsRef.current.parking;
    if (!grp || !center) return;
    setParkingLoading(true);
    try {
      const res = await fetch(OVERPASS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `data=${encodeURIComponent(overpassQuery(center[0], center[1]))}`,
      });
      if (!res.ok) throw new Error("overpass");
      const json = await res.json();
      grp.clearLayers();
      let lots = 0;
      let streets = 0;
      (json.elements || []).forEach((el) => {
        const tags = el.tags || {};
        if (el.type === "way" && el.geometry && tags.highway) {
          L.polyline(el.geometry.map((p) => [p.lat, p.lon]), { color: "#DC2626", weight: 4, dashArray: "8 8" })
            .bindPopup(`<b>${tags.name || "Calle"}</b><br>Prohibido estacionar (OSM)`).addTo(grp);
          streets += 1;
          return;
        }
        const pos = el.center || (el.lat != null ? { lat: el.lat, lon: el.lon } : null);
        if (!pos) return;
        const status = parkingStatus(tags);
        const label = { paid: "Pago", free: "Libre", unknown: "Sin datos" }[status];
        L.circleMarker([pos.lat, pos.lon], { radius: 9, color: "#0B0C10", weight: 2, fillColor: PARKING_COLORS[status], fillOpacity: 0.9 })
          .bindPopup(`<b>${tags.name || "Estacionamiento"}</b><br>${label}${tags.capacity ? `<br>Capacidad: ${tags.capacity}` : ""}`).addTo(grp);
        lots += 1;
      });
      if (!lots && !streets) toast.info("No hay datos de estacionamiento en OSM para esta zona");
    } catch {
      toast.error("No se pudieron cargar los estacionamientos");
    } finally {
      setParkingLoading(false);
    }
  };

  const searchHere = () => {
    if (mapRef.current) { const c = mapRef.current.getCenter(); searchParking([c.lat, c.lng]); }
  };

  const goToMe = () => { locate(); };

  useEffect(() => {
    Promise.all([api.getFuel(), api.getRadars(), api.getCameras(), api.getDesvios()]).then(([fuel, radars, cameras, desvios]) => {
      setData({ fuel, radars, cameras, desvios });
    }).catch(() => toast.error("No se pudo cargar el mapa"));
  }, []);

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;
    const map = L.map(containerRef.current, { zoomControl: true, attributionControl: false }).setView(focus || CENTER, 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);
    mapRef.current = map;
    LAYERS.forEach((l) => { groupsRef.current[l.key] = L.layerGroup(); });
    setTimeout(() => map.invalidateSize(), 100);
    return () => { map.remove(); mapRef.current = null; userMarkerRef.current = null; };
  }, [focus]);

  // GPS y Estacionamientos arrancan en tu ubicacion; estacionamientos busca alrededor.
  useEffect(() => {
    if (!AUTO_LOCATE.has(initial)) return;
    let cancelled = false;
    locate().then((ll) => {
      if (cancelled) return;
      if (initial === "parking") searchParking(ll || (focus || CENTER));
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // (re)build markers when data changes
  useEffect(() => {
    if (!mapRef.current) return;
    const g = groupsRef.current;
    if (!g.combustible) return;

    ["combustible", "gnc", "carga", "radar", "camara", "desvios"].forEach((k) => g[k].clearLayers());

    data.fuel.forEach((f) => {
      const isCarga = f.kind === "carga";
      const isGnc = f.kind === "gnc";
      const color = isCarga ? "#A3E635" : isGnc ? "#10B981" : "#0088FF";
      const m = L.marker([f.lat, f.lng], { icon: pinIcon(color) }).bindPopup(`<b>${f.name}</b><br>${f.brand} - ${f.kind}`);
      m.addTo(isCarga ? g.carga : isGnc ? g.gnc : g.combustible);
    });
    data.radars.forEach((r) => {
      L.marker([r.lat, r.lng], { icon: pinIcon("#FF2A3B") })
        .bindPopup(`<b>Radar ${r.type}</b><br>${r.description}${r.speed ? `<br>Max ${r.speed} km/h` : ""}${r.community ? "<br><i>Reporte comunitario</i>" : ""}`)
        .addTo(g.radar);
    });
    data.cameras.forEach((c) => {
      L.marker([c.lat, c.lng], { icon: pinIcon("#A78BFA") })
        .bindPopup(`<b>Camara ${c.type}</b><br>${c.address}<br>${c.direction}`)
        .addTo(g.camara);
    });
    data.desvios.forEach((d) => {
      if (d.lat == null || d.lng == null) return;
      L.marker([d.lat, d.lng], { icon: pinIcon("#FF8C00") })
        .bindPopup(`<b>${d.street}</b><br>${d.type.toUpperCase()}<br>${d.description}`)
        .addTo(g.desvios);
    });
  }, [data]);

  // sync active layers onto map
  useEffect(() => {
    if (!mapRef.current) return;
    LAYERS.forEach((l) => {
      const grp = groupsRef.current[l.key];
      if (!grp) return;
      if (active[l.key]) grp.addTo(mapRef.current);
      else mapRef.current.removeLayer(grp);
    });
  }, [active, data]);

  // Capas combinables; Combustible y GNC se excluyen entre si.
  const toggle = (k) =>
    setActive((a) => {
      const next = { ...a, [k]: !a[k] };
      if (next[k] && k === "combustible") next.gnc = false;
      if (next[k] && k === "gnc") next.combustible = false;
      return next;
    });

  useEffect(() => {
    if (active.parking && !initialParkingDone.current && initial !== "parking") {
      initialParkingDone.current = true;
      const c = mapRef.current && mapRef.current.getCenter();
      if (c) searchParking([c.lat, c.lng]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active.parking]);

  const startReport = () => {
    if (!mapRef.current) return;
    setReporting(true);
    toast.info("Toca el mapa donde viste el radar");
    const handler = async (e) => {
      mapRef.current.off("click", handler);
      setReporting(false);
      try {
        const created = await api.addRadar({ lat: e.latlng.lat, lng: e.latlng.lng, type: "movil", description: "Reporte comunitario", community: true });
        setData((d) => ({ ...d, radars: [...d.radars, created] }));
        setActive((a) => ({ ...a, radar: true }));
        toast.success("Radar reportado. Gracias!");
      } catch { toast.error("No se pudo reportar el radar"); }
    };
    mapRef.current.on("click", handler);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0B0C10]" data-testid="mach5-map-view">
      <div className="absolute top-0 left-0 right-0 z-[1000] flex items-center justify-between px-4 py-3 bg-[#0B0C10]/90 backdrop-blur border-b border-[#1F2330]">
        <div className="flex items-center gap-2">
          <button data-testid="map-back" onClick={onClose} className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 bg-[#FFD60A] text-[#0B0C10] font-bold hover:brightness-95 transition">
            <ChevronLeft size={20} /> <span className="text-sm">Volver</span>
          </button>
          <h3 className="font-cond font-900 uppercase text-xl text-white tracking-wide ml-2">Mapa</h3>
        </div>
        <button data-testid="map-close" onClick={onClose} className="text-white/60 hover:text-white"><X size={24} /></button>
      </div>

      {/* chips */}
      <div className="absolute top-14 left-0 right-0 z-[1000] px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar">
        {LAYERS.map(({ key, label, color, Icon }) => (
          <button
            key={key}
            data-testid={`layer-${key}`}
            onClick={() => toggle(key)}
            className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold rounded-full px-3 py-1.5 border transition"
            style={active[key]
              ? { background: color, color: "#0B0C10", borderColor: color }
              : { background: "#12141C", color: "rgba(255,255,255,0.7)", borderColor: "#1F2330" }}
          >
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      <div ref={containerRef} className="absolute inset-0 top-[104px]" data-testid="leaflet-map" />

      <button
        data-testid="my-location-btn"
        onClick={goToMe}
        className="absolute bottom-24 right-6 z-[1000] inline-flex items-center gap-2 bg-[#2563EB] text-white font-bold rounded-full px-4 py-3 shadow-lg"
      >
        <LocateFixed size={18} /> Mi ubicación
      </button>

      {active.parking && (
        <>
          <button
            data-testid="parking-search-btn"
            onClick={searchHere}
            disabled={parkingLoading}
            className="absolute top-[120px] left-1/2 -translate-x-1/2 z-[1000] inline-flex items-center gap-2 bg-[#FFD60A] text-[#0B0C10] font-bold rounded-full px-4 py-2 shadow-lg disabled:opacity-60"
          >
            <Search size={16} /> {parkingLoading ? "Buscando..." : "Buscar en esta zona"}
          </button>
          <div data-testid="parking-legend" className="absolute bottom-6 left-4 z-[1000] rounded-xl bg-[#0B0C10]/90 border border-[#1F2330] px-3 py-2 text-xs text-white/80 space-y-1">
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ background: PARKING_COLORS.paid }} /> Pago</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ background: PARKING_COLORS.free }} /> Libre</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ background: PARKING_COLORS.unknown }} /> Sin datos</div>
            <div className="flex items-center gap-2"><span className="w-4 border-t-2 border-dashed" style={{ borderColor: "#DC2626" }} /> Prohibido estacionar</div>
          </div>
        </>
      )}

      <button
        data-testid="report-radar-btn"
        onClick={startReport}
        disabled={reporting}
        className="absolute bottom-6 right-6 z-[1000] inline-flex items-center gap-2 bg-[#FF2A3B] text-white font-bold rounded-full px-4 py-3 shadow-lg disabled:opacity-60"
      >
        <Plus size={18} /> Reportar radar
      </button>
    </div>
  );
}
