"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLiderSesion } from "@/hooks/useLiderSesion";
import { apiGet } from "@/lib/api";
import { CapturaSidebar } from "@/components/captura/CapturaSidebar";
import { CapturaHeader } from "@/components/captura/CapturaHeader";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import type { Evento } from "@/lib/types";

/** Un evento es "próximo" si su fecha+hora combinadas aún no pasaron. */
function esProximo(e: Evento): boolean {
  return new Date(`${e.fecha.slice(0, 10)}T${e.hora.slice(0, 5)}`) >= new Date();
}

function formatFecha(fecha: string): string {
  return fecha.slice(0, 10);
}

function formatHora(hora: string): string {
  return hora.slice(0, 5);
}

function CapturaEventosContent() {
  const router = useRouter();
  const toast = useToast();
  const sesion = useLiderSesion();

  const [menuOpen, setMenuOpen] = useState(false);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<Evento[]>("/api/captura/eventos")
      .then(setEventos)
      .catch((err) => toast.show(err instanceof Error ? err.message : "Error cargando eventos", "error"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <CapturaSidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <CapturaHeader onToggleMenu={() => setMenuOpen((v) => !v)} nombreLider={sesion?.nombre ?? null} />

      <main className="mx-auto max-w-5xl space-y-5 px-4 py-6 sm:px-6">
        <div>
          <p className="text-sm text-slate-500">
            {eventos.length} evento{eventos.length === 1 ? "" : "s"} programado{eventos.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="card p-4">
          {loading ? (
            <div className="space-y-2 py-4">
              {[1, 2, 3].map((i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />)}
            </div>
          ) : eventos.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-400">Aún no hay eventos programados.</p>
          ) : (
            <div className="thin-scroll overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                    <th className="py-3 pl-2 pr-3 font-medium">Evento</th>
                    <th className="px-3 py-3 font-medium">Ubicación</th>
                    <th className="px-3 py-3 font-medium">Fecha</th>
                    <th className="px-3 py-3 font-medium">Hora</th>
                    <th className="px-3 py-3 font-medium">Duración</th>
                    <th className="px-3 py-3 font-medium">Asistentes</th>
                    <th className="py-3 pl-3 pr-2 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {eventos.map((e) => {
                    const proximo = esProximo(e);
                    const editable = !!sesion?.coordinadorLogistica;
                    return (
                      <tr
                        key={e.id}
                        onClick={editable ? () => router.push(`/captura/eventos/${e.id}`) : undefined}
                        className={editable ? "cursor-pointer hover:bg-slate-50" : undefined}
                      >
                        <td
                          className={`border-l-4 py-3 pl-2 pr-3 font-medium text-slate-800 ${
                            proximo ? "border-l-amber-500" : "border-l-emerald-500"
                          }`}
                        >
                          {e.nombre}
                        </td>
                        <td className="px-3 py-3 text-slate-600">{e.ubicacion}</td>
                        <td className="px-3 py-3 text-slate-600">{formatFecha(e.fecha)}</td>
                        <td className="px-3 py-3 text-slate-600">{formatHora(e.hora)}</td>
                        <td className="px-3 py-3 text-slate-600">{e.duracion_horas} h</td>
                        <td className="px-3 py-3 text-slate-600">{e.total_asistentes ?? 0}</td>
                        <td className="py-3 pl-3 pr-2">
                          <span className={`badge ${proximo ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                            {proximo ? "Próximo" : "Realizado"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function CapturaEventosPage() {
  return (
    <ToastProvider>
      <CapturaEventosContent />
    </ToastProvider>
  );
}
