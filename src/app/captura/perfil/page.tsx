"use client";

import { useState } from "react";
import { useCapturaCatalogos } from "@/hooks/useCapturaCatalogos";
import { useNombreLider } from "@/hooks/useNombreLider";
import { CapturaSidebar } from "@/components/captura/CapturaSidebar";
import { CapturaHeader } from "@/components/captura/CapturaHeader";
import { CapturaPerfilForm } from "@/components/captura/CapturaPerfilForm";
import { ToastProvider } from "@/components/ui/Toast";

function CapturaPerfilContent() {
  const catalogos = useCapturaCatalogos();
  const nombreLider = useNombreLider();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <CapturaSidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <CapturaHeader onToggleMenu={() => setMenuOpen((v) => !v)} nombreLider={nombreLider} />

      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <div className="card p-4 sm:p-6">
          {catalogos.loading ? (
            <p className="py-10 text-center text-sm text-slate-400">Cargando catálogos...</p>
          ) : (
            <CapturaPerfilForm catalogos={catalogos} onSaved={() => {}} />
          )}
        </div>
      </main>
    </div>
  );
}

export default function CapturaPerfilPage() {
  return (
    <ToastProvider>
      <CapturaPerfilContent />
    </ToastProvider>
  );
}
