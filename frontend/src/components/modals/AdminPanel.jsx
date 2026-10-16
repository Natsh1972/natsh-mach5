import React, { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Trash2, Check, Plus, LogOut } from "lucide-react";
import { api } from "@/lib/api";
import { Modal } from "@/components/modals/Modal";
import { LOGIN, LOGOUT } from "@/constants/testIds";

const TABS = ["Pendientes", "Importar", "Agenda", "Camaras", "Emergencias", "Sitios", "Desvios"];

const inp = "w-full bg-[#0B0C10] border border-[#1F2330] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#FFD60A]/60";

export function AdminPanel({ onClose }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState("Pendientes");
  const [subs, setSubs] = useState([]);
  const [events, setEvents] = useState([]);
  const [cameras, setCameras] = useState([]);
  const [places, setPlaces] = useState([]);
  const [sites, setSites] = useState([]);
  const [desvios, setDesvios] = useState([]);

  const refresh = useCallback(async () => {
    const [s, e, c, p, si, d] = await Promise.all([
      api.getSubmissions().catch(() => []),
      api.getEvents().catch(() => []), api.getCameras().catch(() => []), api.getPlaces().catch(() => []),
      api.getSites().catch(() => []), api.getDesvios().catch(() => []),
    ]);
    setSubs(s); setEvents(e); setCameras(c); setPlaces(p); setSites(si); setDesvios(d);
  }, []);

  // Verifica sesion existente via cookie httpOnly (no hay token en localStorage)
  useEffect(() => {
    api.me()
      .then(() => { setAuthed(true); refresh(); })
      .catch(() => {})
      .finally(() => setChecking(false));
    // eslint-disable-next-line
  }, []);

  const login = async () => {
    try {
      await api.login(email.trim().toLowerCase(), password);
      setAuthed(true);
      setPassword("");
      refresh();
      toast.success("Acceso admin OK");
    } catch (err) {
      const status = err?.response?.status;
      toast.error(status === 429 ? "Demasiados intentos, esperá unos minutos" : "Credenciales invalidas");
    }
  };

  const logout = async () => {
    try { await api.logout(); } catch { /* noop */ }
    setAuthed(false);
    onClose();
  };

  if (checking) {
    return <Modal title="Admin" onClose={onClose} size="sm" testid="admin-panel"><p className="text-white/40 text-sm">Verificando sesión...</p></Modal>;
  }

  if (!authed) {
    return (
      <Modal title="Admin" onClose={onClose} size="sm" testid="admin-panel">
        <input
          data-testid={LOGIN.emailInput} className={inp} type="email" placeholder="Email admin"
          value={email} onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && login()}
        />
        <input
          data-testid={LOGIN.passwordInput} className={`${inp} mt-3`} type="password" placeholder="Contraseña"
          value={password} onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && login()}
        />
        <button data-testid={LOGIN.submitButton} onClick={login} className="mt-3 w-full bg-[#FFD60A] text-[#0B0C10] font-bold rounded-lg py-2.5">Ingresar</button>
      </Modal>
    );
  }

  return (
    <Modal title="Panel Admin" onClose={onClose} size="xl" testid="admin-panel">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {TABS.map((t) => (
            <button key={t} data-testid={`admin-tab-${t.toLowerCase()}`} onClick={() => setTab(t)}
              className={`shrink-0 text-sm font-semibold rounded-full px-3 py-1.5 border ${tab === t ? "bg-[#FFD60A] text-[#0B0C10] border-[#FFD60A]" : "bg-[#0B0C10] text-white/70 border-[#1F2330]"}`}>
              {t}
            </button>
          ))}
        </div>
        <button data-testid={LOGOUT.button} onClick={logout} title="Salir" className="shrink-0 inline-flex items-center gap-1 text-white/60 hover:text-[#FF2A3B] text-sm">
          <LogOut size={16} />
        </button>
      </div>

      {tab === "Pendientes" && <Pendientes subs={subs} refresh={refresh} />}
      {tab === "Importar" && <ImportarOsm />}
      {tab === "Agenda" && <AgendaAdmin events={events} refresh={refresh} />}
      {tab === "Camaras" && <CrudAdmin coll="cameras" items={cameras} refresh={refresh}
        fields={[["address", "Interseccion"], ["direction", "Sentido"], ["type", "Tipo"], ["lat", "Lat"], ["lng", "Lng"]]}
        empty={{ address: "", direction: "", type: "velocidad", lat: -34.92, lng: -57.95 }} label={(i) => `${i.address} - ${i.type}`} />}
      {tab === "Emergencias" && <CrudAdmin coll="places" items={places} refresh={refresh}
        fields={[["name", "Nombre"], ["kind", "Tipo"], ["zone", "Zona"], ["lat", "Lat"], ["lng", "Lng"]]}
        empty={{ name: "", kind: "hospital", zone: "", lat: -34.92, lng: -57.95 }} label={(i) => `${i.name} (${i.kind})`} />}
      {tab === "Sitios" && <CrudAdmin coll="sites" items={sites} refresh={refresh}
        fields={[["name", "Nombre"], ["zone", "Zona"], ["description", "Descripcion"], ["enabled", "Habilitado"]]}
        empty={{ name: "", zone: "", description: "", enabled: true }} label={(i) => `${i.name} - ${i.enabled ? "HABILITADO" : "NO HABILITADO"}`} />}
      {tab === "Desvios" && <CrudAdmin coll="desvios" items={desvios} refresh={refresh}
        fields={[["street", "Calle"], ["type", "Tipo"], ["description", "Descripcion"], ["lat", "Lat"], ["lng", "Lng"]]}
        empty={{ street: "", type: "corte", description: "", lat: -34.92, lng: -57.95 }} label={(i) => `${i.street} - ${i.type}`} />}
    </Modal>
  );
}

