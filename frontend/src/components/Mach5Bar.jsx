import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useApp } from "@/context/AppContext";
// Tablero MACH5: barra flotante compacta con esquinas redondeadas; cada boton en su propio marco.
const BUTTONS = [
  { key: "A", label: "GPS", short: "GPS", color: "#FFD60A", iconColor: "#0B0C10", testid: "mach5-gps", modal: "map", props: { initial: "gps" } },
  { key: "B", label: "Combustible y GNC", short: "Nafta y GNC", color: "#0088FF", testid: "mach5-map", modal: "map", props: { initial: "combustible" } },
  { key: "C", label: "Radares y Cámaras", color: "#FF2A3B", short: "Radares", testid: "mach5-radares", modal: "map", props: { initial: "radares" } },
  { key: "D", label: "Estacionamientos", short: "Estac.", color: "#FFFFFF", iconColor: "#0B0C10", letter: "E", testid: "mach5-estacionamientos", modal: "map", props: { initial: "parking" } },
  { key: "E", label: "Emergencias", short: "SOS", color: "#DC2626", testid: "mach5-emergencia", modal: "emergencia", props: {} },
];
export function Mach5Bar() {
  const { openModal } = useApp();
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div
      className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl rounded-t-2xl border-t border-x border-white/15 bg-[#0B0C10]/95 backdrop-blur-md shadow-xl shadow-black/60"
      data-testid="mach5-bar"
    >
      <button
        data-testid={collapsed ? "mach5-expand" : "mach5-collapse"}
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-4 pt-2.5 pb-1.5"
      >
        <span className="flex items-center gap-2">
          <span className="font-cond font-900 uppercase tracking-widest text-white text-sm">Mach 5</span>
          <span className="bg-[#FFD60A] text-[#0B0C10] font-cond font-900 uppercase text-[9px] tracking-wide rounded px-1.5 py-0.5">Directo LP</span>
        </span>
        <span className="flex items-center gap-1 text-white/60 text-xs">
          Accesos de Emergencia
          <ChevronDown size={16} className={collapsed ? "rotate-180 transition" : "transition"} />
        </span>
      </button>
      {!collapsed && (
        <div className="grid grid-cols-5 gap-1 px-3 pb-3">
          {BUTTONS.map(({ key, label, short, color, Icon, testid, modal, props }) => (
            <button
              key={key}
              data-testid={testid}
              aria-label={label}
              onClick={() => openModal(modal, props)}
              className="min-w-0 flex flex-col items-center gap-1 group"
            >
              <span
                className="w-11 h-11 rounded-full border-2 flex items-center justify-center font-cond font-900 text-lg group-hover:bg-white/10 group-active:scale-95 transition"
                style={{ borderColor: color, color }}
              >
                {key}
              </span>
              <span className="text-[9px] font-semibold uppercase tracking-wide text-white/70 leading-tight text-center max-w-full overflow-hidden">
                <span className="sm:hidden">{short || label}</span>
                <span className="hidden sm:inline">{label}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
