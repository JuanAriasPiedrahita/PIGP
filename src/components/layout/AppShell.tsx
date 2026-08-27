"use client";

import { ReactNode, useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { ToastProvider } from "@/components/ui/Toast";

export function AppShell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  // El login y la zona de captura de líderes no llevan el menú/topbar del admin
  // (la zona de captura ya trae su propio ToastProvider).
  if (pathname === "/login" || pathname.startsWith("/captura")) {
    return <>{children}</>;
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-slate-50">
        <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
        <Topbar onToggleMenu={() => setMenuOpen((v) => !v)} />
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </ToastProvider>
  );
}
