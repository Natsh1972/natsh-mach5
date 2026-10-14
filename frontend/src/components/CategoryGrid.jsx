import React from "react";
import { useApp } from "@/context/AppContext";
import { getCategoriesForVehicle, TRAMITES_SLUGS } from "@/data/categories";
import { CategoryIcon } from "@/components/CategoryIcon";
import { BackButton } from "@/components/bits";
export function CategoryGrid({ vehicle }) {
  const { push } = useApp();
  // Trámites (Papeles/VTV, Asesoría Legal, Gestoría) NO son rubros de Auto ni Moto: van arriba de Agenda Fierro.
  const cats = getCategoriesForVehicle(vehicle).filter((c) => !TRAMITES_SLUGS.includes(c.slug));
  return (
    <section className="max-w-6xl mx-auto px-4 py-8" data-testid="category-grid">
      <div className="mb-4"><BackButton /></div>
      <h2 className="font-cond font-900 uppercase text-4xl sm:text-5xl text-white tracking-wide">
        {vehicle === "moto" ? "Moto" : "Auto"} <span className="text-[#FFD60A]">/ Categorias</span>
      </h2>
      <p className="text-white/50 mt-1 text-base">Elegi que necesitas.</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-8">
        {cats.map((c) => (
          <button
            key={c.slug}
            data-testid={`category-${c.slug}`}
            onClick={() => push({ screen: "list", vehicle, category: c.slug })}
            className="group rounded-xl border p-5 text-left hover:-translate-y-1 transition-all"
            style={{
              background: "linear-gradient(180deg, #1C1C1C 0%, #0E0E0E 100%)",
              borderColor: "#2A2A2A",
              borderWidth: "1px",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = c.color)}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#2A2A2A")}
          >
            <div className="w-11 h-11 rounded-lg flex items-center justify-center mb-3" style={{ background: `${c.color}1A` }}>
              <CategoryIcon slug={c.slug} className="w-6 h-6" />
            </div>
            <h3 className="font-cond font-800 uppercase text-lg text-white leading-tight">{c.label}</h3>
          </button>
        ))}
      </div>
    </section>
  );
}
