import React, { useState } from "react";
import { Navigation, Fuel, Gauge, PhoneCall, ChevronDown } from "lucide-react";
import { useApp } from "@/context/AppContext";
// Tablero MACH5: barra flotante compacta con esquinas redondeadas; cada boton en su propio marco.
const BUTTONS = [
  { key: "A", label: "GPS", short: "GPS", color: "#FFD60A", iconColor: "#0B0C10", Icon: Navigation, testid: "mach5-gps", modal: "map", props: { initial: "gps" } },
  { key: "B", label: "Combustible y GNC", short: "Nafta y GNC", color: "#0088FF", Icon: Fuel, testid: "mach5-map", modal: "map", props: { initial: "combustible" } },
  { key: "C", label: "Radares y Cámaras", color: "#FF2A3B", Icon: Gauge, short: "Radares", testid: "mach5-radares", modal: "map", props: { initial: "radares" } },
  { key: "D", label: "Estacionamientos", short: "Estac.", color: "#FFFFFF", iconColor: "#0B0C10", letter: "E", testid: "mach5-estacionamientos", modal: "map", props: { initial: "parking" } },
  { key: "E", label: "Emergencias", short: "SOS", color: "#DC2626", Icon: PhoneCall, testid: "mach5-emergencia", modal: "emergencia", props: {} },
];
export function Mach5Bar() {
  const { openModal } = useApp();
  const [collapsed, setCollapsed] = useState(false);
  if (collapsed) {
    return (
      <button
        data-testid="mach5-expand"
        onClick={() => setCollapsed(false)}
        className="fixed bottom-3 right-3 z-50 bg-[#FFD60A] text-[#0B0C10] font-cond font-900 uppercase tracking-widest rounded-full px-5 py-3 shadow-lg shadow-black/40 flex items-center gap-2 hover:brightness-95 transition"
      >
        <Gauge size={20} /> Mach 5
      </button>
    );
  }
  return (
    <div
      className="fixed bottom-2 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-1rem)] max-w-2xl rounded-2xl border-2 border-white bg-[#0B0C10]/90 backdrop-blur-md shadow-xl shadow-black/50"
      data-testid="mach5-bar"
    >
      <div className="flex items-center justify-between px-3 pt-1.5 pb-0.5">
        <span className="font-cond font-900 uppercase tracking-widest text-[#FFD60A] text-[10px]">Mach 5</span>
        <button data-testid="mach5-collapse" onClick={() => setCollapsed(true)} className="text-white/50 hover:text-white">
          <ChevronDown size={16} />
        </button>
      </div>
      <div className="grid grid-cols-5 gap-1.5 px-2 pb-2">
        {BUTTONS.map(({ key, label, short, color, iconColor, Icon, letter, testid, modal, props }) => (
          <button
            key={key}
            data-testid={testid}
            onClick={() => openModal(modal, props)}
            className="min-w-0 flex flex-col items-center justify-center gap-1 py-1.5 rounded-xl border-2 border-[#FF2A3B] bg-white/[0.02] hover:bg-white/[0.06] hover:-translate-y-0.5 transition-all"
          >
            <span
              className="w-8 h-8 rounded-full flex items-center justify-center shadow-md shadow-black/30"
              style={{ background: color }}
            >
              {letter
                ? <span className="font-cond font-900 text-lg leading-none" style={{ color: iconColor }}>{letter}</span>
                : <Icon size={16} style={{ color: iconColor || "#FFFFFF" }} />}
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-wide text-white/80 leading-tight text-center max-w-full px-0.5 overflow-hidden"><span className="sm:hidden">{short || label}</span><span className="hidden sm:inline">{label}</span></span>
          </button>
        ))}
      </div>
    </div>
  );
}
