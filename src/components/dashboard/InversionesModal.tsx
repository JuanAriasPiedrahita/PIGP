"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { apiGet } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import type { InversionGestion } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
}

function formatCosto(v: number): string {
  return `$${Number(v).toLocaleString("es-CO")}`;
}

/** Detalle de "Costo invertido" del dashboard: gestiones con costo asignado, de mayor a menor inversión. */
export function InversionesModal({ open, onClose }: Props) {
  const [filas, setFilas] = useState<InversionGestion[]>([]);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    apiGet<InversionGestion[]>("/api/gestiones/inversiones")
      .then(setFilas)
      .catch((err) => toast.show(err instanceof Error ? err.message : "Error cargando las inversiones", "error"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const total = filas.reduce((sum, f) => sum + Number(f.costo), 0);
  const maxCosto = Math.max(1, ...filas.map((f) => Number(f.costo)));

  return (
    <Modal open={open} onClose={onClose} title="Costo invertido en gestiones" widthClass="max-w-2xl">
      {loading ? (
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
              {filas.length} gestión{filas.length === 1 ? "" : "es"} con costo asignado
            </p>
          </div>

          <div className="thin-scroll max-h-[50vh] space-y-1 overflow-y-auto pr-1">
            {filas.map((f, idx) => (
              <div key={f.id} className="rounded-lg px-2 py-2.5 transition-colors hover:bg-slate-50">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">{f.colaborador}</p>
                      <p className="truncate text-xs text-slate-400">
                        {f.tipo_ayuda_descripcion || "Sin tipo"}
                        {f.responsable && ` · ${f.responsable}`}
                        {f.fecha_resolucion && ` · ${f.fecha_resolucion.slice(0, 10)}`}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-800">
                    {formatCosto(f.costo)}
                  </span>
                </div>
                <div className="ml-9 mt-1.5 h-1.5 rounded-full bg-slate-100">
                  <div
                    className="h-1.5 rounded-full bg-brand-600"
                    style={{ width: `${(Number(f.costo) / maxCosto) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}
