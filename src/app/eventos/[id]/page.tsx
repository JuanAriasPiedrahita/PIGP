"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { apiGet } from "@/lib/api";
import { EventoForm } from "@/components/eventos/EventoForm";
import { EventoAsistentesManager } from "@/components/eventos/EventoAsistentesManager";
import { useToast } from "@/components/ui/Toast";
import type { Evento } from "@/lib/types";

export default function EventoDetallePage() {
  const params = useParams<{ id: string }>();
  const eventoId = Number(params.id);
  const toast = useToast();

  const [evento, setEvento] = useState<Evento | null>(null);

  useEffect(() => {
    apiGet<Evento>(`/api/eventos/${eventoId}`)
      .then(setEvento)
      .catch((err) => toast.show(err instanceof Error ? err.message : "Error cargando el evento", "error"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventoId]);

  return (
    <div className="space-y-5">
      <div>
        <Link href="/eventos" className="text-sm text-brand-700 hover:underline">← Volver a Eventos</Link>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-slate-900">{evento ? evento.nombre : "Cargando..."}</h2>
        {evento && <p className="text-sm text-slate-500">{evento.ubicacion}</p>}
      </div>

      <div className="card p-5">
        <h3 className="mb-4 text-sm font-semibold text-slate-700">Datos del evento</h3>
        {evento ? (
          <EventoForm eventoId={eventoId} onSaved={(id) => apiGet<Evento>(`/api/eventos/${id}`).then(setEvento)} />
        ) : (
          <p className="py-6 text-center text-sm text-slate-400">Cargando...</p>
        )}
      </div>

      <EventoAsistentesManager
        eventoId={eventoId}
        apiBase="/api/eventos"
        buscarReferidosUrl={(q) => `/api/referidos?q=${encodeURIComponent(q)}`}
      />
    </div>
  );
}
