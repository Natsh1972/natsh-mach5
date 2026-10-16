import React from "react";

// Marca AUTOMOTOS L.P. - logo COMPLETO (LA PLATA - ALREDEDORES). Se usa a pie de pagina.
export function LogoBig({ className = "" }) {
  return (
    <img
      src="/logo-auto-moto.png"
      alt="AUTO MOTOS - La Plata y alrededores"
      className={`h-24 sm:h-28 w-auto max-w-full block rounded-lg select-none ${className}`}
      data-testid="logo-big"
      draggable={false}
    />
  );
}

// Logo SIMPLE (AUTO MOTOS L.P.) para el nav sticky.
export function LogoCompact({ className = "" }) {
  return (
    <img
      src="/marca-automotos.png"
      alt="AUTO MOTOS L.P."
      className={`h-7 w-auto block select-none ${className}`}
      data-testid="logo-compact"
      draggable={false}
    />
  );
}

export function VerificadoStamp({ className = "" }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <circle cx="50" cy="50" r="46" fill="none" stroke="#10B981" strokeWidth="4" strokeDasharray="6 4" />
      <path d="M32 52 l12 12 l24 -28" fill="none" stroke="#10B981" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AutoIcon({ className = "", color = "currentColor" }) {
  return (
    <svg viewBox="0 0 64 40" className={className} fill="none">
      <path d="M6 26 L12 14 C14 10 18 8 24 8 L40 8 C46 8 50 10 53 15 L58 24" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <rect x="4" y="24" width="56" height="8" rx="3" fill={color} />
      <circle cx="18" cy="33" r="5" fill="#0B0C10" stroke={color} strokeWidth="3" />
      <circle cx="46" cy="33" r="5" fill="#0B0C10" stroke={color} strokeWidth="3" />
    </svg>
  );
}

export function MotoIcon({ className = "", color = "currentColor" }) {
  return (
    <svg viewBox="0 0 64 40" className={className} fill="none">
      <circle cx="14" cy="28" r="8" stroke={color} strokeWidth="3" />
      <circle cx="50" cy="28" r="8" stroke={color} strokeWidth="3" />
      <path d="M14 28 L26 28 L34 16 L44 16 M30 28 L40 20 M44 16 L50 28" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M42 14 L50 14" stroke={color} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function MotoSilhouette({ className = "" }) {
  return <MotoIcon className={className} color="#FFD60A" />;
}
