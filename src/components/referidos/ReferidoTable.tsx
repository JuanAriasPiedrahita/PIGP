"use client";

import type { Referido } from "@/lib/types";

interface Props {
  referidos: Referido[];
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

export function ReferidoTable({ referidos, onEdit, onDelete }: Props) {
  if (referidos.length === 0) {
    return <p className="py-10 text-center text-sm text-slate-400">No hay referidos registrados con los filtros actuales.</p>;
  }

  return (
    <div className="thin-scroll overflow-x-auto">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
            <th className="py-3 pl-2 pr-3 font-medium">Referido</th>
            <th className="px-3 py-3 font-medium">Cédula</th>
            <th className="px-3 py-3 font-medium">Líder</th>
            <th className="px-3 py-3 font-medium">Parentesco</th>
            <th className="px-3 py-3 font-medium">Ubicación</th>
            <th className="px-3 py-3 font-medium">Votación</th>
            <th className="px-3 py-3 font-medium">Estado</th>
            <th className="py-3 pl-3 pr-2 text-right font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {referidos.map((r) => (
            <tr key={r.id} className="hover:bg-slate-50">
              <td className="py-3 pl-2 pr-3">
                <p className="font-medium text-slate-800">{r.nombre} {r.apellidos}</p>
                <p className="text-xs text-slate-400">{r.celular}</p>
              </td>
              <td className="px-3 py-3 text-slate-600">{r.cedula}</td>
              <td className="px-3 py-3 text-slate-600">{r.lider_nombre}</td>
              <td className="px-3 py-3 text-slate-600">{r.parentesco_descripcion}</td>
              <td className="px-3 py-3 text-slate-600">
                <p>{r.barrio_nombre}</p>
                <p className="text-xs text-slate-400">Zona {r.zona_codigo} · {r.puesto_nombre}</p>
              </td>
              <td className="px-3 py-3">
                <span className={`badge ${r.voto_anterior ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                  {r.voto_anterior ? "Votó" : "No votó"}
                </span>
              </td>
              <td className="px-3 py-3">
                {r.damnificado_terremoto ? (
                  <span className="badge bg-amber-50 text-amber-700">Damnificado</span>
                ) : (
                  <span className="text-xs text-slate-300">—</span>
                )}
              </td>
              <td className="py-3 pl-3 pr-2">
                <div className="flex justify-end gap-1">
                  <button onClick={() => onEdit(r.id)} className="btn-ghost !px-2 !py-1" aria-label="Editar">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="17" height="17">
                      <path d="M12 20h9" strokeLinecap="round" />
                      <path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <button onClick={() => onDelete(r.id)} className="btn-ghost !px-2 !py-1 text-red-500 hover:bg-red-50" aria-label="Eliminar">
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
