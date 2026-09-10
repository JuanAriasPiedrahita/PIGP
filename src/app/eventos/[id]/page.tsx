"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { apiGet, apiPostJson, apiDelete } from "@/lib/api";
import { EventoForm } from "@/components/eventos/EventoForm";
import { ConfirmDialog } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import type { Evento, EventoAsistente, Referido } from "@/lib/types";

function formatFechaHora(fecha: string): string {
  return fecha.slice(0, 16).replace("T", " ");
}

export default function EventoDetallePage() {
  const params = useParams<{ id: string }>();
  const eventoId = Number(params.id);
  const toast = useToast();

  const [evento, setEvento] = useState<Evento | null>(null);
  const [asistentes, setAsistentes] = useState<EventoAsistente[]>([]);
  const [loadingAsistentes, setLoadingAsistentes] = useState(true);
  const [quitarId, setQuitarId] = useState<number | null>(null);

  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState<Referido[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const [agregando, setAgregando] = useState(false);

  useEffect(() => {
    apiGet<Evento>(`/api/eventos/${eventoId}`)
      .then(setEvento)
      .catch((err) => toast.show(err instanceof Error ? err.message : "Error cargando el evento", "error"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventoId]);

  const loadAsistentes = useCallback(async () => {
    setLoadingAsistentes(true);
    try {
      setAsistentes(await apiGet<EventoAsistente[]>(`/api/eventos/${eventoId}/asistentes`));
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Error cargando asistentes", "error");
    } finally {
      setLoadingAsistentes(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventoId]);

  useEffect(() => {
    loadAsistentes();
  }, [loadAsistentes]);

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

  async function agregarAsistente(referidoId: number) {
    setAgregando(true);
    try {
      await apiPostJson(`/api/eventos/${eventoId}/asistentes`, { referido_id: referidoId });
      toast.show("Asistente registrado", "success");
      setBusqueda("");
      setResultados([]);
      setMostrarResultados(false);
      loadAsistentes();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Error al registrar la asistencia", "error");
    } finally {
      setAgregando(false);
    }
  }

  async function confirmQuitar() {
    if (quitarId == null) return;
    try {
      await apiDelete(`/api/eventos/${eventoId}/asistentes/${quitarId}`);
      toast.show("Asistente quitado", "success");
      setQuitarId(null);
      loadAsistentes();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Error al quitar el asistente", "error");
    }
  }

  const yaRegistrados = new Set(asistentes.map((a) => a.referido_id));

  return (
    <div className="space-y-5">
      <div>
        <Link href="/eventos" className="text-sm text-brand-700 hover:underline">← Volver a Eventos</Link>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-slate-900">{evento ? evento.nombre : "Cargando..."}</h2>
        {evento && <p className="text-sm text-slate-500">{evento.ubicacion}</p>}
      </div>

      <div className="card p-5">
        <h3 className="mb-4 text-sm font-semibold text-slate-700">Datos del evento</h3>
        {evento ? (
          <EventoForm eventoId={eventoId} onSaved={(id) => apiGet<Evento>(`/api/eventos/${id}`).then(setEvento)} />
        ) : (
          <p className="py-6 text-center text-sm text-slate-400">Cargando...</p>
        )}
      </div>

      <div className="card relative p-4">
        <label className="field-label">Registrar asistente (buscar por nombre o cédula)</label>
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          onFocus={() => setMostrarResultados(true)}
          placeholder="Escribe el nombre, apellido o cédula del referido..."
          className="field-input max-w-md"
          disabled={agregando}
        />
        {mostrarResultados && busqueda.trim() && (
          <div className="absolute z-10 mt-1 max-h-72 w-full max-w-md overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
            {buscando ? (
              <p className="px-4 py-3 text-sm text-slate-400">Buscando...</p>
            ) : resultados.length === 0 ? (
              <p className="px-4 py-3 text-sm text-slate-400">Sin resultados.</p>
            ) : (
              resultados.map((r) => {
                const yaAsiste = yaRegistrados.has(r.id);
                return (
                  <button
                    key={r.id}
                    type="button"
                    disabled={yaAsiste || agregando}
                    onClick={() => agregarAsistente(r.id)}
                    className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span>
                      <span className="font-medium text-slate-800">{r.nombre} {r.apellidos}</span>{" "}
                      <span className="text-xs text-slate-400">C.C. {r.cedula}</span>
                    </span>
                    <span className="text-xs text-slate-400">{yaAsiste ? "Ya registrado" : r.barrio_nombre}</span>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

      <div className="card p-4" onClick={() => setMostrarResultados(false)}>
        <h3 className="mb-3 text-sm font-semibold text-slate-700">
          Asistentes registrados {asistentes.length > 0 && `(${asistentes.length})`}
        </h3>
        {loadingAsistentes ? (
          <div className="space-y-2 py-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />)}
          </div>
        ) : asistentes.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">Aún no hay asistentes registrados. Usa el buscador de arriba.</p>
        ) : (
          <div className="thin-scroll overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                  <th className="py-3 pl-2 pr-3 font-medium">Nombre</th>
                  <th className="px-3 py-3 font-medium">Cédula</th>
                  <th className="px-3 py-3 font-medium">Celular</th>
                  <th className="px-3 py-3 font-medium">Registrado</th>
                  <th className="py-3 pl-3 pr-2 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {asistentes.map((a) => (
                  <tr key={a.id}>
                    <td className="py-3 pl-2 pr-3 font-medium text-slate-800">{a.referido_nombre} {a.referido_apellidos}</td>
                    <td className="px-3 py-3 text-slate-600">{a.referido_cedula}</td>
                    <td className="px-3 py-3 text-slate-600">{a.referido_celular}</td>
                    <td className="px-3 py-3 text-slate-600">{a.created_at ? formatFechaHora(a.created_at) : "—"}</td>
                    <td className="py-3 pl-3 pr-2">
                      <div className="flex justify-end">
                        <button
                          onClick={() => setQuitarId(a.id)}
                          className="btn-ghost !px-2 !py-1 text-red-500 hover:bg-red-50"
                          aria-label="Quitar asistente"
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
        )}
      </div>

      <ConfirmDialog
        open={quitarId != null}
        title="Quitar asistente"
        message="¿Está seguro de quitar a esta persona de la lista de asistentes?"
        confirmLabel="Quitar"
        danger
        onConfirm={confirmQuitar}
        onCancel={() => setQuitarId(null)}
      />
    </div>
  );
}
