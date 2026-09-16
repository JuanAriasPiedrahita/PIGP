"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { apiGet } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import type { InversionReferido, InversionGestion } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
}

interface ReferidoSeleccionado {
  id: number;
  nombre: string;
}

function formatCosto(v: number): string {
  return `$${Number(v).toLocaleString("es-CO")}`;
}

/** Detalle de "Costo invertido" del dashboard: un renglón por referido (resumen), con drill-down a sus gestiones resueltas. */
export function InversionesModal({ open, onClose }: Props) {
  const router = useRouter();
  const [filas, setFilas] = useState<InversionReferido[]>([]);
  const [loadingResumen, setLoadingResumen] = useState(false);

  const [referido, setReferido] = useState<ReferidoSeleccionado | null>(null);
  const [gestiones, setGestiones] = useState<InversionGestion[]>([]);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  const toast = useToast();

  useEffect(() => {
    if (!open) {
      setReferido(null);
      return;
    }
    setLoadingResumen(true);
    apiGet<InversionReferido[]>("/api/gestiones/inversiones")
      .then(setFilas)
      .catch((err) => toast.show(err instanceof Error ? err.message : "Error cargando las inversiones", "error"))
      .finally(() => setLoadingResumen(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function abrirDetalle(r: InversionReferido) {
    setReferido({ id: r.referido_id, nombre: r.colaborador });
    setLoadingDetalle(true);
    apiGet<InversionGestion[]>(`/api/gestiones/inversiones/detalle?referido_id=${r.referido_id}`)
      .then(setGestiones)
      .catch((err) => toast.show(err instanceof Error ? err.message : "Error cargando el detalle", "error"))
      .finally(() => setLoadingDetalle(false));
  }

  const total = filas.reduce((sum, f) => sum + Number(f.total_invertido), 0);
  const maxInvertido = Math.max(1, ...filas.map((f) => Number(f.total_invertido)));
  const totalDetalle = gestiones.reduce((sum, g) => sum + (g.costo != null ? Number(g.costo) : 0), 0);

  const titulo = referido ? `Gestiones resueltas — ${referido.nombre}` : "Costo invertido en gestiones";

  return (
    <Modal open={open} onClose={onClose} title={titulo} widthClass="max-w-2xl">
      {referido ? (
        <div className="space-y-4">
          <button className="text-sm text-brand-700 hover:underline" onClick={() => setReferido(null)}>
            ← Volver al resumen
          </button>
          {loadingDetalle ? (
            <div className="space-y-2 py-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />
              ))}
            </div>
          ) : gestiones.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">Este referido no tiene gestiones resueltas.</p>
          ) : (
            <div className="thin-scroll overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                    <th className="py-2 pr-3 font-medium">Tipo de ayuda</th>
                    <th className="px-3 py-2 font-medium">Responsable</th>
                    <th className="px-3 py-2 font-medium">Fecha</th>
                    <th className="px-3 py-2 text-right font-medium">Costo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {gestiones.map((g) => (
                    <tr
                      key={g.id}
                      onClick={() => router.push(`/gestiones/${referido.id}?gestion_id=${g.id}`)}
                      className="cursor-pointer hover:bg-slate-50"
                    >
                      <td className="py-2 pr-3 font-medium text-slate-800">{g.tipo_ayuda_descripcion || "Sin tipo"}</td>
                      <td className="px-3 py-2 text-slate-600">{g.responsable || "—"}</td>
                      <td className="px-3 py-2 text-slate-600">{g.fecha_resolucion?.slice(0, 10)}</td>
                      <td className="px-3 py-2 text-right text-slate-600">
                        {g.costo != null ? formatCosto(g.costo) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-slate-200 font-semibold text-slate-800">
                    <td className="py-2 pr-3" colSpan={3}>
                      Total
                    </td>
                    <td className="px-3 py-2 text-right">{formatCosto(totalDetalle)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      ) : loadingResumen ? (
        <div className="space-y-2 py-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-slate-100" />
          ))}
        </div>
      ) : filas.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-400">Aún no se ha registrado ninguna inversión.</p>
      ) : (
        <div className="space-y-5">
          <div className="rounded-xl bg-gradient-to-br from-brand-700 to-brand-950 p-5 text-white shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-brand-200">Total invertido</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums">{formatCosto(total)}</p>
            <p className="mt-1 text-sm text-brand-200">
              {filas.length} referido{filas.length === 1 ? "" : "s"} con inversión registrada
            </p>
          </div>

          <div className="thin-scroll max-h-[50vh] space-y-1 overflow-y-auto pr-1">
            {filas.map((f, idx) => (
              <button
                key={f.referido_id}
                type="button"
                onClick={() => abrirDetalle(f)}
                className="block w-full rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-slate-50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">{f.colaborador}</p>
                      <p className="truncate text-xs text-slate-400">
                        {f.resueltas} gestión{Number(f.resueltas) === 1 ? "" : "es"} resuelta
                        {Number(f.resueltas) === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-800">
                    {formatCosto(f.total_invertido)}
                  </span>
                </div>
                <div className="ml-9 mt-1.5 h-1.5 rounded-full bg-slate-100">
                  <div
                    className="h-1.5 rounded-full bg-brand-600"
                    style={{ width: `${(Number(f.total_invertido) / maxInvertido) * 100}%` }}
                  />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}