const OSM_MAP = {
  car_repair: { category: "mecanica", vehicles: ["auto"] },
  car_parts: { category: "repuestos", vehicles: ["auto"] },
  tyres: { category: "neumaticos", vehicles: ["auto", "moto"] },
  car_wash: { category: "lavadero", vehicles: ["auto", "moto"] },
  motorcycle_repair: { category: "mecanica", vehicles: ["moto"] },
  motorcycle: { category: "repuestos", vehicles: ["moto"] },
};

const plano = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const NO_NEGOCIO = /teatro|escuela|universidad|colegio|ferroviari|zapat|costura|cultural/;

// Afina la categoría según el nombre y las etiquetas, sin inventar nada.
function refinar(p, m) {
  const n = plano(p.name);
  let category = m.category;
  let vehicles = m.vehicles;
  if (/\bgnc\b/.test(n)) category = "gnc";
  else if (/gomer|neumat|llanta|revulc|runflat/.test(n)) category = "neumaticos";
  else if (/lubric/.test(n)) category = "lubricentros";
  else if (/tapicer/.test(n)) category = "tapiceria";
  else if (/sacabollo|chapa/.test(n)) category = "chapa_soldadura";
  else if (/pintura/.test(n)) category = "pintura";
  else if (/electromec|encendido/.test(n)) category = "electrica";
  else if (/repuesto|autopartes/.test(n)) category = "repuestos";
  else if (/\bvtv\b|grabado/.test(n)) category = "papeles_vtv";
  if (/moto/.test(n) && !/automot/.test(n)) vehicles = ["moto"];
  return { category, vehicles };
}

