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
      <h2 className="font-cond font-900 uppercase text-3xl sm:text-5xl text-white tracking-wide">
        {vehicle === "moto" ? "Moto" : "Auto"} <span className="text-[#FFD60A]">/ Categorias</span>
      </h2>
      <p className="text-white/50 mt-1 text-base">Elegi que necesitas.</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 mt-6">
        {cats.map((c) => (
          <button
            key={c.slug}
            data-testid={`category-${c.slug}`}
            onClick={() => push({ screen: "list", vehicle, category: c.slug })}
            className="group min-w-0 flex items-center gap-2.5 rounded-lg bg-[#15171E] border border-[#232632] border-l-4 px-2.5 py-3.5 text-left hover:bg-[#1B1E27] active:scale-[0.98] transition"
            style={{ borderLeftColor: c.color }}
          >
            <span className="shrink-0 w-8 h-8 rounded-md flex items-center justify-center" style={{ background: `${c.color}1A` }}>
              <CategoryIcon slug={c.slug} className="w-5 h-5" />
            </span>
            <h3 className="min-w-0 font-cond font-800 uppercase text-sm sm:text-base text-white leading-tight break-words">{c.label}</h3>
          </button>
        ))}
      </div>
    </section>
  );
}
