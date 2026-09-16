"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPostJson, apiPutJson, apiDelete } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/Modal";
import { GestionesTerritorioModal, type TerritorioSeleccionado } from "@/components/comunas/GestionesTerritorioModal";

interface Item {
  id: number;
  descripcion: string;
  /** Solo vienen pobladas cuando conGestiones=true (tipos de ayuda). */
  resueltas?: number;
  pendientes?: number;
}

interface Props {
  endpoint: string; // ej: /api/profesiones
  singular: string; // ej: "profesión"
  placeholder: string;
  /** Si es true (solo para Tipos de ayuda), agrega el ícono de reloj que abre el reporte de gestiones de ese tipo. */
  conGestiones?: boolean;
}

function IconoReloj() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="15" height="15">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** CRUD genérico para catálogos de una sola columna (profesiones, ocupaciones, parentescos). */
export function SimpleCatalogManager({ endpoint, singular, placeholder, conGestiones }: Props) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [newValue, setNewValue] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [territorio, setTerritorio] = useState<TerritorioSeleccionado | null>(null);
  const toast = useToast();

  async function load() {
    setLoading(true);
    try {
      const data = await apiGet<Item[]>(endpoint);
      setItems(data);
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Error cargando datos", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newValue.trim()) return;
    setSaving(true);
    try {
      await apiPostJson(endpoint, { descripcion: newValue.trim() });
      setNewValue("");
      toast.show(`${singular} agregada`, "success");
      load();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Error al guardar", "error");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(item: Item) {
    setEditingId(item.id);
    setEditingValue(item.descripcion);
  }

  async function saveEdit(id: number) {
    if (!editingValue.trim()) return;
    try {
      await apiPutJson(`${endpoint}/${id}`, { descripcion: editingValue.trim() });
      setEditingId(null);
      toast.show(`${singular} actualizada`, "success");
      load();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Error al actualizar", "error");
    }
  }

  async function confirmDelete() {
    if (deleteId == null) return;
    try {
      await apiDelete(`${endpoint}/${deleteId}`);
      toast.show(`${singular} eliminada`, "success");
      setDeleteId(null);
      load();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Error al eliminar", "error");
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleCreate} className="flex gap-2">
        <input
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          placeholder={placeholder}
          className="field-input"
        />
        <button className="btn-primary shrink-0" disabled={saving || !newValue.trim()}>
          Agregar
        </button>
      </form>

      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />)}</div>
      ) : items.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400">Aún no hay registros.</p>
      ) : conGestiones ? (
        <div className="thin-scroll overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                <th className="px-4 py-2 font-medium">Tipo de ayuda</th>
                <th className="px-3 py-2 text-center font-medium">Resueltas</th>
                <th className="px-3 py-2 text-center font-medium">Pendientes</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-2.5">
                    {editingId === item.id ? (
                      <input
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        className="field-input"
                        autoFocus
                        onKeyDown={(e) => e.key === "Enter" && saveEdit(item.id)}
                      />
                    ) : (
                      <span className="text-sm text-slate-700">{item.descripcion}</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-center text-sm font-medium text-emerald-700">{item.resueltas ?? 0}</td>
                  <td className="px-3 py-2.5 text-center text-sm font-medium text-amber-700">{item.pendientes ?? 0}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex shrink-0 justify-end gap-1">
                      {editingId === item.id ? (
                        <>
                          <button className="btn-ghost !px-2 !py-1 text-emerald-600" onClick={() => saveEdit(item.id)}>Guardar</button>
                          <button className="btn-ghost !px-2 !py-1" onClick={() => setEditingId(null)}>Cancelar</button>
                        </>
                      ) : (
                        <>
                          <button
                            className="btn-ghost !px-2 !py-1 text-slate-500 hover:bg-slate-100"
                            onClick={() => setTerritorio({ tipo: "tipo_ayuda", id: item.id, nombre: item.descripcion })}
                            aria-label="Gestiones de este tipo de ayuda"
                          >
                            <IconoReloj />
                          </button>
                          <button className="btn-ghost !px-2 !py-1" onClick={() => startEdit(item)}>Editar</button>
                          <button className="btn-ghost !px-2 !py-1 text-red-500 hover:bg-red-50" onClick={() => setDeleteId(item.id)}>Eliminar</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
              {editingId === item.id ? (
                <input
                  value={editingValue}
                  onChange={(e) => setEditingValue(e.target.value)}
                  className="field-input"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && saveEdit(item.id)}
                />
              ) : (
                <span className="text-sm text-slate-700">{item.descripcion}</span>
              )}
              <div className="flex shrink-0 gap-1">
                {editingId === item.id ? (
                  <>
                    <button className="btn-ghost !px-2 !py-1 text-emerald-600" onClick={() => saveEdit(item.id)}>Guardar</button>
                    <button className="btn-ghost !px-2 !py-1" onClick={() => setEditingId(null)}>Cancelar</button>
                  </>
                ) : (
                  <>
                    <button className="btn-ghost !px-2 !py-1" onClick={() => startEdit(item)}>Editar</button>
                    <button className="btn-ghost !px-2 !py-1 text-red-500 hover:bg-red-50" onClick={() => setDeleteId(item.id)}>Eliminar</button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {conGestiones && <GestionesTerritorioModal seleccion={territorio} onClose={() => setTerritorio(null)} />}

      <ConfirmDialog
        open={deleteId != null}
        title={`Eliminar ${singular}`}
        message="¿Está seguro? Si está siendo usada por algún registro no podrá eliminarse."
        confirmLabel="Eliminar"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
