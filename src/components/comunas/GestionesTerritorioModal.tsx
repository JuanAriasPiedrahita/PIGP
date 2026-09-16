"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { apiGet } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import type { TerritorioResumenGestion, TerritorioDetalleGestion } from "@/lib/types";

export interface TerritorioSeleccionado {
  tipo: "comuna" | "barrio" | "gestor" | "tipo_ayuda";
  id: number;
  nombre: string;
}

interface Props {
  seleccion: TerritorioSeleccionado | null;
  onClose: () => void;
}

type Columna = "resueltas" | "pendientes" | "vencidas" | "no_viables";

const COLUMNA_LABEL: Record<Columna, string> = {
  resueltas: "Resueltas",
  pendientes: "Pendientes",
  vencidas: "Vencidas",
  no_viables: "No viables",
};

const COLUMNA_CLASS: Record<Columna, string> = {
  resueltas: "text-emerald-700",
  pendientes: "text-amber-700",
  vencidas: "text-red-600",
  no_viables: "text-slate-500",
};

interface Detalle {
  tipoAyudaId: number | null;
  tipoDescripcion: string;
  columna: Columna;
}

function queryParam(seleccion: TerritorioSeleccionado): string {
  if (seleccion.tipo === "barrio") return `barrio_id=${seleccion.id}`;
  if (seleccion.tipo === "gestor") return `gestor_id=${seleccion.id}`;
  if (seleccion.tipo === "tipo_ayuda") return `tipo_ayuda_id=${seleccion.id}`;
  return `comuna_id=${seleccion.id}`;
}

