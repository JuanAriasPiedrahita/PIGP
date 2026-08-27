"use client";

import { useCallback, useEffect, useState } from "react";
import { useCatalogos } from "@/hooks/useCatalogos";
import { apiGet, apiDelete } from "@/lib/api";
import type { Atributos, Lider } from "@/lib/types";
import { LiderTable } from "@/components/lideres/LiderTable";
import { LiderForm } from "@/components/lideres/LiderForm";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { AtributosCheckboxes, DEFAULT_ATRIBUTOS } from "@/components/shared/AtributosCheckboxes";
import { useToast } from "@/components/ui/Toast";

export default function LideresPage() {
  const catalogos = useCatalogos();
  const toast = useToast();
  const [lideres, setLideres] = useState<Lider[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [comunaFilter, setComunaFilter] = useState("");
  const [barrioFilter, setBarrioFilter] = useState("");
  const [puestoFilter, setPuestoFilter] = useState("");
  const [contratistaFilter, setContratistaFilter] = useState(""); // "" | "true" | "false"
  const [atributosFilter, setAtributosFilter] = useState<Atributos>(DEFAULT_ATRIBUTOS);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | undefined>(undefined);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (comunaFilter) params.set("comuna_id", comunaFilter);
      if (barrioFilter) params.set("barrio_id", barrioFilter);
      if (puestoFilter) params.set("puesto_id", puestoFilter);
      if (contratistaFilter) params.set("contratista", contratistaFilter);
      (Object.keys(atributosFilter) as (keyof Atributos)[]).forEach((k) => {
        if (atributosFilter[k]) params.set(k, "true");
      });
      const url = `/api/lideres${params.toString() ? `?${params}` : ""}`;
      const data = await apiGet<Lider[]>(url);
      setLideres(data);
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Error cargando líderes", "error");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, comunaFilter, barrioFilter, puestoFilter, contratistaFilter, atributosFilter]);

  useEffect(() => {
    const t = setTimeout(() => load(), 300);
    return () => clearTimeout(t);
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
      await apiDelete(`/api/lideres/${deleteId}`);
      toast.show("Líder eliminado", "success");
      setDeleteId(null);
      load();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Error al eliminar", "error");
    }
  }

  function limpiarFiltros() {
    setSearch("");
    setComunaFilter("");
    setBarrioFilter("");
    setPuestoFilter("");
    setContratistaFilter("");
    setAtributosFilter(DEFAULT_ATRIBUTOS);
  }

  const barriosDisponibles = catalogos.barrios.filter((b) => !comunaFilter || String(b.comuna_id) === comunaFilter);
  const puestoOptions = catalogos.puestos.map((p) => {
    const zona = catalogos.zonas.find((z) => z.id === p.zona_id);
    return { id: p.id, label: `${zona ? "Zona " + zona.codigo + " · " : ""}${p.numero} - ${p.nombre}` };
  });

  const hayFiltrosActivos =
    !!search || !!comunaFilter || !!barrioFilter || !!puestoFilter || !!contratistaFilter ||
    Object.values(atributosFilter).some(Boolean);

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

      <div className="card space-y-4 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, apellidos o cédula..."
            className="field-input max-w-xs"
          />
          <select
            value={comunaFilter}
            onChange={(e) => { setComunaFilter(e.target.value); setBarrioFilter(""); }}
            className="field-input max-w-xs"
          >
            <option value="">Todas las comunas</option>
            {catalogos.comunas.map((c) => (
              <option key={c.id} value={c.id}>{c.descripcion}</option>
            ))}
          </select>
          <select value={barrioFilter} onChange={(e) => setBarrioFilter(e.target.value)} className="field-input max-w-xs">
            <option value="">Todos los barrios</option>
            {barriosDisponibles.map((b) => (
              <option key={b.id} value={b.id}>{b.nombre}</option>
            ))}
          </select>
          <select value={puestoFilter} onChange={(e) => setPuestoFilter(e.target.value)} className="field-input max-w-xs">
            <option value="">Todos los puestos de votación</option>
            {puestoOptions.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
          <select value={contratistaFilter} onChange={(e) => setContratistaFilter(e.target.value)} className="field-input max-w-xs">
            <option value="">Contratista: todos</option>
            <option value="true">Solo contratistas</option>
            <option value="false">Solo no contratistas</option>
          </select>
          {hayFiltrosActivos && (
            <button className="btn-ghost" onClick={limpiarFiltros}>Limpiar filtros</button>
          )}
        </div>

        <div className="border-t border-slate-100 pt-4">
          <AtributosCheckboxes value={atributosFilter} onChange={setAtributosFilter} />
        </div>
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
