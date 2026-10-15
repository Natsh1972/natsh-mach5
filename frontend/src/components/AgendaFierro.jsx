import React, { useEffect, useState } from "react";
import { CalendarDays, MapPin } from "lucide-react";
import { api } from "@/lib/api";
const TAG = {
  expo: { label: "EXPO", bg: "#FFD60A", fg: "#0B0C10" },
  carrera: { label: "CARRERA", bg: "#FF2A3B", fg: "#FFFFFF" },
  encuentro: { label: "ENCUENTRO", bg: "#38BDF8", fg: "#0B0C10" },
  asesoria: { label: "ASESORÍA / GESTORÍA", bg: "#A78BFA", fg: "#0B0C10" },
};
function fmtDate(d) {
  try {
    return new Date(d + "T00:00:00").toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" });
  } catch { return d; }
}
export function AgendaFierro() {
  const [events, setEvents] = useState([]);
  useEffect(() => { api.getEvents().then(setEvents).catch(() => {}); }, []);
  return (
    <section id="agenda" className="max-w-6xl mx-auto px-4 py-10" data-testid="agenda-fierro">
      <div className="flex items-start gap-3 mb-2">
        <img src="/alp-emblem.png" alt="A.L.P." className="h-12 sm:h-14 w-auto select-none" />
        <div><h2 className="font-cond font-900 uppercase text-3xl sm:text-4xl text-white tracking-wide">AGENDA AUTOMOTOS L.P.</h2><p className="text-[#FFD60A] text-sm mt-1 max-w-[260px] leading-snug">Expo, carreras y encuentros en La Plata y alrededores.</p></div></div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mt-6">
        {events.map((e) => {
          const t = TAG[e.type] || TAG.encuentro;
          return (
            <article key={e.id} className="rounded-xl bg-[#12141C] border border-[#1F2330] p-3 hover:border-[#FFD60A]/40 transition" data-testid={`event-${e.id}`}>
              <span className="inline-block text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full" style={{ background: t.bg, color: t.fg }}>
                {t.label}
              </span>
              <h3 className="font-cond font-800 text-lg text-white mt-1.5 leading-tight">{e.title}</h3>
              <p className="text-white/50 text-xs mt-1 line-clamp-2">{e.description}</p>
              <div className="flex flex-col gap-1 mt-2 text-xs text-white/70">
                <span className="inline-flex items-center gap-1.5"><CalendarDays size={13} className="text-[#FFD60A]" /> {fmtDate(e.date)}</span>
                <span className="inline-flex items-center gap-1.5"><MapPin size={13} className="text-[#FFD60A]" /> {e.location}</span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
