"use client";

import { useCallback, useEffect, useState } from "react";
import { useCatalogos } from "@/hooks/useCatalogos";
import { apiGet, apiDelete } from "@/lib/api";
import type { Atributos, Lider, Referido } from "@/lib/types";
import { ReferidoTable } from "@/components/referidos/ReferidoTable";
import { ReferidoForm } from "@/components/referidos/ReferidoForm";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { Checkbox } from "@/components/ui/FormControls";
import { AtributosCheckboxes, DEFAULT_ATRIBUTOS } from "@/components/shared/AtributosCheckboxes";
import { useToast } from "@/components/ui/Toast";

export default function ReferidosPage() {
  const catalogos = useCatalogos();
  const toast = useToast();
  const [referidos, setReferidos] = useState<Referido[]>([]);
  const [lideres, setLideres] = useState<Lider[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [liderFilter, setLiderFilter] = useState("");
  const [comunaFilter, setComunaFilter] = useState("");
  const [barrioFilter, setBarrioFilter] = useState("");
  const [puestoFilter, setPuestoFilter] = useState("");
  const [damnificadoFilter, setDamnificadoFilter] = useState(false);
  const [atributosFilter, setAtributosFilter] = useState<Atributos>(DEFAULT_ATRIBUTOS);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | undefined>(undefined);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  useEffect(() => {
    apiGet<Lider[]>("/api/lideres").then(setLideres).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (liderFilter) params.set("lider_id", liderFilter);
      if (comunaFilter) params.set("comuna_id", comunaFilter);
      if (barrioFilter) params.set("barrio_id", barrioFilter);
      if (puestoFilter) params.set("puesto_id", puestoFilter);
      if (damnificadoFilter) params.set("damnificado", "true");
      (Object.keys(atributosFilter) as (keyof Atributos)[]).forEach((k) => {
        if (atributosFilter[k]) params.set(k, "true");
      });
      const url = `/api/referidos${params.toString() ? `?${params}` : ""}`;
      const data = await apiGet<Referido[]>(url);
      setReferidos(data);
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Error cargando referidos", "error");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, liderFilter, comunaFilter, barrioFilter, puestoFilter, damnificadoFilter, atributosFilter]);

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
    apiGet<Lider[]>("/api/lideres").then(setLideres).catch(() => {});
  }

  async function confirmDelete() {
    if (deleteId == null) return;
    try {
      await apiDelete(`/api/referidos/${deleteId}`);
      toast.show("Referido eliminado", "success");
      setDeleteId(null);
      load();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Error al eliminar", "error");
    }
  }

  function limpiarFiltros() {
    setSearch("");
    setLiderFilter("");
    setComunaFilter("");
    setBarrioFilter("");
    setPuestoFilter("");
    setDamnificadoFilter(false);
    setAtributosFilter(DEFAULT_ATRIBUTOS);
  }

  const barriosDisponibles = catalogos.barrios.filter((b) => !comunaFilter || String(b.comuna_id) === comunaFilter);
  const puestoOptions = catalogos.puestos.map((p) => {
    const zona = catalogos.zonas.find((z) => z.id === p.zona_id);
    return { id: p.id, label: `${zona ? "Zona " + zona.codigo + " · " : ""}${p.numero} - ${p.nombre}` };
  });

  const hayFiltrosActivos =
    !!search || !!liderFilter || !!comunaFilter || !!barrioFilter || !!puestoFilter || damnificadoFilter ||
    Object.values(atributosFilter).some(Boolean);

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

      <div className="card space-y-4 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, apellidos o cédula..."
            className="field-input max-w-xs"
          />
          <select value={liderFilter} onChange={(e) => setLiderFilter(e.target.value)} className="field-input max-w-xs">
            <option value="">Todos los líderes</option>
            {lideres.map((l) => (
              <option key={l.id} value={l.id}>{l.nombre} {l.apellidos}</option>
            ))}
          </select>
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
          {hayFiltrosActivos && (
            <button className="btn-ghost" onClick={limpiarFiltros}>Limpiar filtros</button>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-start sm:justify-between">
          <AtributosCheckboxes value={atributosFilter} onChange={setAtributosFilter} />
          <Checkbox label="Solo damnificados en terremoto" checked={damnificadoFilter} onChange={setDamnificadoFilter} />
        </div>
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
