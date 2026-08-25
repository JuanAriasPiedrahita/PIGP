"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPostJson, apiPutJson, apiDelete } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/Modal";
import type { Comuna, Barrio } from "@/lib/types";

export function ComunasManager() {
  const [comunas, setComunas] = useState<Comuna[]>([]);
  const [barrios, setBarrios] = useState<Barrio[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComuna, setSelectedComuna] = useState<number | null>(null);

  const [comunaForm, setComunaForm] = useState({ id: 0, descripcion: "" });
  const [comunaEditing, setComunaEditing] = useState(false);
  const [deleteComunaId, setDeleteComunaId] = useState<number | null>(null);

  const [barrioForm, setBarrioForm] = useState({ id: 0, nombre: "" });
  const [barrioEditing, setBarrioEditing] = useState(false);
  const [deleteBarrioId, setDeleteBarrioId] = useState<number | null>(null);

  const toast = useToast();

  async function loadAll() {
    setLoading(true);
    try {
      const [c, b] = await Promise.all([apiGet<Comuna[]>("/api/comunas"), apiGet<Barrio[]>("/api/barrios")]);
      setComunas(c);
      setBarrios(b);
      if (!selectedComuna && c.length) setSelectedComuna(c[0].id);
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Error cargando comunas", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetComunaForm() {
    setComunaForm({ id: 0, descripcion: "" });
    setComunaEditing(false);
  }

  async function submitComuna(e: React.FormEvent) {
    e.preventDefault();
    if (!comunaForm.descripcion.trim()) {
      toast.show("La descripción de la comuna es obligatoria", "error");
      return;
    }
    try {
      if (comunaForm.id) {
        await apiPutJson(`/api/comunas/${comunaForm.id}`, { descripcion: comunaForm.descripcion });
        toast.show("Comuna actualizada", "success");
      } else {
        await apiPostJson("/api/comunas", { descripcion: comunaForm.descripcion });
        toast.show("Comuna creada", "success");
      }
      resetComunaForm();
      loadAll();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Error al guardar la comuna", "error");
    }
  }

  function editComuna(c: Comuna) {
    setComunaForm({ id: c.id, descripcion: c.descripcion });
    setComunaEditing(true);
  }

  async function confirmDeleteComuna() {
    if (deleteComunaId == null) return;
    try {
      await apiDelete(`/api/comunas/${deleteComunaId}`);
      toast.show("Comuna eliminada", "success");
      setDeleteComunaId(null);
      if (selectedComuna === deleteComunaId) setSelectedComuna(null);
      loadAll();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Error al eliminar", "error");
    }
  }

  function resetBarrioForm() {
    setBarrioForm({ id: 0, nombre: "" });
    setBarrioEditing(false);
  }

  async function submitBarrio(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedComuna || !barrioForm.nombre.trim()) {
      toast.show("El nombre del barrio es obligatorio", "error");
      return;
    }
    try {
      const payload = { comuna_id: selectedComuna, nombre: barrioForm.nombre.trim() };
      if (barrioForm.id) {
        await apiPutJson(`/api/barrios/${barrioForm.id}`, payload);
        toast.show("Barrio actualizado", "success");
      } else {
        await apiPostJson("/api/barrios", payload);
        toast.show("Barrio creado", "success");
      }
      resetBarrioForm();
      loadAll();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Error al guardar el barrio", "error");
    }
  }

  function editBarrio(b: Barrio) {
    setBarrioForm({ id: b.id, nombre: b.nombre });
    setBarrioEditing(true);
  }

  async function confirmDeleteBarrio() {
    if (deleteBarrioId == null) return;
    try {
      await apiDelete(`/api/barrios/${deleteBarrioId}`);
      toast.show("Barrio eliminado", "success");
      setDeleteBarrioId(null);
      loadAll();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Error al eliminar", "error");
    }
  }

  const barriosDeComuna = barrios.filter((b) => b.comuna_id === selectedComuna);
  const comunaSeleccionada = comunas.find((c) => c.id === selectedComuna);

  if (loading) return <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />)}</div>;

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
      {/* Comunas */}
      <div className="card space-y-4 p-5 lg:col-span-2">
        <h3 className="text-sm font-semibold text-slate-700">Comunas</h3>
        <form onSubmit={submitComuna} className="space-y-3">
          <input
            value={comunaForm.descripcion}
            onChange={(e) => setComunaForm((f) => ({ ...f, descripcion: e.target.value }))}
            placeholder="Descripción de la comuna"
            className="field-input"
          />
          <div className="flex gap-2">
            <button className="btn-primary flex-1">{comunaEditing ? "Guardar cambios" : "Agregar comuna"}</button>
            {comunaEditing && <button type="button" className="btn-secondary" onClick={resetComunaForm}>Cancelar</button>}
          </div>
        </form>

        <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
          {comunas.map((c) => (
            <li
              key={c.id}
              onClick={() => setSelectedComuna(c.id)}
              className={`flex cursor-pointer items-center justify-between px-4 py-2.5 text-sm ${
                selectedComuna === c.id ? "bg-brand-50" : "hover:bg-slate-50"
              }`}
            >
              <span className="text-slate-700">{c.descripcion}</span>
              <span className="flex gap-1">
                <button onClick={(e) => { e.stopPropagation(); editComuna(c); }} className="btn-ghost !px-2 !py-1">Editar</button>
                <button onClick={(e) => { e.stopPropagation(); setDeleteComunaId(c.id); }} className="btn-ghost !px-2 !py-1 text-red-500 hover:bg-red-50">Eliminar</button>
              </span>
            </li>
          ))}
          {comunas.length === 0 && <li className="px-4 py-6 text-center text-sm text-slate-400">Sin comunas registradas.</li>}
        </ul>
      </div>

      {/* Barrios de la comuna seleccionada */}
      <div className="card space-y-4 p-5 lg:col-span-3">
        <h3 className="text-sm font-semibold text-slate-700">
          Barrios {comunaSeleccionada ? `· ${comunaSeleccionada.descripcion}` : ""}
        </h3>
        {!selectedComuna ? (
          <p className="text-sm text-slate-400">Seleccione una comuna para ver sus barrios.</p>
        ) : (
          <>
            <form onSubmit={submitBarrio} className="flex gap-2">
              <input
                value={barrioForm.nombre}
                onChange={(e) => setBarrioForm((f) => ({ ...f, nombre: e.target.value }))}
                placeholder="Nombre del barrio"
                className="field-input"
              />
              <button className="btn-primary shrink-0">{barrioEditing ? "Guardar cambios" : "Agregar barrio"}</button>
              {barrioEditing && <button type="button" className="btn-secondary shrink-0" onClick={resetBarrioForm}>Cancelar</button>}
            </form>

            <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
              {barriosDeComuna.map((b) => (
                <li key={b.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <span className="text-slate-700">{b.nombre}</span>
                  <span className="flex gap-1">
                    <button onClick={() => editBarrio(b)} className="btn-ghost !px-2 !py-1">Editar</button>
                    <button onClick={() => setDeleteBarrioId(b.id)} className="btn-ghost !px-2 !py-1 text-red-500 hover:bg-red-50">Eliminar</button>
                  </span>
                </li>
              ))}
              {barriosDeComuna.length === 0 && <li className="px-4 py-6 text-center text-sm text-slate-400">Esta comuna aún no tiene barrios.</li>}
            </ul>
          </>
        )}
      </div>

      <ConfirmDialog
        open={deleteComunaId != null}
        title="Eliminar comuna"
        message="Se eliminarán también todos sus barrios. ¿Desea continuar?"
        confirmLabel="Eliminar"
        danger
        onConfirm={confirmDeleteComuna}
        onCancel={() => setDeleteComunaId(null)}
      />
      <ConfirmDialog
        open={deleteBarrioId != null}
        title="Eliminar barrio"
        message="¿Está seguro de eliminar este barrio?"
        confirmLabel="Eliminar"
        danger
        onConfirm={confirmDeleteBarrio}
        onCancel={() => setDeleteBarrioId(null)}
      />
    </div>
  );
}
