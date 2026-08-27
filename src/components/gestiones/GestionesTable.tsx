"use client";

import type { Gestion } from "@/lib/types";

interface Props {
  gestiones: Gestion[];
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
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

function estaVencida(g: Gestion): boolean {
  if (g.estado !== "PENDIENTE") return false;
  return new Date(g.fecha_limite) < new Date(new Date().toDateString());
}

export function GestionesTable({ gestiones, onEdit, onDelete }: Props) {
  if (gestiones.length === 0) {
    return <p className="py-10 text-center text-sm text-slate-400">Este referido aún no tiene gestiones registradas.</p>;
  }

  return (
    <div className="thin-scroll overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
            <th className="py-3 pl-2 pr-3 font-medium">Tipo de ayuda</th>
            <th className="px-3 py-3 font-medium">Responsable</th>
            <th className="px-3 py-3 font-medium">Fecha límite</th>
            <th className="px-3 py-3 font-medium">Estado</th>
            <th className="px-3 py-3 font-medium">Costo</th>
            <th className="py-3 pl-3 pr-2 text-right font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {gestiones.map((g) => (
            <tr key={g.id} onClick={() => onEdit(g.id)} className="cursor-pointer hover:bg-slate-50">
              <td className="py-3 pl-2 pr-3 font-medium text-slate-800">{g.tipo_ayuda_descripcion}</td>
              <td className="px-3 py-3 text-slate-600">{g.gestor_nombre}</td>
              <td className="px-3 py-3 text-slate-600">
                {g.fecha_limite?.slice(0, 10)}
                {estaVencida(g) && <span className="ml-2 badge bg-red-50 text-red-600">Vencida</span>}
              </td>
              <td className="px-3 py-3">
                <span className={`badge ${ESTADO_BADGE[g.estado]}`}>{ESTADO_LABEL[g.estado]}</span>
              </td>
              <td className="px-3 py-3 text-slate-600">
                {g.costo != null ? `$${Number(g.costo).toLocaleString("es-CO")}` : "—"}
              </td>
              <td className="py-3 pl-3 pr-2">
                <div className="flex justify-end">
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(g.id); }}
                    className="btn-ghost !px-2 !py-1 text-red-500 hover:bg-red-50"
                    aria-label="Eliminar"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="17" height="17">
                      <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
