import React from "react";
import { MessageCircle, PlusCircle, Lock, Mail } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { LogoBig } from "@/components/graphics";
import { waLink, MACH5_WHATSAPP } from "@/lib/api";

export function Footer() {
  const { openModal } = useApp();
  return (
    <footer className="border-t border-[#1F2330] bg-[#0B0C10] mt-10">
      <div className="max-w-6xl mx-auto px-4 py-10 grid gap-8 md:grid-cols-3">
        <div>
          <div className="inline-block">
            <LogoBig />
          </div>
          <p className="text-white/50 text-sm mt-4 max-w-xs">
            La guia del fierro en La Plata y alrededores. Talleres, servicios y comunidad
            para autos y motos.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <h4 className="font-cond font-800 uppercase tracking-widest text-white/70 text-sm">Acciones</h4>
          <button
            data-testid="footer-suma-taller-btn"
            onClick={() => openModal("sumaTaller")}
            className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-[#FFD60A] transition w-fit"
          >
            <PlusCircle size={16} /> Suma tu taller
          </button>
          <a
            data-testid="footer-whatsapp-link"
            href={waLink(MACH5_WHATSAPP, "Hola MACH5, quiero consultar por AUTOMOTOS L.P.")}
            target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-[#25D366] transition w-fit"
          >
            <MessageCircle size={16} /> WhatsApp +54 9 2216370789
          </a>
          <a
            data-testid="footer-email-link"
            href="mailto:automotos.lp@proton.me"
            className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-[#FFD60A] transition w-fit"
          >
            <Mail size={16} /> automotos.lp@proton.me
          </a>
          <button
            data-testid="footer-admin-btn"
            onClick={() => openModal("admin")}
            className="inline-flex items-center gap-2 text-xs text-white/40 hover:text-white/70 transition w-fit"
          >
            <Lock size={13} /> Admin
          </button>
        </div>

        <div className="text-white/40 text-xs leading-relaxed">
          <p className="font-semibold text-white/60 mb-1">Aviso legal</p>
          <p>
            AUTOMOTOS L.P. es un directorio informativo. Los datos de radares, camaras,
            desvios y sitios son de caracter comunitario y orientativo. Verifica siempre
            la informacion oficial.
          </p>
          <p className="mt-3">Firma <span className="text-[#FFD60A] font-semibold">MACH5</span> - {new Date().getFullYear()}</p>
          <p className="mt-2" data-testid="footer-credits">
            Hecho en equipo: <span className="text-white/60 font-semibold">Natsh</span> con la ayuda de{" "}
            <span className="text-white/60 font-semibold">GitHub Copilot</span> y <span className="text-white/60 font-semibold">Gemini</span>.
          </p>
        </div>
      </div>
    </footer>
  );
}