function osmToItems(geo) {
  const out = [];
  const vistos = new Set();
  for (const f of geo.features || []) {
    const p = f.properties || {};
    const g = f.geometry;
    if (!p.name || !g || g.type !== "Point") continue;
    if (/^\d+$/.test(p.name.trim()) || NO_NEGOCIO.test(plano(p.name))) continue;
    const base = OSM_MAP[p.shop || p.amenity || p.craft];
    if (!base) continue;
    const m = refinar(p, base);
    const osmKey = String(f.id || p["@id"] || `${g.coordinates[1]},${g.coordinates[0]}`);
    if (vistos.has(osmKey)) continue;
    vistos.add(osmKey);
    const street = [p["addr:street"], p["addr:housenumber"]].filter(Boolean).join(" ");
    out.push({
      osmId: String(f.id || p["@id"] || `${g.coordinates[1]},${g.coordinates[0]}`),
      name: p.name.slice(0, 120),
      category: m.category,
      vehicles: m.vehicles,
      zone: (p["addr:suburb"] || p["addr:city"] || "La Plata").slice(0, 80),
      address: street.slice(0, 160),
      phone: (p.phone || p["contact:phone"] || p["contact:whatsapp"] || "").slice(0, 40),
      lat: g.coordinates[1],
      lng: g.coordinates[0],
    });
  }
  return out;
}

function ImportarOsm() {
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);
  const onFile = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    try {
      const todos = new Map();
      for (const file of files) {
        for (const it of osmToItems(JSON.parse(await file.text()))) todos.set(it.osmId, it);
      }
      setItems(Array.from(todos.values()));
    } catch { toast.error("Ese archivo no se pudo leer"); }
  };
  const send = async () => {
    setBusy(true);
    try {
      const r = await api.importOsm(items);
      toast.success(`Cargados: ${r.nuevos}. Repetidos: ${r.repetidos}`);
      setItems([]);
    } catch { toast.error("No se pudo importar"); }
    setBusy(false);
  };
  const conTel = items.filter((i) => i.phone).length;
  return (
    <div className="space-y-3" data-testid="admin-importar">
      <p className="text-white/60 text-sm">
        Elegí uno o varios archivos <b>.geojson</b> de OpenStreetMap (podés seleccionar los 3 juntos con Ctrl). Se cargan como <b>sin verificar</b>, con la leyenda de OpenStreetMap.
      </p>
      <input type="file" multiple accept=".geojson,.json,application/json" onChange={onFile} className="text-sm text-white/70" />
      {items.length > 0 && (
        <div className="rounded-lg bg-[#0B0C10] border border-[#1F2330] p-3 text-sm text-white/80">
          <p>Listos para cargar: <b>{items.length}</b> negocios ({conTel} con teléfono).</p>
          <button onClick={send} disabled={busy} className="mt-3 bg-[#FFD60A] text-[#0B0C10] font-bold rounded-lg px-4 py-2 disabled:opacity-50">
            {busy ? "Cargando..." : "Cargar ahora"}
          </button>
        </div>
      )}
    </div>
  );
}

function Pendientes({ subs, refresh }) {
  const approve = async (id) => { try { await api.approve(id); toast.success("Aprobado"); refresh(); } catch { toast.error("No se pudo aprobar"); } };
  const reject = async (id) => { try { await api.rejectSubmission(id); toast.success("Rechazado"); refresh(); } catch { toast.error("No se pudo rechazar"); } };
  return (
    <div className="space-y-2">
      {subs.length === 0 && <p className="text-white/40 text-sm">No hay talleres pendientes.</p>}
      {subs.map((b) => (
        <div key={b.id} className="flex items-center justify-between rounded-lg bg-[#0B0C10] border border-[#1F2330] px-3 py-2" data-testid={`admin-sub-${b.id}`}>
          <div>
            <p className="text-white text-sm font-semibold">{b.name}</p>
            <p className="text-white/50 text-xs">{b.category} - {b.zone} - {(b.vehicles || []).join("/")}</p>
          </div>
          <div className="flex gap-2">
            <button data-testid={`admin-approve-${b.id}`} onClick={() => approve(b.id)} className="bg-[#10B981] text-[#0B0C10] rounded-lg px-2 py-1.5"><Check size={16} /></button>
            <button data-testid={`admin-reject-${b.id}`} onClick={() => reject(b.id)} className="bg-[#FF2A3B] text-white rounded-lg px-2 py-1.5"><Trash2 size={16} /></button>
          </div>
        </div>
      ))}
    </div>
  );
}

