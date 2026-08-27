"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

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
  const router = useRouter();
  const title = TITLES[pathname] || "Campaña Política";
  const [usuario, setUsuario] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setUsuario(data?.usuario || null))
      .catch(() => setUsuario(null));
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

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
      <h1 className="flex-1 text-base font-semibold text-slate-900 sm:text-lg">{title}</h1>
      {usuario && (
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-slate-500 sm:inline">{usuario}</span>
          <button onClick={handleLogout} className="btn-ghost !px-2.5 !py-1.5 text-sm" title="Cerrar sesión">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      )}
    </header>
  );
}
