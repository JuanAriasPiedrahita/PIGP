"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPostJson, apiPutJson, apiDelete } from "@/lib/api";
import { isValidEmail, isValidCelular } from "@/lib/validations";
import { useToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/Modal";
import type { Gestor } from "@/lib/types";

/** CRUD de gestores (nombre + email), responsables de las gestiones de ayuda. */
export function GestoresManager() {
  const [gestores, setGestores] = useState<Gestor[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ id: 0, nombre: "", email: "", telefono: "" });
  const [editing, setEditing] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  async function load() {
    setLoading(true);
    try {
      setGestores(await apiGet<Gestor[]>("/api/gestores"));
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Error cargando gestores", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetForm() {
    setForm({ id: 0, nombre: "", email: "", telefono: "" });
    setEditing(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre.trim()) {
      toast.show("El nombre es obligatorio", "error");
      return;
    }
    if (!isValidEmail(form.email)) {
      toast.show("Email inválido", "error");
      return;
    }
    if (form.telefono.trim() && !isValidCelular(form.telefono)) {
      toast.show("Teléfono inválido", "error");
      return;
    }
    setSaving(true);
    try {
      const payload = { nombre: form.nombre.trim(), email: form.email.trim(), telefono: form.telefono.trim() };
      if (form.id) {
        await apiPutJson(`/api/gestores/${form.id}`, payload);
        toast.show("Gestor actualizado", "success");
      } else {
        await apiPostJson("/api/gestores", payload);
        toast.show("Gestor agregado", "success");
      }
      resetForm();
      load();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Error al guardar", "error");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(g: Gestor) {
    setForm({ id: g.id, nombre: g.nombre, email: g.email || "", telefono: g.telefono || "" });
    setEditing(true);
  }

  async function confirmDelete() {
    if (deleteId == null) return;
    try {
      await apiDelete(`/api/gestores/${deleteId}`);
      toast.show("Gestor eliminado", "success");
      setDeleteId(null);
      load();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Error al eliminar", "error");
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
        <input
          value={form.nombre}
          onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
          placeholder="Nombre del gestor"
          className="field-input"
        />
        <input
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          placeholder="Email (opcional)"
          type="email"
          className="field-input"
        />
        <input
          value={form.telefono}
          onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
          placeholder="Teléfono (opcional)"
          className="field-input"
        />
        <div className="flex gap-2">
          <button className="btn-primary shrink-0" disabled={saving}>{editing ? "Guardar" : "Agregar"}</button>
          {editing && <button type="button" className="btn-secondary shrink-0" onClick={resetForm}>Cancelar</button>}
        </div>
      </form>

      {loading ? (
        <div className="space-y-2">{[1, 2].map((i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />)}</div>
      ) : gestores.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400">Aún no hay gestores registrados.</p>
      ) : (
        <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
          {gestores.map((g) => (
            <li
              key={g.id}
              onClick={() => startEdit(g)}
              className="flex cursor-pointer items-center justify-between gap-3 px-4 py-2.5 hover:bg-slate-50"
            >
              <div className="min-w-0">
                <p className="truncate text-sm text-slate-700">{g.nombre}</p>
                {(g.email || g.telefono) && (
                  <p className="truncate text-xs text-slate-400">
                    {[g.email, g.telefono].filter(Boolean).join(" · ")}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  className="btn-ghost !px-2 !py-1 text-red-500 hover:bg-red-50"
                  onClick={(e) => { e.stopPropagation(); setDeleteId(g.id); }}
                >
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={deleteId != null}
        title="Eliminar gestor"
        message="¿Está seguro? Si tiene gestiones asignadas no podrá eliminarse."
        confirmLabel="Eliminar"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
