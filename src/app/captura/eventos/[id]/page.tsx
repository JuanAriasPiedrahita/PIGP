"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLiderSesion } from "@/hooks/useLiderSesion";
import { apiGet } from "@/lib/api";
import { CapturaSidebar } from "@/components/captura/CapturaSidebar";
import { CapturaHeader } from "@/components/captura/CapturaHeader";
import { EventoForm } from "@/components/eventos/EventoForm";
import { EventoAsistentesManager } from "@/components/eventos/EventoAsistentesManager";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import type { Evento } from "@/lib/types";

const API_BASE = "/api/captura/eventos";

function CapturaEventoDetalleContent() {
  const params = useParams<{ id: string }>();
  const eventoId = Number(params.id);
  const router = useRouter();
  const toast = useToast();
  const sesion = useLiderSesion();

  const [menuOpen, setMenuOpen] = useState(false);
  const [evento, setEvento] = useState<Evento | null>(null);

  // Defensa en profundidad: la API ya responde 403, pero si un líder sin el
  // atributo "Coordinador logística" entra directo a esta URL, lo regresamos.
  useEffect(() => {
    if (sesion && !sesion.coordinadorLogistica) {
      toast.show("No tienes permiso para editar eventos", "error");
      router.replace("/captura/eventos");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sesion]);

  useEffect(() => {
    if (!sesion?.coordinadorLogistica) return;
    apiGet<Evento>(`${API_BASE}/${eventoId}`)
      .then(setEvento)
      .catch((err) => toast.show(err instanceof Error ? err.message : "Error cargando el evento", "error"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventoId, sesion?.coordinadorLogistica]);

  if (!sesion?.coordinadorLogistica) {
    return (
      <div className="min-h-screen bg-slate-50">
        <CapturaSidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
        <CapturaHeader onToggleMenu={() => setMenuOpen((v) => !v)} nombreLider={sesion?.nombre ?? null} />
        <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
          <p className="py-10 text-center text-sm text-slate-400">Cargando...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <CapturaSidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <CapturaHeader onToggleMenu={() => setMenuOpen((v) => !v)} nombreLider={sesion.nombre} />

      <main className="mx-auto max-w-5xl space-y-5 px-4 py-6 sm:px-6">
        <div>
          <button onClick={() => router.push("/captura/eventos")} className="text-sm text-brand-700 hover:underline">
            ← Volver a Eventos
          </button>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-slate-900">{evento ? evento.nombre : "Cargando..."}</h2>
          {evento && <p className="text-sm text-slate-500">{evento.ubicacion}</p>}
        </div>

        <div className="card p-5">
          <h3 className="mb-4 text-sm font-semibold text-slate-700">Datos del evento</h3>
          {evento ? (
            <EventoForm eventoId={eventoId} apiBase={API_BASE} onSaved={(id) => apiGet<Evento>(`${API_BASE}/${id}`).then(setEvento)} />
          ) : (
            <p className="py-6 text-center text-sm text-slate-400">Cargando...</p>
          )}
        </div>

        <EventoAsistentesManager
          eventoId={eventoId}
          apiBase={API_BASE}
          buscarReferidosUrl={(q) => `${API_BASE}/buscar-referidos?q=${encodeURIComponent(q)}`}
        />
      </main>
    </div>
  );
}

export default function CapturaEventoDetallePage() {
  return (
    <ToastProvider>
      <CapturaEventoDetalleContent />
    </ToastProvider>
  );
}
