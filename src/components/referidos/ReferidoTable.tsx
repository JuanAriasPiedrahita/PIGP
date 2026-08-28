"use client";

import type { Referido } from "@/lib/types";
import { sexoTextClass } from "@/lib/sexoColor";

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
            <th className="px-3 py-3 font-medium">Edad</th>
            <th className="py-3 pl-3 pr-2 text-right font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {referidos.map((r) => (
            <tr key={r.id} onClick={() => onEdit(r.id)} className="cursor-pointer hover:bg-slate-50">
              <td className="py-3 pl-2 pr-3">
                <p className={`font-medium ${sexoTextClass(r.sexo)}`}>{r.nombre} {r.apellidos}</p>
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
              <td className="px-3 py-3 text-slate-600">{r.edad ?? "—"}</td>
              <td className="py-3 pl-3 pr-2">
                <div className="flex justify-end">
                  <button onClick={(e) => { e.stopPropagation(); onDelete(r.id); }} className="btn-ghost !px-2 !py-1 text-red-500 hover:bg-red-50" aria-label="Eliminar">
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
