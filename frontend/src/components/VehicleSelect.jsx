import React from "react";
import { useApp } from "@/context/AppContext";

export function VehicleSelect() {
  const { push, setMotoIntro, motoIntro } = useApp();

  const pick = (vehicle) => {
    if (vehicle === "moto") {
      setMotoIntro(true);
      setTimeout(() => { setMotoIntro(false); push({ screen: "categories", vehicle }); }, 750);
    } else {
      push({ screen: "categories", vehicle });
    }
  };

  return (
    <section className="max-w-6xl mx-auto px-4 pt-4 pb-8" data-testid="vehicle-select">
      <img src="/marca-automotos.png" alt="AUTOMOTOS L.P." className="h-14 sm:h-20 w-auto mx-auto mb-4 select-none" draggable={false} data-testid="vehicle-select-brand" />
      <h2 className="font-cond font-900 uppercase text-4xl sm:text-5xl text-white text-center tracking-wide">
        Toma tu posición de largada
      </h2>
      <p className="text-white/50 text-center mt-2 text-base">
        Elegí tu vehículo y encontrá el servicio exacto que buscás.
      </p>

      <div className="flex flex-wrap justify-center gap-5 mt-5">
        <button
          data-testid="select-auto"
          onClick={() => pick("auto")}
          className="group relative overflow-hidden rounded-2xl bg-[#12141C] border-2 border-[#FFD60A] w-full max-w-[260px] px-3 py-2 flex items-center gap-4 text-left hover:-translate-y-1 transition-all"
        >
          <img
            src="/btn-autos.png"
            alt="Autos"
            className="w-24 h-24 sm:w-28 sm:h-28 object-contain shrink-0 group-hover:scale-105 transition-transform select-none pointer-events-none"
          />
          <div>
            <h3 className="font-cond font-900 text-3xl uppercase text-white leading-none">Autos</h3>
            <p className="text-white/60 text-[10px] mt-1.5 leading-snug">HACÉ CLICK para entrar en la GUIA de SERVICIOS e INFO. actual</p>
          </div>
        </button>

        <button
          data-testid="select-moto"
          onClick={() => pick("moto")}
          className="group relative overflow-hidden rounded-2xl bg-[#12141C] border-2 border-[#FFD60A] w-full max-w-[260px] px-3 py-2 flex items-center gap-4 text-left hover:-translate-y-1 transition-all"
        >
          <img
            src="/btn-motos.png"
            alt="Motos"
            className={`w-24 h-24 sm:w-28 sm:h-28 object-contain shrink-0 group-hover:scale-105 transition-transform select-none pointer-events-none ${motoIntro ? "moto-pass" : ""}`}
          />
          <div>
            <h3 className="font-cond font-900 text-3xl uppercase text-white leading-none">Motos</h3>
            <p className="text-white/60 text-[10px] mt-1.5 leading-snug">HACÉ CLICK para entrar en la GUIA de SERVICIOS e INFO. actual</p>
          </div>
        </button>
      </div>
    </section>
  );
}
