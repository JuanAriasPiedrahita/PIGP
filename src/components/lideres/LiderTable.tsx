"use client";

import Link from "next/link";
import type { Lider } from "@/lib/types";
import { sexoTextClass } from "@/lib/sexoColor";

interface Props {
  lideres: (Lider & { total_referidos?: number })[];
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  selectedIds: Set<number>;
  onToggleSelect: (id: number) => void;
  onToggleSelectAll: () => void;
}

export function LiderTable({ lideres, onEdit, onDelete, selectedIds, onToggleSelect, onToggleSelectAll }: Props) {
  if (lideres.length === 0) {
    return <p className="py-10 text-center text-sm text-slate-400">No hay líderes registrados todavía.</p>;
  }

  const todosSeleccionados = lideres.length > 0 && lideres.every((l) => selectedIds.has(l.id));

  return (
    <div className="thin-scroll overflow-x-auto">
      <table className="w-full min-w-[880px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
            <th className="py-3 pl-2 pr-2 font-medium">
              <input
                type="checkbox"
                checked={todosSeleccionados}
                onChange={onToggleSelectAll}
                aria-label="Seleccionar todos"
                className="h-4 w-4 rounded border-slate-300"
              />
            </th>
            <th className="py-3 pr-3 font-medium">Líder</th>
            <th className="px-3 py-3 font-medium">Cédula</th>
            <th className="px-3 py-3 font-medium">Contacto</th>
            <th className="px-3 py-3 font-medium">Ubicación</th>
            <th className="px-3 py-3 font-medium">Votación</th>
            <th className="px-3 py-3 font-medium">Referidos</th>
            <th className="px-3 py-3 font-medium">Edad</th>
            <th className="py-3 pl-3 pr-2 text-right font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {lideres.map((l) => (
            <tr key={l.id} onClick={() => onEdit(l.id)} className="cursor-pointer hover:bg-slate-50">
              <td className="py-3 pl-2 pr-2" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={selectedIds.has(l.id)}
                  onChange={() => onToggleSelect(l.id)}
                  aria-label={`Seleccionar ${l.nombre} ${l.apellidos}`}
                  className="h-4 w-4 rounded border-slate-300"
                />
              </td>
              <td className="py-3 pr-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-slate-100">
                    {l.foto ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={l.foto} alt={l.nombre} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-slate-400">
                        {l.nombre[0]}
                        {l.apellidos[0]}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className={`truncate font-medium ${sexoTextClass(l.sexo)}`}>{l.nombre} {l.apellidos}</p>
                    {l.ocupacion_descripcion && <p className="truncate text-xs text-slate-400">{l.ocupacion_descripcion}</p>}
                    {l.contratista && <p className="truncate text-xs text-amber-600">Contratista</p>}
                  </div>
                </div>
              </td>
              <td className="px-3 py-3 text-slate-600">{l.cedula}</td>
              <td className="px-3 py-3 text-slate-600">
                <p>{l.celular}</p>
                {l.email && <p className="text-xs text-slate-400">{l.email}</p>}
              </td>
              <td className="px-3 py-3 text-slate-600">
                <p>{l.comuna_descripcion}</p>
                <p className="text-xs text-slate-400">{l.barrio_nombre}</p>
              </td>
              <td className="px-3 py-3 text-slate-600">
                Zona {l.zona_codigo}
                <p className="text-xs text-slate-400">{l.puesto_nombre}</p>
              </td>
              <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                <Link href={`/referidos?lider_id=${l.id}`} className="badge bg-brand-50 text-brand-700 hover:bg-brand-100">
                  {l.total_referidos ?? 0}
                </Link>
              </td>
              <td className="px-3 py-3 text-slate-600">{l.edad ?? "—"}</td>
              <td className="py-3 pl-3 pr-2">
                <div className="flex justify-end">
                  <button onClick={(e) => { e.stopPropagation(); onDelete(l.id); }} className="btn-ghost !px-2 !py-1 text-red-500 hover:bg-red-50" aria-label="Eliminar">
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
