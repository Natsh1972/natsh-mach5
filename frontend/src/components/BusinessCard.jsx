import React from "react";
import { MapPin, MessageCircle, Bookmark, Navigation } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { StarRating, VerificadoBadge } from "@/components/bits";
import { CategoryIcon } from "@/components/CategoryIcon";
import { getCategory } from "@/data/categories";
import { waLink } from "@/lib/api";

export function NearMeToggle() {
  const { nearMe, toggleNearMe } = useApp();
  return (
    <button
      data-testid="near-me-toggle"
      onClick={toggleNearMe}
      className={`inline-flex items-center gap-1.5 text-xs font-semibold rounded-full px-3 py-1.5 border transition ${
        nearMe ? "bg-[#FFD60A] text-[#0B0C10] border-[#FFD60A]" : "bg-[#12141C] text-white/70 border-[#1F2330] hover:border-[#FFD60A]/50"
      }`}
    >
      <Navigation size={13} /> Cerca de mi
    </button>
  );
}

export function BusinessCard({ business, distanceKm }) {
  const { push, toggleFav, isFav } = useApp();
  const cat = getCategory(business.category);
  const fav = isFav(business.id);

  return (
    <article
      data-testid={`business-card-${business.id}`}
      onClick={() => push({ screen: "detail", id: business.id })}
      className="rounded-xl bg-[#12141C] border border-[#1F2330] overflow-hidden hover:border-[#FFD60A]/40 transition-all group cursor-pointer"
    >
      <div className="block w-full text-left">
        <div className="relative h-36 bg-[#0B0C10]">
          {business.photos?.[0] ? (
            <img src={business.photos[0]} alt={business.name} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <CategoryIcon slug={business.category} className="w-10 h-10 opacity-40" />
            </div>
          )}
          {business.highlighted && (
            <span className="absolute top-2 left-2 bg-[#FFD60A] text-[#0B0C10] text-[10px] font-bold uppercase px-2 py-0.5 rounded-full tracking-wide">Destacado</span>
          )}
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-cond font-800 text-lg text-white leading-tight group-hover:text-[#FFD60A] transition">{business.name}</h3>
          <button data-testid={`fav-toggle-${business.id}`} onClick={(e) => { e.stopPropagation(); toggleFav(business.id); }}>
            <Bookmark size={18} className={fav ? "fill-[#FFD60A] text-[#FFD60A]" : "text-white/40 hover:text-white"} />
          </button>
        </div>

        <div className="flex items-center gap-2 mt-1 text-xs" style={{ color: cat?.color }}>
          <CategoryIcon slug={business.category} className="w-3.5 h-3.5" />
          <span className="font-semibold uppercase tracking-wide">{cat?.label}</span>
        </div>

        <div className="flex items-center gap-1.5 text-white/50 text-xs mt-1.5">
          <MapPin size={13} /> {business.zone}
          {typeof distanceKm === "number" && <span className="text-[#FFD60A]">- {distanceKm.toFixed(1)} km</span>}
        </div>

        <div className="flex items-center gap-2 mt-2">
          <StarRating value={business.rating} size={14} />
          <span className="text-white/50 text-xs">{business.rating?.toFixed(1)} ({business.reviewsCount})</span>
        </div>

        {business.verified && <div className="mt-2"><VerificadoBadge /></div>}

        {business.source === "osm" && (
          <p className="mt-2 text-[11px] text-white/45">Sin verificar · Datos © OpenStreetMap</p>
        )}

        {business.whatsapp ? (
          <a
            data-testid={`business-whatsapp-${business.id}`}
            href={waLink(business.whatsapp, `Hola ${business.name}, te contacto desde AUTOMOTOS L.P.`)}
            target="_blank" rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="mt-3 flex items-center justify-center gap-2 w-full bg-[#25D366] text-[#0B0C10] font-bold text-sm rounded-lg py-2 hover:brightness-95 transition"
          >
            <MessageCircle size={16} /> WhatsApp
          </a>
        ) : business.phone ? (
          <a
            href={`tel:${business.phone}`}
            onClick={(e) => e.stopPropagation()}
            className="mt-3 flex items-center justify-center gap-2 w-full border border-[#1F2330] text-white font-bold text-sm rounded-lg py-2 hover:bg-white/5 transition"
          >
            Llamar {business.phone}
          </a>
        ) : null}
      </div>
    </article>
  );
}
