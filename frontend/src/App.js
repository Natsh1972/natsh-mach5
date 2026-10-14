import React from "react";
import "@/App.css";
import "leaflet/dist/leaflet.css";
import { Toaster } from "sonner";
import { AppProvider, useApp } from "@/context/AppContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { VehicleSelect } from "@/components/VehicleSelect";
import { CategoryGrid } from "@/components/CategoryGrid";
import { BusinessList } from "@/components/BusinessList";
import { BusinessDetail } from "@/components/BusinessDetail";
import { SearchResults } from "@/components/SearchResults";
import { AgendaFierro } from "@/components/AgendaFierro";
import { Mach5Bar } from "@/components/Mach5Bar";
import { ModalHost } from "@/components/modals/Modal";
import { getCategory, TRAMITES_SLUGS } from "@/data/categories";
import { CategoryIcon } from "@/components/CategoryIcon";

// Trámites y Gestoría: Papeles/VTV, Asesoría Legal y Gestoría/Aseguradoras (fuera de Auto/Moto, arriba de Agenda Fierro).
const TRAMITES = TRAMITES_SLUGS;

function TramitesSection() {
  const { push } = useApp();
  return (
    <section className="max-w-6xl mx-auto px-4 pt-16 pb-0" data-testid="tramites-section">
      <h2 className="font-cond font-900 uppercase text-xl sm:text-2xl text-white tracking-wide">
        Trámites <span className="text-[#FFD60A]">y Gestoría</span>
      </h2>
      <p className="text-white/50 mt-1 text-base">Papeles, VTV y asesoría legal para tu auto o moto.</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
        {TRAMITES.map((slug) => {
          const c = getCategory(slug);
          return (
            <button
              key={slug}
              data-testid={`tramite-${slug}`}
              onClick={() => push({ screen: "list", category: slug })}
              className="group rounded-xl border-2 border-white p-5 text-left hover:-translate-y-1 transition-all"
              style={{ background: "linear-gradient(180deg, #1C1C1C 0%, #0E0E0E 100%)" }}
            >
              <div className="w-11 h-11 rounded-lg flex items-center justify-center mb-3" style={{ background: `${c.color}1A` }}>
                <CategoryIcon slug={slug} className="w-6 h-6" />
              </div>
              <h3 className="font-cond font-800 uppercase text-lg text-white leading-tight">{c.label}</h3>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function Screen() {
  const { current } = useApp();
  switch (current.screen) {
    case "categories":
      return <CategoryGrid vehicle={current.vehicle} />;
    case "list":
      return <BusinessList vehicle={current.vehicle} category={current.category} />;
    case "detail":
      return <BusinessDetail id={current.id} />;
    case "search":
      return <SearchResults query={current.query} />;
    case "home":
    default:
      return (
        <>
          <Hero />
          <VehicleSelect />
          <TramitesSection />
          <AgendaFierro />
        </>
      );
  }
}

function Shell() {
  return (
    <div className="App min-h-screen bg-[#0B0C10] text-white flex flex-col">
      <Header />
      <main className="flex-1 pb-40">
        <Screen />
      </main>
      <Footer />
      <Mach5Bar />
      <ModalHost />
      <Toaster theme="dark" position="top-center" richColors />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