function AgendaAdmin({ events, refresh }) {
  const [f, setF] = useState({ title: "", date: "", location: "", type: "expo", description: "" });
  const add = async () => {
    if (!f.title || !f.date) return toast.error("Completá título y fecha");
    try {
      await api.addEvent(f); toast.success("Evento agregado");
      setF({ title: "", date: "", location: "", type: "expo", description: "" }); refresh();
    } catch { toast.error("No se pudo agregar el evento"); }
  };
  const del = async (id) => { try { await api.delEvent(id); refresh(); } catch { toast.error("No se pudo eliminar"); } };
  return (
    <div>
      <div className="grid sm:grid-cols-2 gap-2 mb-3">
        <input data-testid="admin-event-title" className={inp} placeholder="Titulo" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
        <input data-testid="admin-event-date" className={inp} type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} />
        <input data-testid="admin-event-location" className={inp} placeholder="Lugar" value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} />
        <select data-testid="admin-event-type" className={inp} value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>
          <option value="expo">Expo</option><option value="carrera">Carrera</option><option value="encuentro">Encuentro</option>
        </select>
      </div>
      <button data-testid="admin-event-add" onClick={add} className="mb-4 inline-flex items-center gap-1.5 bg-[#FFD60A] text-[#0B0C10] font-bold rounded-lg px-3 py-2 text-sm"><Plus size={15} /> Agregar evento</button>
      <div className="space-y-2">
        {events.map((e) => (
          <div key={e.id} className="flex items-center justify-between rounded-lg bg-[#0B0C10] border border-[#1F2330] px-3 py-2" data-testid={`admin-event-${e.id}`}>
            <span className="text-white text-sm">{e.title} <span className="text-white/40">({e.date})</span></span>
            <button onClick={() => del(e.id)} className="text-white/40 hover:text-[#FF2A3B]"><Trash2 size={15} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

function CrudAdmin({ coll, items, refresh, fields, empty, label }) {
  const [f, setF] = useState(empty);
  const add = async () => {
    const payload = { ...f };
    ["lat", "lng"].forEach((k) => { if (payload[k] !== undefined && payload[k] !== "") payload[k] = parseFloat(payload[k]); });
    try { await api.crudAdd(coll, payload); toast.success("Agregado"); setF(empty); refresh(); }
    catch { toast.error("No se pudo agregar"); }
  };
  const del = async (id) => { try { await api.crudDel(coll, id); refresh(); } catch { toast.error("No se pudo eliminar"); } };
  return (
    <div>
      <div className="grid sm:grid-cols-2 gap-2 mb-3">
        {fields.map(([k, lab]) => (
          typeof empty[k] === "boolean" ? (
            <label key={k} className="flex items-center gap-2 text-sm text-white/80"><input type="checkbox" checked={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.checked })} /> {lab}</label>
          ) : (
            <input key={k} data-testid={`admin-${coll}-${k}`} className={inp} placeholder={lab} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
          )
        ))}
      </div>
      <button data-testid={`admin-${coll}-add`} onClick={add} className="mb-4 inline-flex items-center gap-1.5 bg-[#FFD60A] text-[#0B0C10] font-bold rounded-lg px-3 py-2 text-sm"><Plus size={15} /> Agregar</button>
      <div className="space-y-2">
        {items.map((i) => (
          <div key={i.id} className="flex items-center justify-between rounded-lg bg-[#0B0C10] border border-[#1F2330] px-3 py-2" data-testid={`admin-${coll}-item-${i.id}`}>
            <span className="text-white text-sm">{label(i)}</span>
            <button data-testid={`admin-${coll}-del-${i.id}`} onClick={() => del(i.id)} className="text-white/40 hover:text-[#FF2A3B]"><Trash2 size={15} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
