"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { apiGet } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import type { HistorialReferido, Referido } from "@/lib/types";

interface Props {
  referido: Referido | null;
  onClose: () => void;
}

const ESTADO_BADGE: Record<string, string> = {
  PENDIENTE: "bg-amber-50 text-amber-700",
  NO_VIABLE: "bg-slate-100 text-slate-500",
  RESUELTO: "bg-emerald-50 text-emerald-700",
};

const ESTADO_LABEL: Record<string, string> = {
  PENDIENTE: "Pendiente",
  NO_VIABLE: "No viable",
  RESUELTO: "Resuelto",
};

export function HistorialReferidoModal({ referido, onClose }: Props) {
  const [historial, setHistorial] = useState<HistorialReferido | null>(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const totalInvertido = (historial?.gestiones || []).reduce((sum, g) => sum + (g.costo != null ? Number(g.costo) : 0), 0);

  useEffect(() => {
    if (!referido) {
      setHistorial(null);
      return;
    }
    setLoading(true);
    apiGet<HistorialReferido>(`/api/referidos/${referido.id}/historial`)
      .then(setHistorial)
      .catch((err) => toast.show(err instanceof Error ? err.message : "Error cargando el historial", "error"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [referido]);

  return (
    <Modal
      open={!!referido}
      onClose={onClose}
      title={referido ? `Historial de ${referido.nombre} ${referido.apellidos}` : "Historial"}
      widthClass="max-w-2xl"
    >
      {loading ? (
        <div className="space-y-2 py-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />)}
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-slate-700">Gestiones realizadas</h3>
              {historial && historial.gestiones.length > 0 && (
                <span className="badge bg-brand-50 text-brand-800">
                  Total: ${totalInvertido.toLocaleString("es-CO")}
                </span>
              )}
            </div>
            {!historial || historial.gestiones.length === 0 ? (
              <p className="text-sm text-slate-400">No se le ha registrado ninguna gestión.</p>
            ) : (
              <div className="thin-scroll overflow-x-auto">
                <table className="w-full min-w-[620px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                      <th className="py-2 pr-3 font-medium">Tipo de ayuda</th>
                      <th className="px-3 py-2 font-medium">Responsable</th>
                      <th className="px-3 py-2 font-medium">Fecha de resolución</th>
                      <th className="px-3 py-2 font-medium">Estado</th>
                      <th className="px-3 py-2 text-right font-medium">Costo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {historial.gestiones.map((g) => (
                      <tr key={g.id}>
                        <td className="py-2 pr-3 font-medium text-slate-800">{g.tipo_ayuda_descripcion}</td>
                        <td className="px-3 py-2 text-slate-600">{g.gestor_nombre}</td>
                        <td className="px-3 py-2 text-center text-slate-600">
                          {g.fecha_resolucion ? g.fecha_resolucion.slice(0, 10) : "-"}
                        </td>
                        <td className="px-3 py-2">
                          <span className={`badge ${ESTADO_BADGE[g.estado]}`}>{ESTADO_LABEL[g.estado]}</span>
                        </td>
                        <td className="px-3 py-2 text-right text-slate-600">
                          {g.costo != null ? `$${Number(g.costo).toLocaleString("es-CO")}` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 pt-5">
            <h3 className="mb-3 text-sm font-semibold text-slate-700">Eventos a los que ha asistido</h3>
            {!historial || historial.eventos.length === 0 ? (
              <p className="text-sm text-slate-400">No se le ha registrado asistencia a ningún evento.</p>
            ) : (
              <div className="thin-scroll overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                      <th className="py-2 pr-3 font-medium">Evento</th>
                      <th className="px-3 py-2 font-medium">Ubicación</th>
                      <th className="px-3 py-2 font-medium">Fecha</th>
                      <th className="px-3 py-2 font-medium">Hora</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {historial.eventos.map((e) => (
                      <tr key={e.id}>
                        <td className="py-2 pr-3 font-medium text-slate-800">{e.nombre}</td>
                        <td className="px-3 py-2 text-slate-600">{e.ubicacion}</td>
                        <td className="px-3 py-2 text-slate-600">{e.fecha.slice(0, 10)}</td>
                        <td className="px-3 py-2 text-slate-600">{e.hora.slice(0, 5)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
