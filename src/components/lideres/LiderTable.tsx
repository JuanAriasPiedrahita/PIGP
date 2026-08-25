"use client";

import type { Lider } from "@/lib/types";

interface Props {
  lideres: (Lider & { total_referidos?: number })[];
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

export function LiderTable({ lideres, onEdit, onDelete }: Props) {
  if (lideres.length === 0) {
    return <p className="py-10 text-center text-sm text-slate-400">No hay líderes registrados todavía.</p>;
  }

  return (
    <div className="thin-scroll overflow-x-auto">
      <table className="w-full min-w-[880px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
            <th className="py-3 pl-2 pr-3 font-medium">Líder</th>
            <th className="px-3 py-3 font-medium">Cédula</th>
            <th className="px-3 py-3 font-medium">Contacto</th>
            <th className="px-3 py-3 font-medium">Ubicación</th>
            <th className="px-3 py-3 font-medium">Votación</th>
            <th className="px-3 py-3 font-medium">Referidos</th>
            <th className="px-3 py-3 font-medium">Estado</th>
            <th className="py-3 pl-3 pr-2 text-right font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {lideres.map((l) => (
            <tr key={l.id} className="hover:bg-slate-50">
              <td className="py-3 pl-2 pr-3">
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
                    <p className="truncate font-medium text-slate-800">{l.nombre} {l.apellidos}</p>
                    <p className="truncate text-xs text-slate-400">{l.usuario}</p>
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
              <td className="px-3 py-3">
                <span className="badge bg-brand-50 text-brand-700">{l.total_referidos ?? 0}</span>
              </td>
              <td className="px-3 py-3">
                <span className={`badge ${l.estado === "ACTIVO" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                  {l.estado === "ACTIVO" ? "Activo" : "Inactivo"}
                </span>
              </td>
              <td className="py-3 pl-3 pr-2">
                <div className="flex justify-end gap-1">
                  <button onClick={() => onEdit(l.id)} className="btn-ghost !px-2 !py-1" aria-label="Editar">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="17" height="17">
                      <path d="M12 20h9" strokeLinecap="round" />
                      <path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <button onClick={() => onDelete(l.id)} className="btn-ghost !px-2 !py-1 text-red-500 hover:bg-red-50" aria-label="Eliminar">
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
