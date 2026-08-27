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
    href: "/",
    label: "Dashboard",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20">
        <rect x="3" y="3" width="8" height="8" rx="1.5" />
        <rect x="13" y="3" width="8" height="5" rx="1.5" />
        <rect x="13" y="12" width="8" height="9" rx="1.5" />
        <rect x="3" y="15" width="8" height="6" rx="1.5" />
      </svg>
    ),
  },
  {
    href: "/lideres",
    label: "Líderes",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/referidos",
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
    href: "/gestiones",
    label: "Gestiones",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20">
        <path d="M9 5H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-1" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 4.5a1.5 1.5 0 011.5-1.5h3A1.5 1.5 0 0115 4.5V6H9V4.5z" strokeLinejoin="round" />
        <path d="M9 12h4M9 16h6" strokeLinecap="round" />
        <path d="M15.5 15.5l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/zonas",
    label: "Zonas",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20">
        <path d="M12 21s7-6.1 7-11.5A7 7 0 105 9.5C5 14.9 12 21 12 21z" strokeLinejoin="round" />
        <circle cx="12" cy="9.5" r="2.5" />
      </svg>
    ),
  },
  {
    href: "/comunas",
    label: "Comunas",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20">
        <path d="M3 21V10l9-6 9 6v11" strokeLinejoin="round" />
        <path d="M9 21v-7h6v7" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/configuracion",
    label: "Configuración",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 00.3 1.9l.1.1a2 2 0 11-2.9 2.9l-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.6V21a2 2 0 11-4 0v-.2a1.7 1.7 0 00-1-1.6 1.7 1.7 0 00-1.9.3l-.1.1a2 2 0 11-2.9-2.9l.1-.1a1.7 1.7 0 00.3-1.9 1.7 1.7 0 00-1.6-1H3a2 2 0 110-4h.2a1.7 1.7 0 001.6-1 1.7 1.7 0 00-.3-1.9l-.1-.1a2 2 0 112.9-2.9l.1.1a1.7 1.7 0 001.9.3H9.2a1.7 1.7 0 001-1.6V3a2 2 0 114 0v.2a1.7 1.7 0 001 1.6 1.7 1.7 0 001.9-.3l.1-.1a2 2 0 112.9 2.9l-.1.1a1.7 1.7 0 00-.3 1.9v.1a1.7 1.7 0 001.6 1H21a2 2 0 110 4h-.2a1.7 1.7 0 00-1.6 1z" strokeLinejoin="round" />
      </svg>
    ),
  },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
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
            const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href + "/"));
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
