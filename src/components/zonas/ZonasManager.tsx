"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPostJson, apiPutJson, apiDelete } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/Modal";
import type { Zona, Puesto } from "@/lib/types";

export function ZonasManager() {
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [puestos, setPuestos] = useState<Puesto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedZona, setSelectedZona] = useState<number | null>(null);

  const [zonaForm, setZonaForm] = useState({ id: 0, codigo: "", nombre: "" });
  const [zonaEditing, setZonaEditing] = useState(false);
  const [deleteZonaId, setDeleteZonaId] = useState<number | null>(null);

  const [puestoForm, setPuestoForm] = useState({ id: 0, numero: "", nombre: "", num_mesas: "1" });
  const [puestoEditing, setPuestoEditing] = useState(false);
  const [deletePuestoId, setDeletePuestoId] = useState<number | null>(null);

  const toast = useToast();

  async function loadAll() {
    setLoading(true);
    try {
      const [z, p] = await Promise.all([apiGet<Zona[]>("/api/zonas"), apiGet<Puesto[]>("/api/puestos")]);
      setZonas(z);
      setPuestos(p);
      if (!selectedZona && z.length) setSelectedZona(z[0].id);
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Error cargando zonas", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetZonaForm() {
    setZonaForm({ id: 0, codigo: "", nombre: "" });
    setZonaEditing(false);
  }

  async function submitZona(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[0-9]{2}$/.test(zonaForm.codigo)) {
      toast.show("El código de zona debe tener 2 dígitos, ej: 01", "error");
      return;
    }
    try {
      if (zonaForm.id) {
        await apiPutJson(`/api/zonas/${zonaForm.id}`, { codigo: zonaForm.codigo, nombre: zonaForm.nombre });
        toast.show("Zona actualizada", "success");
      } else {
        await apiPostJson("/api/zonas", { codigo: zonaForm.codigo, nombre: zonaForm.nombre });
        toast.show("Zona creada", "success");
      }
      resetZonaForm();
      loadAll();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Error al guardar la zona", "error");
    }
  }

  function editZona(z: Zona) {
    setZonaForm({ id: z.id, codigo: z.codigo, nombre: z.nombre || "" });
    setZonaEditing(true);
  }

  async function confirmDeleteZona() {
    if (deleteZonaId == null) return;
    try {
      await apiDelete(`/api/zonas/${deleteZonaId}`);
      toast.show("Zona eliminada", "success");
      setDeleteZonaId(null);
      if (selectedZona === deleteZonaId) setSelectedZona(null);
      loadAll();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Error al eliminar", "error");
    }
  }

  function resetPuestoForm() {
    setPuestoForm({ id: 0, numero: "", nombre: "", num_mesas: "1" });
    setPuestoEditing(false);
  }

  async function submitPuesto(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedZona) return;
    if (!/^[0-9]{2}$/.test(puestoForm.numero) || !puestoForm.nombre.trim()) {
      toast.show("Número (2 dígitos) y nombre del puesto son obligatorios", "error");
      return;
    }
    try {
      const payload = {
        zona_id: selectedZona,
        numero: puestoForm.numero,
        nombre: puestoForm.nombre.trim(),
        num_mesas: Number(puestoForm.num_mesas) || 1,
      };
      if (puestoForm.id) {
        await apiPutJson(`/api/puestos/${puestoForm.id}`, payload);
        toast.show("Puesto actualizado", "success");
      } else {
        await apiPostJson("/api/puestos", payload);
        toast.show("Puesto creado", "success");
      }
      resetPuestoForm();
      loadAll();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Error al guardar el puesto", "error");
    }
  }

  function editPuesto(p: Puesto) {
    setPuestoForm({ id: p.id, numero: p.numero, nombre: p.nombre, num_mesas: String(p.num_mesas) });
    setPuestoEditing(true);
  }

  async function confirmDeletePuesto() {
    if (deletePuestoId == null) return;
    try {
      await apiDelete(`/api/puestos/${deletePuestoId}`);
      toast.show("Puesto eliminado", "success");
      setDeletePuestoId(null);
      loadAll();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Error al eliminar", "error");
    }
  }

  const puestosDeZona = puestos.filter((p) => p.zona_id === selectedZona);
  const zonaSeleccionada = zonas.find((z) => z.id === selectedZona);

  if (loading) return <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />)}</div>;

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
      {/* Zonas */}
      <div className="card space-y-4 p-5 lg:col-span-2">
        <h3 className="text-sm font-semibold text-slate-700">Zonas</h3>
        <form onSubmit={submitZona} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <input
              value={zonaForm.codigo}
              onChange={(e) => setZonaForm((f) => ({ ...f, codigo: e.target.value }))}
              placeholder="Código (01)"
              maxLength={2}
              className="field-input"
            />
            <input
              value={zonaForm.nombre}
              onChange={(e) => setZonaForm((f) => ({ ...f, nombre: e.target.value }))}
              placeholder="Nombre (opcional)"
              className="field-input"
            />
          </div>
          <div className="flex gap-2">
            <button className="btn-primary flex-1">{zonaEditing ? "Guardar cambios" : "Agregar zona"}</button>
            {zonaEditing && <button type="button" className="btn-secondary" onClick={resetZonaForm}>Cancelar</button>}
          </div>
        </form>

        <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
          {zonas.map((z) => (
            <li
              key={z.id}
              onClick={() => setSelectedZona(z.id)}
              className={`flex cursor-pointer items-center justify-between px-4 py-2.5 text-sm ${
                selectedZona === z.id ? "bg-brand-50" : "hover:bg-slate-50"
              }`}
            >
              <span>
                <span className="font-mono font-semibold text-brand-700">{z.codigo}</span>{" "}
                <span className="text-slate-600">{z.nombre}</span>
              </span>
              <span className="flex gap-1">
                <button onClick={(e) => { e.stopPropagation(); editZona(z); }} className="btn-ghost !px-2 !py-1">Editar</button>
                <button onClick={(e) => { e.stopPropagation(); setDeleteZonaId(z.id); }} className="btn-ghost !px-2 !py-1 text-red-500 hover:bg-red-50">Eliminar</button>
              </span>
            </li>
          ))}
          {zonas.length === 0 && <li className="px-4 py-6 text-center text-sm text-slate-400">Sin zonas registradas.</li>}
        </ul>
      </div>

      {/* Puestos de la zona seleccionada */}
      <div className="card space-y-4 p-5 lg:col-span-3">
        <h3 className="text-sm font-semibold text-slate-700">
          Puestos de votación {zonaSeleccionada ? `· Zona ${zonaSeleccionada.codigo}` : ""}
        </h3>
        {!selectedZona ? (
          <p className="text-sm text-slate-400">Seleccione una zona para ver sus puestos.</p>
        ) : (
          <>
            <form onSubmit={submitPuesto} className="grid grid-cols-1 gap-2 sm:grid-cols-4">
              <input
                value={puestoForm.numero}
                onChange={(e) => setPuestoForm((f) => ({ ...f, numero: e.target.value }))}
                placeholder="No. (01)"
                maxLength={2}
                className="field-input"
              />
              <input
                value={puestoForm.nombre}
                onChange={(e) => setPuestoForm((f) => ({ ...f, nombre: e.target.value }))}
                placeholder="Nombre del puesto"
                className="field-input sm:col-span-2"
              />
              <input
                type="number"
                min={1}
                value={puestoForm.num_mesas}
                onChange={(e) => setPuestoForm((f) => ({ ...f, num_mesas: e.target.value }))}
                placeholder="Mesas"
                className="field-input"
              />
              <div className="flex gap-2 sm:col-span-4">
                <button className="btn-primary">{puestoEditing ? "Guardar cambios" : "Agregar puesto"}</button>
                {puestoEditing && <button type="button" className="btn-secondary" onClick={resetPuestoForm}>Cancelar</button>}
              </div>
            </form>

            <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
              {puestosDeZona.map((p) => (
                <li key={p.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <span>
                    <span className="font-mono font-semibold text-brand-700">{p.numero}</span>{" "}
                    <span className="text-slate-700">{p.nombre}</span>{" "}
                    <span className="text-xs text-slate-400">({p.num_mesas} mesas)</span>
                  </span>
                  <span className="flex gap-1">
                    <button onClick={() => editPuesto(p)} className="btn-ghost !px-2 !py-1">Editar</button>
                    <button onClick={() => setDeletePuestoId(p.id)} className="btn-ghost !px-2 !py-1 text-red-500 hover:bg-red-50">Eliminar</button>
                  </span>
                </li>
              ))}
              {puestosDeZona.length === 0 && <li className="px-4 py-6 text-center text-sm text-slate-400">Esta zona aún no tiene puestos.</li>}
            </ul>
          </>
        )}
      </div>

      <ConfirmDialog
        open={deleteZonaId != null}
        title="Eliminar zona"
        message="Se eliminarán también todos sus puestos de votación. ¿Desea continuar?"
        confirmLabel="Eliminar"
        danger
        onConfirm={confirmDeleteZona}
        onCancel={() => setDeleteZonaId(null)}
      />
      <ConfirmDialog
        open={deletePuestoId != null}
        title="Eliminar puesto"
        message="¿Está seguro de eliminar este puesto de votación?"
        confirmLabel="Eliminar"
        danger
        onConfirm={confirmDeletePuesto}
        onCancel={() => setDeletePuestoId(null)}
      />
    </div>
  );
}
