import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { MapPin, MessageCircle, Bookmark, Send } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { api, waLink } from "@/lib/api";
import { getCategory } from "@/data/categories";
import { StarRating, StarInput, VerificadoBadge, BackButton } from "@/components/bits";
import { CategoryIcon } from "@/components/CategoryIcon";

export function BusinessDetail({ id }) {
  const { toggleFav, isFav } = useApp();
  const [b, setB] = useState(null);
  const [form, setForm] = useState({ author: "", stars: 5, text: "" });

  const load = () => api.getBusiness(id).then(setB).catch(() => toast.error("No se pudo cargar el taller"));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [id]);

  if (!b) return <div className="max-w-4xl mx-auto px-4 py-8 text-white/40">Cargando...</div>;
  const cat = getCategory(b.category);
  const fav = isFav(b.id);

  const submitReview = async (e) => {
    e.preventDefault();
    if (!form.author.trim()) return toast.error("Poné tu nombre");
    try {
      await api.addReview({ businessId: b.id, author: form.author, stars: form.stars, text: form.text, photos: [] });
    } catch { return toast.error("No se pudo enviar la reseña"); }
    toast.success("Gracias por tu reseña!");
    setForm({ author: "", stars: 5, text: "" });
    load();
  };

  return (
    <section className="max-w-4xl mx-auto px-4 py-8" data-testid="business-detail">
      <div className="mb-4"><BackButton /></div>

      <div className="rounded-2xl overflow-hidden border border-[#1F2330] bg-[#12141C]">
        <div className="relative h-52 sm:h-64 bg-[#0B0C10]">
          {b.photos?.[0] ? (
            <img src={b.photos[0]} alt={b.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center"><CategoryIcon slug={b.category} className="w-16 h-16 opacity-30" /></div>
          )}
        </div>

        <div className="p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-sm" style={{ color: cat?.color }}>
                <CategoryIcon slug={b.category} className="w-4 h-4" />
                <span className="font-semibold uppercase tracking-wide">{cat?.label}</span>
              </div>
              <h1 className="font-cond font-900 uppercase text-4xl text-white mt-1">{b.name}</h1>
              <div className="flex items-center gap-1.5 text-white/50 text-sm mt-1"><MapPin size={15} /> {b.zone}</div>
            </div>
            <button data-testid="detail-fav-toggle" onClick={() => toggleFav(b.id)}>
              <Bookmark size={22} className={fav ? "fill-[#FFD60A] text-[#FFD60A]" : "text-white/40 hover:text-white"} />
            </button>
          </div>

          <div className="flex items-center gap-3 mt-3">
            <StarRating value={b.rating} />
            <span className="text-white/50 text-sm">{b.rating?.toFixed(1)} - {b.reviewsCount} reseñas</span>
            {b.verified && <VerificadoBadge />}
          </div>

          <p className="text-white/70 mt-4">{b.description}</p>

          {b.services?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {b.services.map((s) => (
                <span key={s} className="text-xs bg-[#0B0C10] border border-[#1F2330] rounded-full px-3 py-1 text-white/70">{s}</span>
              ))}
            </div>
          )}

          {b.address && <p className="text-white/60 text-sm mt-3">📍 {b.address}</p>}
          {b.source === "osm" && (
            <p className="text-white/45 text-xs mt-3">Sin verificar · Datos © OpenStreetMap contributors. Confirmá horarios y datos antes de ir.</p>
          )}

          {b.whatsapp ? (
            <a
              data-testid="detail-whatsapp"
              href={waLink(b.whatsapp, `Hola ${b.name}, te contacto desde AUTOMOTOS L.P.`)}
              target="_blank" rel="noreferrer"
              className="mt-5 inline-flex items-center gap-2 bg-[#25D366] text-[#0B0C10] font-bold rounded-lg px-5 py-2.5 hover:brightness-95 transition"
            >
              <MessageCircle size={18} /> Contactar por WhatsApp
            </a>
          ) : b.phone ? (
            <a href={`tel:${b.phone}`} className="mt-5 inline-flex items-center gap-2 border border-[#1F2330] text-white font-bold rounded-lg px-5 py-2.5 hover:bg-white/5 transition">
              Llamar {b.phone}
            </a>
          ) : null}
        </div>
      </div>

      {/* gallery */}
      {b.photos?.length > 0 && (
        <div className="mt-8">
          <h3 className="font-cond font-800 uppercase text-2xl text-white mb-3">Trabajos reales</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {b.photos.map((p, i) => <img key={i} src={p} alt={`trabajo ${i + 1}`} className="rounded-lg h-36 w-full object-cover border border-[#1F2330]" />)}
          </div>
        </div>
      )}

      {/* reviews */}
      <div className="mt-8">
        <h3 className="font-cond font-800 uppercase text-2xl text-white mb-3">Reseñas</h3>

        <form onSubmit={submitReview} className="rounded-xl bg-[#12141C] border border-[#1F2330] p-4 mb-5" data-testid="review-form">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <input
              data-testid="review-author" value={form.author}
              onChange={(e) => setForm({ ...form, author: e.target.value })}
              placeholder="Tu nombre"
              className="bg-[#0B0C10] border border-[#1F2330] rounded-lg px-3 py-2 text-sm text-white flex-1 focus:outline-none focus:border-[#FFD60A]/60"
            />
            <StarInput value={form.stars} onChange={(s) => setForm({ ...form, stars: s })} />
          </div>
          <textarea
            data-testid="review-text" value={form.text}
            onChange={(e) => setForm({ ...form, text: e.target.value })}
            placeholder="Contá tu experiencia..." rows={2}
            className="w-full mt-3 bg-[#0B0C10] border border-[#1F2330] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#FFD60A]/60"
          />
          <button data-testid="review-submit" className="mt-3 inline-flex items-center gap-2 bg-[#FFD60A] text-[#0B0C10] font-bold text-sm rounded-lg px-4 py-2">
            <Send size={15} /> Publicar reseña
          </button>
        </form>

        <div className="space-y-3">
          {b.reviews?.length === 0 && <p className="text-white/40 text-sm">Todavía no hay reseñas. Sé el primero!</p>}
          {b.reviews?.map((r) => (
            <div key={r.id} className="rounded-xl bg-[#12141C] border border-[#1F2330] p-4" data-testid={`review-${r.id}`}>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">{r.author}</span>
                <StarRating value={r.stars} size={14} />
              </div>
              {r.text && <p className="text-white/70 text-sm mt-1">{r.text}</p>}
              {r.reply && (
                <div className="mt-3 ml-3 border-l-2 border-[#FFD60A]/50 pl-3">
                  <span className="text-[#FFD60A] text-xs font-bold uppercase">Respuesta del taller</span>
                  <p className="text-white/60 text-sm mt-0.5">{r.reply.text}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
