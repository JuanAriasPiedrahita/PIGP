"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { apiGet, apiDelete } from "@/lib/api";
import { useGestionCatalogos } from "@/hooks/useGestionCatalogos";
import { GestionesTable } from "@/components/gestiones/GestionesTable";
import { GestionForm } from "@/components/gestiones/GestionForm";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import type { Gestion, Referido } from "@/lib/types";

export default function GestionesReferidoPage() {
  const params = useParams<{ id: string }>();
  const referidoId = Number(params.id);
  const toast = useToast();
  const catalogos = useGestionCatalogos();

  const [referido, setReferido] = useState<Referido | null>(null);
  const [gestiones, setGestiones] = useState<Gestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | undefined>(undefined);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  useEffect(() => {
    apiGet<Referido>(`/api/referidos/${referidoId}`)
      .then(setReferido)
      .catch((err) => toast.show(err instanceof Error ? err.message : "Error cargando el referido", "error"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [referidoId]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setGestiones(await apiGet<Gestion[]>(`/api/gestiones?referido_id=${referidoId}`));
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Error cargando gestiones", "error");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [referidoId]);

  useEffect(() => {
    load();
  }, [load]);

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
    load();
  }

  async function confirmDelete() {
    if (deleteId == null) return;
    try {
      await apiDelete(`/api/gestiones/${deleteId}`);
      toast.show("Gestión eliminada", "success");
      setDeleteId(null);
      load();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Error al eliminar", "error");
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <Link href="/gestiones" className="text-sm text-brand-700 hover:underline">← Volver a Gestiones</Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            {referido ? `${referido.nombre} ${referido.apellidos}` : "Cargando..."}
          </h2>
          {referido && (
            <p className="text-sm text-slate-500">
              C.C. {referido.cedula} · {referido.barrio_nombre} · {referido.celular}
            </p>
          )}
        </div>
        <button className="btn-primary" onClick={openCreate} disabled={!referido}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          Nueva gestión
        </button>
      </div>

      <div className="card p-4">
        {loading ? (
          <div className="space-y-2 py-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />)}
          </div>
        ) : (
          <GestionesTable gestiones={gestiones} onEdit={openEdit} onDelete={setDeleteId} />
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Editar gestión" : "Nueva gestión"} widthClass="max-w-2xl">
        {catalogos.loading ? (
          <p className="py-10 text-center text-sm text-slate-400">Cargando catálogos...</p>
        ) : (
          <GestionForm
            referidoId={referidoId}
            gestionId={editingId}
            tiposAyuda={catalogos.tiposAyuda}
            gestores={catalogos.gestores}
            onSaved={handleSaved}
            onCancel={() => setModalOpen(false)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={deleteId != null}
        title="Eliminar gestión"
        message="¿Está seguro de eliminar esta gestión? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
