"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCatalogos } from "@/hooks/useCatalogos";
import { apiGet, apiDelete } from "@/lib/api";
import type { Atributos, Lider } from "@/lib/types";
import { LiderTable } from "@/components/lideres/LiderTable";
import { LiderForm } from "@/components/lideres/LiderForm";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { Checkbox } from "@/components/ui/FormControls";
import { AtributosCheckboxes, DEFAULT_ATRIBUTOS } from "@/components/shared/AtributosCheckboxes";
import { useToast } from "@/components/ui/Toast";

const SESSION_KEY = "pigp:lideres:envio-correo";
const DEFAULT_PAGE_SIZE = Number(process.env.NEXT_PUBLIC_LIDERES_PAGE_SIZE) || 15;

function LideresContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const catalogos = useCatalogos();
  const toast = useToast();
  const [lideres, setLideres] = useState<Lider[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [comunaFilter, setComunaFilter] = useState(() => searchParams.get("comuna_id") || "");
  const [barrioFilter, setBarrioFilter] = useState("");
  const [puestoFilter, setPuestoFilter] = useState("");
  const [contratistaFilter, setContratistaFilter] = useState(false);
  const [atributosFilter, setAtributosFilter] = useState<Atributos>(DEFAULT_ATRIBUTOS);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | undefined>(undefined);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  useEffect(() => {
    const liderId = searchParams.get("lider_id");
    if (liderId) {
      setEditingId(Number(liderId));
      setModalOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (comunaFilter) params.set("comuna_id", comunaFilter);
      if (barrioFilter) params.set("barrio_id", barrioFilter);
      if (puestoFilter) params.set("puesto_id", puestoFilter);
      if (contratistaFilter) params.set("contratista", "true");
      (Object.keys(atributosFilter) as (keyof Atributos)[]).forEach((k) => {
        if (atributosFilter[k]) params.set(k, "true");
      });
      const url = `/api/lideres${params.toString() ? `?${params}` : ""}`;
      const data = await apiGet<Lider[]>(url);
      setLideres(data);
      setSelectedIds(new Set());
      setPage(1);
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

  function toggleSelect(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds((prev) => {
      const todosSeleccionados = paginaLideres.length > 0 && paginaLideres.every((l) => prev.has(l.id));
      const next = new Set(prev);
      if (todosSeleccionados) {
        paginaLideres.forEach((l) => next.delete(l.id));
      } else {
        paginaLideres.forEach((l) => next.add(l.id));
      }
      return next;
    });
  }

  function handlePageSizeChange(value: number) {
    setPageSize(value > 0 ? value : 1);
    setPage(1);
  }

  function irAEnviarCorreo() {
    const seleccionados = lideres
      .filter((l) => selectedIds.has(l.id))
      .map((l) => ({ id: l.id, nombre: l.nombre, apellidos: l.apellidos, email: l.email }));
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(seleccionados));
    router.push("/lideres/enviar-correo");
  }

  function limpiarFiltros() {
    setSearch("");
    setComunaFilter("");
    setBarrioFilter("");
    setPuestoFilter("");
    setContratistaFilter(false);
    setAtributosFilter(DEFAULT_ATRIBUTOS);
  }

  const barriosDisponibles = catalogos.barrios.filter((b) => !comunaFilter || String(b.comuna_id) === comunaFilter);
  const puestoOptions = catalogos.puestos
    .map((p) => {
      const zona = catalogos.zonas.find((z) => z.id === p.zona_id);
      return { id: p.id, zonaCodigo: zona?.codigo ?? "", numero: p.numero, label: `${zona ? "Zona " + zona.codigo + " · " : ""}${p.numero} - ${p.nombre}` };
    })
    .sort((a, b) =>
      a.zonaCodigo.localeCompare(b.zonaCodigo, undefined, { numeric: true }) ||
      a.numero.localeCompare(b.numero, undefined, { numeric: true })
    );

  const hayFiltrosActivos =
    !!search || !!comunaFilter || !!barrioFilter || !!puestoFilter || contratistaFilter ||
    Object.values(atributosFilter).some(Boolean);

  const totalPages = Math.max(1, Math.ceil(lideres.length / pageSize));
  const paginaActual = Math.min(page, totalPages);
  const paginaLideres = lideres.slice((paginaActual - 1) * pageSize, paginaActual * pageSize);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Líderes</h2>
          <p className="text-sm text-slate-500">Administre el listado de líderes de la campaña.</p>
        </div>
        <div className="flex gap-2">
          {selectedIds.size > 0 && (
            <button className="btn-secondary" onClick={irAEnviarCorreo}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <path d="M3 6l9 6 9-6M4 6h16v12H4V6z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Enviar correo ({selectedIds.size})
            </button>
          )}
          <button className="btn-primary" onClick={openCreate}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
            Nuevo líder
          </button>
        </div>
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
          {hayFiltrosActivos && (
            <button className="btn-ghost" onClick={limpiarFiltros}>Limpiar filtros</button>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-start sm:justify-between">
          <AtributosCheckboxes value={atributosFilter} onChange={setAtributosFilter} />
          <Checkbox label="Solo contratistas" checked={contratistaFilter} onChange={setContratistaFilter} />
        </div>
      </div>

      <div className="card p-4">
        {loading ? (
          <div className="space-y-2 py-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />)}
          </div>
        ) : (
          <LiderTable
            lideres={paginaLideres}
            onEdit={openEdit}
            onDelete={setDeleteId}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onToggleSelectAll={toggleSelectAll}
          />
        )}

        {!loading && lideres.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-1">
              <button
                className="btn-ghost !px-2 !py-1.5"
                onClick={() => setPage(1)}
                disabled={paginaActual <= 1}
                aria-label="Primera página"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <path d="M18 17l-5-5 5-5M11 17l-5-5 5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                className="btn-ghost !px-2 !py-1.5"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={paginaActual <= 1}
                aria-label="Página anterior"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <span className="px-2 text-sm text-slate-500">Página {paginaActual} de {totalPages}</span>
              <button
                className="btn-ghost !px-2 !py-1.5"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={paginaActual >= totalPages}
                aria-label="Página siguiente"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                className="btn-ghost !px-2 !py-1.5"
                onClick={() => setPage(totalPages)}
                disabled={paginaActual >= totalPages}
                aria-label="Última página"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <path d="M6 17l5-5-5-5M13 17l5-5-5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-500">
              Registros por página
              <input
                type="number"
                min={1}
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="field-input w-20"
              />
            </label>
          </div>
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

export default function LideresPage() {
  return (
    <Suspense fallback={null}>
      <LideresContent />
    </Suspense>
  );
}
