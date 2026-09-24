"use client";

import { useRouter, usePathname } from "next/navigation";

const TITLES: Record<string, string> = {
  "/captura": "Mis referidos",
  "/captura/eventos": "Eventos",
};

interface CapturaHeaderProps {
  onToggleMenu: () => void;
  nombreLider: string | null;
}

/** Header fijo de la zona de captura (líderes): botón hamburguesa + título según la ruta + logout. Mismo patrón que el Topbar del panel admin. */
export function CapturaHeader({ onToggleMenu, nombreLider }: CapturaHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const title = TITLES[pathname] || "Campaña Política";

  async function handleLogout() {
    await fetch("/api/captura/auth/logout", { method: "POST" });
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
      <div className="flex-1">
        <h1 className="text-base font-semibold text-slate-900 sm:text-lg">{title}</h1>
        {nombreLider && <p className="text-xs text-slate-500">{nombreLider}</p>}
      </div>
      <button onClick={handleLogout} className="btn-ghost !px-2.5 !py-1.5 text-sm" title="Cerrar sesión">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18">
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </header>
  );
}
