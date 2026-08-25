"use client";

import { usePathname } from "next/navigation";

const TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/lideres": "Líderes",
  "/referidos": "Referidos",
  "/zonas": "Zonas y puestos de votación",
  "/comunas": "Comunas y barrios",
  "/configuracion": "Configuración",
};

export function Topbar({ onToggleMenu }: { onToggleMenu: () => void }) {
  const pathname = usePathname();
  const title = TITLES[pathname] || "Campaña Política";

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur sm:px-6">
      <button
        onClick={onToggleMenu}
        aria-label="Abrir menú"
        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
          <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
        </svg>
      </button>
      <h1 className="text-base font-semibold text-slate-900 sm:text-lg">{title}</h1>
    </header>
  );
}
