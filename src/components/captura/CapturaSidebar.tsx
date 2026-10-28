"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
  icon: JSX.Element;
}

const items: NavItem[] = [
  {
    href: "/captura",
    label: "Referidos",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20">
        <circle cx="9" cy="7" r="3.2" />
        <circle cx="17" cy="9.5" r="2.6" />
        <path d="M2.5 21c0-3.6 3-5.8 6.5-5.8s6.5 2.2 6.5 5.8" strokeLinecap="round" />
        <path d="M14.5 15.5c2.8.3 5 2.2 5 5.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/captura/eventos",
    label: "Eventos",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20">
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M3 10h18" strokeLinecap="round" />
        <path d="M8 3v4M16 3v4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/captura/perfil",
    label: "Mi Cuenta",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20">
        <circle cx="12" cy="8" r="3.5" />
        <path d="M4.5 20c0-4 3.4-6.5 7.5-6.5s7.5 2.5 7.5 6.5" strokeLinecap="round" />
      </svg>
    ),
  },
];

interface CapturaSidebarProps {
  open: boolean;
  onClose: () => void;
}

/** Menú hamburguesa de la zona de captura (líderes): mismo look & feel del Sidebar del panel admin, con solo dos opciones. */
export function CapturaSidebar({ open, onClose }: CapturaSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-slate-900/40 transition-opacity duration-200 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      {/* Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-brand-950 text-slate-100 shadow-2xl transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 font-bold text-white">CP</div>
          <div>
            <p className="text-sm font-semibold leading-tight">Campaña Política</p>
            <p className="text-xs text-brand-200">Panel de colaboradores</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {items.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active ? "bg-brand-700 text-white" : "text-brand-100 hover:bg-white/10"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 px-6 py-4 text-xs text-brand-300">
          © {new Date().getFullYear()} Campaña Política
        </div>
      </aside>
    </>
  );
}
