"use client";

import { useCallback, useEffect, useState } from "react";
import { useCapturaCatalogos } from "@/hooks/useCapturaCatalogos";
import { useNombreLider } from "@/hooks/useNombreLider";
import { apiGet, apiDelete } from "@/lib/api";
import type { Referido } from "@/lib/types";
import { ReferidoTable } from "@/components/referidos/ReferidoTable";
import { CapturaReferidoForm } from "@/components/captura/CapturaReferidoForm";
import { CapturaSidebar } from "@/components/captura/CapturaSidebar";
import { CapturaHeader } from "@/components/captura/CapturaHeader";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { ToastProvider, useToast } from "@/components/ui/Toast";

function CapturaContent() {
  const catalogos = useCapturaCatalogos();
  const toast = useToast();
  const nombreLider = useNombreLider();

  const [menuOpen, setMenuOpen] = useState(false);
  const [referidos, setReferidos] = useState<Referido[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | undefined>(undefined);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const load = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const url = q ? `/api/captura/referidos?q=${encodeURIComponent(q)}` : "/api/captura/referidos";
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
    const t = setTimeout(() => load(search), 300);
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
      await apiDelete(`/api/captura/referidos/${deleteId}`);
      toast.show("Referido eliminado", "success");
      setDeleteId(null);
      load(search);
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Error al eliminar", "error");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <CapturaSidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <CapturaHeader onToggleMenu={() => setMenuOpen((v) => !v)} nombreLider={nombreLider} />

      <main className="mx-auto max-w-5xl space-y-5 px-4 py-6 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            {referidos.length} referido{referidos.length === 1 ? "" : "s"} registrado{referidos.length === 1 ? "" : "s"}
          </p>
          <button className="btn-primary" onClick={openCreate}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
            Nuevo referido
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
            <ReferidoTable referidos={referidos} onEdit={openEdit} onDelete={setDeleteId} />
          )}
        </div>
      </main>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Editar referido" : "Nuevo referido"} widthClass="max-w-3xl">
        {catalogos.loading ? (
          <p className="py-10 text-center text-sm text-slate-400">Cargando catálogos...</p>
        ) : (
          <CapturaReferidoForm catalogos={catalogos} referidoId={editingId} onSaved={handleSaved} onCancel={() => setModalOpen(false)} />
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

export default function CapturaPage() {
  return (
    <ToastProvider>
      <CapturaContent />
    </ToastProvider>
  );
}
