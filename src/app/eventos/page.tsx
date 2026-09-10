"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiGet, apiDelete } from "@/lib/api";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { EventoForm } from "@/components/eventos/EventoForm";
import { useToast } from "@/components/ui/Toast";
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

export default function EventosPage() {
  const router = useRouter();
  const toast = useToast();

  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setEventos(await apiGet<Evento[]>("/api/eventos"));
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Error cargando eventos", "error");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function handleSaved(id: number) {
    setModalOpen(false);
    load();
    router.push(`/eventos/${id}`);
  }

  async function confirmDelete() {
    if (deleteId == null) return;
    try {
      await apiDelete(`/api/eventos/${deleteId}`);
      toast.show("Evento eliminado", "success");
      setDeleteId(null);
      load();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Error al eliminar", "error");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Eventos</h2>
          <p className="text-sm text-slate-500">Actividades de la campaña y control de asistencia de referidos.</p>
        </div>
        <button className="btn-primary" onClick={() => setModalOpen(true)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          Nuevo evento
        </button>
      </div>

      <div className="card p-4">
        {loading ? (
          <div className="space-y-2 py-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />)}
          </div>
        ) : eventos.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-400">Aún no hay eventos registrados. Usa "Nuevo evento" para crear el primero.</p>
        ) : (
          <div className="thin-scroll overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                  <th className="py-3 pl-2 pr-3 font-medium">Evento</th>
                  <th className="px-3 py-3 font-medium">Ubicación</th>
                  <th className="px-3 py-3 font-medium">Fecha</th>
                  <th className="px-3 py-3 font-medium">Hora</th>
                  <th className="px-3 py-3 font-medium">Asistentes</th>
                  <th className="px-3 py-3 font-medium">Estado</th>
                  <th className="py-3 pl-3 pr-2 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {eventos.map((e) => {
                  const proximo = esProximo(e);
                  return (
                    <tr
                      key={e.id}
                      onClick={() => router.push(`/eventos/${e.id}`)}
                      className="cursor-pointer hover:bg-slate-50"
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
                      <td className="px-3 py-3 text-slate-600">{e.total_asistentes ?? 0}</td>
                      <td className="px-3 py-3">
                        <span className={`badge ${proximo ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                          {proximo ? "Próximo" : "Realizado"}
                        </span>
                      </td>
                      <td className="py-3 pl-3 pr-2">
                        <div className="flex justify-end">
                          <button
                            onClick={(ev) => { ev.stopPropagation(); setDeleteId(e.id); }}
                            className="btn-ghost !px-2 !py-1 text-red-500 hover:bg-red-50"
                            aria-label="Eliminar evento"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="17" height="17">
                              <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nuevo evento" widthClass="max-w-lg">
        <EventoForm onSaved={handleSaved} onCancel={() => setModalOpen(false)} />
      </Modal>

      <ConfirmDialog
        open={deleteId != null}
        title="Eliminar evento"
        message="¿Está seguro de eliminar este evento? También se eliminará el registro de todos sus asistentes. Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
