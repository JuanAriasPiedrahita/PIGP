"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiGet } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import type { Referido, ReferidoConGestiones } from "@/lib/types";

function formatFecha(fecha: string | null): string {
  if (!fecha) return "—";
  return fecha.slice(0, 10);
}

function esVencida(fecha: string | null): boolean {
  if (!fecha) return false;
  return new Date(fecha) < new Date(new Date().toDateString());
}

export default function GestionesPage() {
  const router = useRouter();
  const toast = useToast();

  const [filas, setFilas] = useState<ReferidoConGestiones[]>([]);
  const [loading, setLoading] = useState(true);

  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState<Referido[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [mostrarResultados, setMostrarResultados] = useState(false);

  useEffect(() => {
    apiGet<ReferidoConGestiones[]>("/api/gestiones/referidos")
      .then(setFilas)
      .catch((err) => toast.show(err instanceof Error ? err.message : "Error cargando gestiones", "error"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!busqueda.trim()) {
      setResultados([]);
      return;
    }
    setBuscando(true);
    const t = setTimeout(() => {
      apiGet<Referido[]>(`/api/referidos?q=${encodeURIComponent(busqueda)}`)
        .then((data) => {
          setResultados(data);
          setMostrarResultados(true);
        })
        .catch(() => setResultados([]))
        .finally(() => setBuscando(false));
    }, 300);
    return () => clearTimeout(t);
  }, [busqueda]);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Gestiones</h2>
        <p className="text-sm text-slate-500">Seguimiento de ayudas y favores solicitados por los referidos.</p>
      </div>

      <div className="card relative p-4">
        <label className="field-label">Buscar referido para agregar una gestión</label>
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          onFocus={() => setMostrarResultados(true)}
          placeholder="Escribe el nombre, apellido o cédula del referido..."
          className="field-input max-w-md"
        />
        {mostrarResultados && busqueda.trim() && (
          <div className="absolute z-10 mt-1 max-h-72 w-full max-w-md overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
            {buscando ? (
              <p className="px-4 py-3 text-sm text-slate-400">Buscando...</p>
            ) : resultados.length === 0 ? (
              <p className="px-4 py-3 text-sm text-slate-400">Sin resultados.</p>
            ) : (
              resultados.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => router.push(`/gestiones/${r.id}`)}
                  className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-slate-50"
                >
                  <span>
                    <span className="font-medium text-slate-800">{r.nombre} {r.apellidos}</span>{" "}
                    <span className="text-xs text-slate-400">C.C. {r.cedula}</span>
                  </span>
                  <span className="text-xs text-slate-400">{r.barrio_nombre}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <div className="card p-4" onClick={() => setMostrarResultados(false)}>
        <h3 className="mb-3 text-sm font-semibold text-slate-700">Referidos con gestiones registradas</h3>
        {loading ? (
          <div className="space-y-2 py-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />)}
          </div>
        ) : filas.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-400">Aún no hay gestiones registradas. Usa el buscador de arriba para agregar la primera.</p>
        ) : (
          <div className="thin-scroll overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                  <th className="py-3 pl-2 pr-3 font-medium">Nombre</th>
                  <th className="px-3 py-3 font-medium">Próxima fecha</th>
                  <th className="px-3 py-3 font-medium">Total</th>
                  <th className="px-3 py-3 font-medium">Pendientes</th>
                  <th className="px-3 py-3 font-medium">No viables</th>
                  <th className="px-3 py-3 font-medium">Resueltas</th>
                  <th className="px-3 py-3 font-medium">Vencidas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filas.map((f) => (
                  <tr
                    key={f.id}
                    onClick={() => router.push(`/gestiones/${f.id}`)}
                    className="cursor-pointer hover:bg-slate-50"
                  >
                    <td className="py-3 pl-2 pr-3 font-medium text-slate-800">{f.nombre} {f.apellidos}</td>
                    <td className="px-3 py-3">
                      <span className={esVencida(f.proxima_fecha) ? "font-medium text-red-600" : "text-slate-600"}>
                        {formatFecha(f.proxima_fecha)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-slate-600">{f.total}</td>
                    <td className="px-3 py-3">
                      {f.pendientes > 0 ? <span className="badge bg-amber-50 text-amber-700">{f.pendientes}</span> : "—"}
                    </td>
                    <td className="px-3 py-3">
                      {f.no_viables > 0 ? <span className="badge bg-slate-100 text-slate-500">{f.no_viables}</span> : "—"}
                    </td>
                    <td className="px-3 py-3">
                      {f.resueltas > 0 ? <span className="badge bg-emerald-50 text-emerald-700">{f.resueltas}</span> : "—"}
                    </td>
                    <td className="px-3 py-3">
                      {f.vencidas > 0 ? <span className="badge bg-red-50 text-red-600">{f.vencidas}</span> : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
