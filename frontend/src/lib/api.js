import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const MACH5_WHATSAPP = "5492216370789";
export const DEFAULT_ASSIST = "5492216370789";

export const HERO_PHOTOS = [
  { url: "https://images.unsplash.com/photo-1517026575980-3e1e2dedeab4?w=900&q=80", label: "Tablero" },
  { url: "https://images.unsplash.com/photo-1611448746128-7c39e03b71e4?w=900&q=80", label: "Al volante" },
  { url: "https://images.unsplash.com/photo-1429772011165-0c2e054367b8?w=900&q=80", label: "Motor" },
  { url: "https://images.unsplash.com/photo-1527383418406-f85a3b146499?w=900&q=80", label: "Piston" },
  { url: "https://images.unsplash.com/photo-1591259966748-4e4b9916858f?w=900&q=80", label: "Moto" },
];

export const LARGADA_IMG = "https://static.prod-images.emergentagent.com/jobs/0a725c86-10ad-458e-ad21-c60db9da26f2/images/9e4256b538677e9225dcc8c38d7aa50e688ef7b4e89ab8cdd70cfce637d99b53.jpeg";

export const waLink = (phone, text) => {
  const t = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${phone}${t}`;
};

// withCredentials -> envia/recibe la cookie httpOnly del JWT (sin token en localStorage)
const client = axios.create({
  baseURL: API,
  withCredentials: true,
  headers: { "X-Requested-With": "XMLHttpRequest" },
});

// Sin backend, el hosting devuelve HTML en vez de JSON: se trata como error para no romper la pagina.
client.interceptors.response.use((res) => {
  if (typeof res.data === "string" && /^\s*</.test(res.data)) {
    return Promise.reject(new Error("Respuesta invalida del servidor"));
  }
  return res;
});

export const api = {
  // public
  getBusinesses: (params) => client.get("/businesses", { params }).then((r) => r.data),
  getBusiness: (id) => client.get(`/businesses/${id}`).then((r) => r.data),
  search: (q) => client.get("/search", { params: { q } }).then((r) => r.data),
  submit: (data) => client.post("/submissions", data).then((r) => r.data),
  addReview: (data) => client.post("/reviews", data).then((r) => r.data),
  replyReview: (id, text) => client.post(`/reviews/${id}/reply`, { text }).then((r) => r.data),
  getRadars: () => client.get("/radars").then((r) => r.data),
  addRadar: (data) => client.post("/radars", data).then((r) => r.data),
  getFuel: () => client.get("/fuel-points").then((r) => r.data),
  getCameras: () => client.get("/cameras").then((r) => r.data),
  getEvents: () => client.get("/events").then((r) => r.data),
  getPlaces: () => client.get("/places").then((r) => r.data),
  getSites: () => client.get("/sites").then((r) => r.data),
  getDesvios: () => client.get("/desvios").then((r) => r.data),
  // admin auth (JWT en cookie httpOnly)
  login: (email, password) => client.post("/auth/login", { email, password }).then((r) => r.data),
  logout: () => client.post("/auth/logout").then((r) => r.data),
  me: () => client.get("/auth/me").then((r) => r.data),
  // admin actions (autenticadas por cookie)
  getSubmissions: () => client.get("/admin/submissions").then((r) => r.data),
  approve: (id) => client.post(`/admin/submissions/${id}/approve`, {}).then((r) => r.data),
  importOsm: (items) => client.post("/admin/import-osm", { items }).then((r) => r.data),
  rejectSubmission: (id) => client.delete(`/admin/submissions/${id}`).then((r) => r.data),
  addEvent: (data) => client.post("/admin/events", data).then((r) => r.data),
  delEvent: (id) => client.delete(`/admin/events/${id}`).then((r) => r.data),
  delRadar: (id) => client.delete(`/admin/radars/${id}`).then((r) => r.data),
  // generic crud: cameras/places/sites/desvios
  crudAdd: (coll, data) => client.post(`/admin/${coll}`, data).then((r) => r.data),
  crudUpdate: (coll, id, data) => client.put(`/admin/${coll}/${id}`, data).then((r) => r.data),
  crudDel: (coll, id) => client.delete(`/admin/${coll}/${id}`).then((r) => r.data),
};
