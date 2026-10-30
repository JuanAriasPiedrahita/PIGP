"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { apiGet } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import type { CatalogoDetalleFila } from "@/lib/types";

export type CatalogoDetalleTipo = "profesion" | "ocupacion" | "parentesco" | "dependencia";

export interface CatalogoDetalleSeleccion {
  tipo: CatalogoDetalleTipo;
  id: number;
  nombre: string;
}

interface Props {
  seleccion: CatalogoDetalleSeleccion | null;
  onClose: () => void;
}

const TITULO: Record<CatalogoDetalleTipo, (nombre: string) => string> = {
  profesion: (nombre) => `Líderes con profesión: ${nombre}`,
  ocupacion: (nombre) => `Líderes con ocupación: ${nombre}`,
  parentesco: (nombre) => `Referidos con parentesco: ${nombre}`,
  dependencia: (nombre) => `Contratistas en dependencia: ${nombre}`,
};

/**
 * Modal de reloj de Configuración → Profesiones/Ocupaciones/Parentescos/
 * Dependencias: lista las personas detrás del total que ya se ve en esas
 * pestañas (líderes o referidos, según el tipo).
 */
export function CatalogoDetalleModal({ seleccion, onClose }: Props) {
  const [filas, setFilas] = useState<CatalogoDetalleFila[]>([]);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (!seleccion) {
      setFilas([]);
      return;
    }
    setLoading(true);
    apiGet<CatalogoDetalleFila[]>(`/api/configuracion/catalogo-detalle?tipo=${seleccion.tipo}&id=${seleccion.id}`)
      .then(setFilas)
      .catch((err) => toast.show(err instanceof Error ? err.message : "Error cargando el detalle", "error"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seleccion]);

  const titulo = seleccion ? TITULO[seleccion.tipo](seleccion.nombre) : "Detalle";

  return (
    <Modal open={!!seleccion} onClose={onClose} title={titulo} widthClass="max-w-lg">
      {loading ? (
        <div className="space-y-2 py-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />)}
        </div>
      ) : filas.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-400">No hay nadie en esta categoría todavía.</p>
      ) : (
        <div className="thin-scroll overflow-x-auto">
          <table className="w-full min-w-[420px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                <th className="py-2 pr-3 font-medium">Nombre</th>
                <th className="px-3 py-2 font-medium">Cédula</th>
                <th className="px-3 py-2 font-medium">Celular</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filas.map((f) => (
                <tr key={f.id}>
                  <td className="py-2 pr-3">
                    <p className="font-medium text-slate-800">{f.nombre} {f.apellidos}</p>
                    {f.lider_nombre && (
                      <p className="text-xs text-slate-400">Líder: {f.lider_nombre} {f.lider_apellidos}</p>
                    )}
                  </td>
                  <td className="px-3 py-2 text-slate-600">{f.cedula}</td>
                  <td className="px-3 py-2 text-slate-600">{f.celular}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200 font-semibold text-slate-800">
                <td className="py-2 pr-3" colSpan={3}>Total: {filas.length}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </Modal>
  );
}