export function GestionesTerritorioModal({ seleccion, onClose }: Props) {
  const [resumen, setResumen] = useState<TerritorioResumenGestion[]>([]);
  const [loadingResumen, setLoadingResumen] = useState(false);
  const [detalle, setDetalle] = useState<Detalle | null>(null);
  const [filas, setFilas] = useState<TerritorioDetalleGestion[]>([]);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const toast = useToast();

  useEffect(() => {
    setDetalle(null);
    if (!seleccion) {
      setResumen([]);
      return;
    }
    setLoadingResumen(true);
    apiGet<TerritorioResumenGestion[]>(`/api/gestiones/territorio?${queryParam(seleccion)}`)
      .then(setResumen)
      .catch((err) => toast.show(err instanceof Error ? err.message : "Error cargando el resumen", "error"))
      .finally(() => setLoadingResumen(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seleccion]);

  function abrirDetalle(tipoAyudaId: number | null, tipoDescripcion: string, columna: Columna) {
    if (!seleccion) return;
    setDetalle({ tipoAyudaId, tipoDescripcion, columna });
    setLoadingDetalle(true);
    const tipoParam = tipoAyudaId != null ? `&tipo_ayuda_id=${tipoAyudaId}` : "";
    apiGet<TerritorioDetalleGestion[]>(
      `/api/gestiones/territorio/detalle?${queryParam(seleccion)}${tipoParam}&columna=${columna}`
    )
      .then(setFilas)
      .catch((err) => toast.show(err instanceof Error ? err.message : "Error cargando el detalle", "error"))
      .finally(() => setLoadingDetalle(false));
  }

  const titulo = seleccion
    ? detalle
      ? seleccion.tipo === "tipo_ayuda"
        ? `${seleccion.nombre} · ${COLUMNA_LABEL[detalle.columna]}`
        : `${detalle.tipoDescripcion} · ${COLUMNA_LABEL[detalle.columna]} — ${seleccion.nombre}`
      : seleccion.tipo === "gestor"
        ? `Gestiones asignadas a ${seleccion.nombre}`
        : seleccion.tipo === "tipo_ayuda"
          ? `Gestiones de tipo ${seleccion.nombre}`
          : `Gestiones en ${seleccion.nombre}`
    : "Gestiones";

  return (
    <Modal open={!!seleccion} onClose={onClose} title={titulo} widthClass="max-w-2xl">
      {detalle ? (
        <div className="space-y-4">
          <button className="text-sm text-brand-700 hover:underline" onClick={() => setDetalle(null)}>
            ← Volver al resumen
          </button>
          {loadingDetalle ? (
            <div className="space-y-2 py-4">
              {[1, 2, 3].map((i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />)}
            </div>
          ) : filas.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">No hay gestiones en esta categoría.</p>
          ) : (
            <div className="thin-scroll overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                    <th className="py-2 pr-3 font-medium">Referido</th>
                    {detalle.tipoAyudaId == null && <th className="px-3 py-2 font-medium">Tipo de ayuda</th>}
                    <th className="px-3 py-2 font-medium">Fecha</th>
                    <th className="px-3 py-2 font-medium">Responsable</th>
                    <th className="px-3 py-2 text-right font-medium">Costo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filas.map((g) => (
                    <tr key={g.id}>
                      <td className="py-2 pr-3 font-medium text-slate-800">{g.colaborador}</td>
                      {detalle.tipoAyudaId == null && (
                        <td className="px-3 py-2 text-slate-600">{g.tipo_ayuda_descripcion}</td>
                      )}
                      <td className="px-3 py-2 text-slate-600">
                        {(g.fecha_resolucion || g.fecha_limite)?.slice(0, 10)}
                      </td>
                      <td className="px-3 py-2 text-slate-600">{g.responsable}</td>
                      <td className="px-3 py-2 text-right text-slate-600">
                        {g.costo != null ? `$${Number(g.costo).toLocaleString("es-CO")}` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-slate-200 font-semibold text-slate-800">
                    <td className="py-2 pr-3" colSpan={detalle.tipoAyudaId == null ? 4 : 3}>Total</td>
                    <td className="px-3 py-2 text-right">
                      ${filas.reduce((sum, g) => sum + (g.costo != null ? Number(g.costo) : 0), 0).toLocaleString("es-CO")}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      ) : loadingResumen ? (
        <div className="space-y-2 py-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />)}
        </div>
      ) : resumen.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-400">No hay gestiones registradas aquí todavía.</p>
      ) : (
        <div className="thin-scroll overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                <th className="py-2 pr-3 font-medium">Tipo de ayuda</th>
                <th className="px-3 py-2 text-center font-medium">Resueltas</th>
                <th className="px-3 py-2 text-center font-medium">Pendientes</th>
                <th className="px-3 py-2 text-center font-medium">Vencidas</th>
                <th className="px-3 py-2 text-center font-medium">No viables</th>
                <th className="px-3 py-2 text-right font-medium">Costo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {resumen.map((t) => (
                <tr key={t.tipo_ayuda_id}>
                  <td className="py-2 pr-3 font-medium text-slate-800">{t.tipo_ayuda_descripcion}</td>
                  {(["resueltas", "pendientes", "vencidas", "no_viables"] as Columna[]).map((col) => {
                    const valor = Number(t[col]);
                    return (
                      <td key={col} className="px-3 py-2 text-center">
                        {valor > 0 ? (
                          <button
                            onClick={() => abrirDetalle(t.tipo_ayuda_id, t.tipo_ayuda_descripcion, col)}
                            className={`font-semibold hover:underline ${COLUMNA_CLASS[col]}`}
                          >
                            {valor}
                          </button>
                        ) : (
                          <span className="text-slate-300">0</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-3 py-2 text-right text-slate-600">
                    {t.costo_total != null ? `$${Number(t.costo_total).toLocaleString("es-CO")}` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200 font-semibold text-slate-800">
                <td className="py-2 pr-3">Total</td>
                {(["resueltas", "pendientes", "vencidas", "no_viables"] as Columna[]).map((col) => {
                  const valor = resumen.reduce((sum, t) => sum + Number(t[col]), 0);
                  return (
                    <td key={col} className="px-3 py-2 text-center">
                      {valor > 0 ? (
                        <button
                          onClick={() => abrirDetalle(null, "Todos los tipos", col)}
                          className={`font-semibold hover:underline ${COLUMNA_CLASS[col]}`}
                        >
                          {valor}
                        </button>
                      ) : (
                        <span className="text-slate-300">0</span>
                      )}
                    </td>
                  );
                })}
                <td className="px-3 py-2 text-right">
                  ${resumen.reduce((sum, t) => sum + (t.costo_total != null ? Number(t.costo_total) : 0), 0).toLocaleString("es-CO")}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </Modal>
  );
}
