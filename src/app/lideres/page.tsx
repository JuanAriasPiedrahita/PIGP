"use client";

import { useCallback, useEffect, useState } from "react";
import { useCatalogos } from "@/hooks/useCatalogos";
import { apiGet, apiDelete } from "@/lib/api";
import type { Lider } from "@/lib/types";
import { LiderTable } from "@/components/lideres/LiderTable";
import { LiderForm } from "@/components/lideres/LiderForm";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

export default function LideresPage() {
  const catalogos = useCatalogos();
  const toast = useToast();
  const [lideres, setLideres] = useState<Lider[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | undefined>(undefined);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const load = useCallback(async (q?: string) => {
    setLoading(true);
    try {
      const url = q ? `/api/lideres?q=${encodeURIComponent(q)}` : "/api/lideres";
      const data = await apiGet<Lider[]>(url);
      setLideres(data);
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Error cargando líderes", "error");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const t = setTimeout(() => load(search), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

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
    load(search);
  }

  async function confirmDelete() {
    if (deleteId == null) return;
    try {
      await apiDelete(`/api/lideres/${deleteId}`);
      toast.show("Líder eliminado", "success");
      setDeleteId(null);
      load(search);
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Error al eliminar", "error");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Líderes</h2>
          <p className="text-sm text-slate-500">Administre el listado de líderes de la campaña.</p>
        </div>
        <button className="btn-primary" onClick={openCreate}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          Nuevo líder
        </button>
      </div>

      <div className="card p-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, apellidos o cédula..."
          className="field-input max-w-sm"
        />
      </div>

      <div className="card p-4">
        {loading ? (
          <div className="space-y-2 py-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />)}
          </div>
        ) : (
          <LiderTable lideres={lideres} onEdit={openEdit} onDelete={setDeleteId} />
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Editar líder" : "Nuevo líder"} widthClass="max-w-3xl">
        {catalogos.loading ? (
          <p className="py-10 text-center text-sm text-slate-400">Cargando catálogos...</p>
        ) : (
          <LiderForm catalogos={catalogos} liderId={editingId} onSaved={handleSaved} onCancel={() => setModalOpen(false)} />
        )}
      </Modal>

      <ConfirmDialog
        open={deleteId != null}
        title="Eliminar líder"
        message="Esta acción eliminará también todos sus referidos asociados. ¿Desea continuar?"
        confirmLabel="Eliminar"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
