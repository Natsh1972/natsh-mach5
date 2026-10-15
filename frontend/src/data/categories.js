// Categories for AUTOMOTOS L.P.
// Lista definitiva de secciones (Auto / Moto). "vehicles": "both" | "auto" | "moto".
// Papeles y VTV, Asesoria Legal y Gestoria/Aseguradoras van en "Tramites y Gestoria" (pagina principal).
export const CATEGORIES = [
  { slug: "mecanica", label: "Mecánica en General", vehicles: "both", color: "#FFD60A" },
  { slug: "gnc", label: "GNC", vehicles: "auto", color: "#10B981" },
  { slug: "scanner", label: "Scanner y Diagnóstico", vehicles: "both", color: "#60A5FA" },
  { slug: "neumaticos", label: "Neumáticos Nuevos/Usados", vehicles: "both", color: "#38BDF8" },
  { slug: "electrica", label: "Electrónica y Electricidad", vehicles: "both", color: "#FACC15" },
  { slug: "alineacion", label: "Alineación y Balanceo", vehicles: "both", color: "#2DD4BF" },
  { slug: "optica", label: "Ópticas, Luces y Sonido", vehicles: "both", color: "#A78BFA" },
  { slug: "chapa_soldadura", label: "Chapa, Sacabollos y Soldadura", vehicles: "both", color: "#FB7185" },
  { slug: "pintura", label: "Pintura", vehicles: "both", color: "#F97316" },
  { slug: "escapes_frenos", label: "Escapes y Frenos", vehicles: "both", color: "#FB923C" },
  { slug: "repuestos", label: "Repuestos Nuevos/Usados", vehicles: "both", color: "#F59E0B" },
  { slug: "lubricentros", label: "Lubricentros", vehicles: "both", color: "#EAB308" },
  { slug: "polarizados", label: "Polarizados", vehicles: "both", color: "#94A3B8" },
  { slug: "tapiceria", label: "Tapicería", vehicles: "both", color: "#C084FC" },
  { slug: "seguridad_airbag", label: "Seguridad y Airbag", vehicles: "both", color: "#EF4444" },
  { slug: "accesorios", label: "Accesorios e Indumentaria", vehicles: "both", color: "#F472B6" },
  { slug: "personalizacion", label: "Diseños Personalizados", vehicles: "both", color: "#22D3EE" },
  { slug: "aire_acondicionado", label: "Aire Acondicionado", vehicles: "auto", color: "#7DD3FC" },
  { slug: "cascos", label: "Cascos", vehicles: "moto", color: "#FFD60A" },
  { slug: "importadores", label: "Importadores", vehicles: "both", color: "#818CF8" },
  { slug: "lavadero", label: "Lavaderos", vehicles: "both", color: "#34D399" },
  { slug: "grua", label: "Grúa y Auxilio", vehicles: "both", color: "#FF2A3B" },
  { slug: "papeles_vtv", label: "Papeles y VTV", vehicles: "both", color: "#94A3B8" },
  { slug: "asesoria_legal", label: "Asesoría Legal", vehicles: "both", color: "#CBD5E1" },
  { slug: "gestoria_aseguradoras", label: "Gestoría y Aseguradoras", vehicles: "both", color: "#FBBF24" },
];

// Rubros que NO se muestran dentro de Auto/Moto: van en la seccion de la pagina principal.
export const TRAMITES_SLUGS = ["papeles_vtv", "asesoria_legal", "gestoria_aseguradoras"];

export function getCategoriesForVehicle(vehicle) {
  return CATEGORIES.filter((c) => c.vehicles === "both" || c.vehicles === vehicle);
}

export function getCategory(slug) {
  return CATEGORIES.find((c) => c.slug === slug);
}
