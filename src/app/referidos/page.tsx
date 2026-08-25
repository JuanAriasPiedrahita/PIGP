"use client";

import { useCallback, useEffect, useState } from "react";
import { useCatalogos } from "@/hooks/useCatalogos";
import { apiGet, apiDelete } from "@/lib/api";
import type { Lider, Referido } from "@/lib/types";
import { ReferidoTable } from "@/components/referidos/ReferidoTable";
import { ReferidoForm } from "@/components/referidos/ReferidoForm";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

export default function ReferidosPage() {
  const catalogos = useCatalogos();
  const toast = useToast();
  const [referidos, setReferidos] = useState<Referido[]>([]);
  const [lideres, setLideres] = useState<Lider[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [liderFilter, setLiderFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | undefined>(undefined);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  useEffect(() => {
    apiGet<Lider[]>("/api/lideres").then(setLideres).catch(() => {});
  }, []);

  const load = useCallback(async (q: string, liderId: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (liderId) params.set("lider_id", liderId);
      const url = `/api/referidos${params.toString() ? `?${params}` : ""}`;
      const data = await apiGet<Referido[]>(url);
      setReferidos(data);
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Error cargando referidos", "error");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(search, liderFilter), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, liderFilter]);

  function openCreate() {
    setEditingId(undefined);
    setModalOpen(true);
  }

  function openEdit(id: number) {
    setEditingId(id);
    setModalOpen(true);
  }

  function handleSaved() {
    setModalOpen(false);
    load(search, liderFilter);
    apiGet<Lider[]>("/api/lideres").then(setLideres).catch(() => {});
  }

  async function confirmDelete() {
    if (deleteId == null) return;
    try {
      await apiDelete(`/api/referidos/${deleteId}`);
      toast.show("Referido eliminado", "success");
      setDeleteId(null);
      load(search, liderFilter);
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Error al eliminar", "error");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Referidos</h2>
          <p className="text-sm text-slate-500">Personas registradas por cada líder de la campaña.</p>
        </div>
        <button className="btn-primary" onClick={openCreate} disabled={lideres.length === 0}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          Nuevo referido
        </button>
      </div>

      {lideres.length === 0 && (
        <div className="card border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Primero debe registrar al menos un líder para poder capturar referidos.
        </div>
      )}

      <div className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, apellidos o cédula..."
          className="field-input max-w-sm"
        />
        <select
          value={liderFilter}
          onChange={(e) => setLiderFilter(e.target.value)}
          className="field-input max-w-xs"
        >
          <option value="">Todos los líderes</option>
          {lideres.map((l) => (
            <option key={l.id} value={l.id}>{l.nombre} {l.apellidos}</option>
          ))}
        </select>
        {liderFilter && (
          <button className="btn-ghost" onClick={() => setLiderFilter("")}>Quitar filtro</button>
        )}
      </div>

      <div className="card p-4">
        {loading ? (
          <div className="space-y-2 py-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />)}
          </div>
        ) : (
          <ReferidoTable referidos={referidos} onEdit={openEdit} onDelete={setDeleteId} />
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Editar referido" : "Nuevo referido"} widthClass="max-w-3xl">
        {catalogos.loading ? (
          <p className="py-10 text-center text-sm text-slate-400">Cargando catálogos...</p>
        ) : (
          <ReferidoForm
            catalogos={catalogos}
            lideres={lideres}
            referidoId={editingId}
            defaultLiderId={liderFilter ? Number(liderFilter) : undefined}
            onSaved={handleSaved}
            onCancel={() => setModalOpen(false)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={deleteId != null}
        title="Eliminar referido"
        message="¿Está seguro de eliminar este referido? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
