import React from "react";
import {
  Wrench, PaintBucket, CircleDot, Zap, Lightbulb, Truck, Droplets,
  Sparkles, Fuel, PackageSearch, FileCheck2, Scale, HardHat, ShieldCheck,
  ScanLine, Disc3, Hammer, Cog, Layers, Armchair, ShoppingBag, Snowflake, Umbrella, Droplet,
} from "lucide-react";
import { getCategory } from "@/data/categories";

const MAP = {
  mecanica: Wrench,
  scanner: ScanLine,
  alineacion: Disc3,
  chapa_soldadura: Hammer,
  pintura: PaintBucket,
  repuestos: Cog,
  lubricentros: Droplet,
  polarizados: Layers,
  tapiceria: Armchair,
  accesorios: ShoppingBag,
  aire_acondicionado: Snowflake,
  gestoria_aseguradoras: Umbrella,
  neumaticos: CircleDot,
  electrica: Zap,
  optica: Lightbulb,
  grua: Truck,
  lavadero: Droplets,
  personalizacion: Sparkles,
  gnc: Fuel,
  importadores: PackageSearch,
  papeles_vtv: FileCheck2,
  asesoria_legal: Scale,
  cascos: HardHat,
  seguridad_airbag: ShieldCheck,
};

export function CategoryIcon({ slug, className = "w-6 h-6", style }) {
  const Icon = MAP[slug] || Wrench;
  const cat = getCategory(slug);
  return <Icon className={className} style={{ color: cat?.color, ...style }} />;
}
