import React, { useState } from "react";
import { Search, CalendarDays, PlusCircle } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { LogoCompact } from "@/components/graphics";
const SCREEN_LABEL = {
  home: "HOME",
  categories: "CATEGORÍAS",
  list: "LISTA",
  detail: "DETALLE",
  search: "BÚSQUEDA",
};
export function Header() {
  const { goHome, push, openModal, current } = useApp();
  const [q, setQ] = useState("");
  const submitSearch = (e) => {
    e.preventDefault();
    if (q.trim().length === 0) return;
    push({ screen: "search", query: q.trim() });
  };
  return (
    <header className="sticky top-0 z-40 h-12 bg-[#0B0C10]/90 backdrop-blur-md border-b border-[#1F2330]">
      <div className="max-w-6xl mx-auto px-4 h-full flex items-center gap-3">
        <button onClick={goHome} data-testid="header-logo" className="shrink-0 flex items-center gap-2">
          <span className="inline-flex items-center">
            <LogoCompact />
          </span>
          <span className="hidden md:inline-flex text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#FFD60A] text-[#0B0C10]" data-testid="header-section-chip">
            {SCREEN_LABEL[current.screen] || "HOME"}
          </span>
        </button>
        <form onSubmit={submitSearch} className="flex-1 relative max-w-xl">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            data-testid="header-search-input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar taller, servicio o barrio..."
            className="w-full bg-[#12141C] border border-[#1F2330] rounded-full pl-9 pr-4 py-1.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-[#FFD60A]/60"
          />
        </form>
        <button
          data-testid="header-agenda-btn"
          onClick={() => { goHome(); setTimeout(() => document.getElementById("agenda")?.scrollIntoView({ behavior: "smooth" }), 60); }}
          className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-white/80 hover:text-[#FFD60A] transition-colors"
        >
          <CalendarDays size={16} /> Agenda
        </button>
        <button
          data-testid="header-suma-taller-btn"
          onClick={() => openModal("sumaTaller")}
          className="inline-flex items-center gap-1.5 text-sm font-bold bg-[#FFD60A] text-[#0B0C10] rounded-full px-3 py-1.5 hover:brightness-95 transition"
        >
          <PlusCircle size={16} /> <span className="text-xs sm:text-sm whitespace-nowrap">Suma tu taller</span>
        </button>
      </div>
    </header>
  );
}
