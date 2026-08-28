"use client";

import { useEffect, useState } from "react";
import { Select, RadioGroup } from "@/components/ui/FormControls";
import { MultiPhotoUpload } from "@/components/ui/MultiPhotoUpload";
import { apiGet, apiPostForm, apiPutForm, ApiError } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import type { EstadoGestion, Gestion, Gestor, TipoAyuda } from "@/lib/types";

interface Props {
  referidoId: number;
  gestionId?: number;
  tiposAyuda: TipoAyuda[];
  gestores: Gestor[];
  onSaved: () => void;
  onCancel: () => void;
}

const ESTADO_OPTIONS: { value: EstadoGestion; label: string }[] = [
  { value: "PENDIENTE", label: "Pendiente" },
  { value: "NO_VIABLE", label: "No viable" },
  { value: "RESUELTO", label: "Resuelto" },
];

export function GestionForm({ referidoId, gestionId, tiposAyuda, gestores, onSaved, onCancel }: Props) {
  const [tipoAyudaId, setTipoAyudaId] = useState("");
  const [gestorId, setGestorId] = useState("");
  const [fechaLimite, setFechaLimite] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [estado, setEstado] = useState<EstadoGestion>("PENDIENTE");
  const [costo, setCosto] = useState("");
  const [fotosExistentes, setFotosExistentes] = useState<string[]>([]);
  const [fotosNuevas, setFotosNuevas] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(!!gestionId);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (!gestionId) return;
    apiGet<Gestion>(`/api/gestiones/${gestionId}`)
      .then((g) => {
        setTipoAyudaId(String(g.tipo_ayuda_id));
        setGestorId(String(g.gestor_id));
        setFechaLimite(g.fecha_limite?.slice(0, 10) || "");
        setObservaciones(g.observaciones || "");
        setEstado(g.estado);
        setCosto(g.costo != null ? String(g.costo) : "");
        setFotosExistentes(g.fotos || []);
      })
      .catch((err) => toast.show(err.message, "error"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gestionId]);

  const resuelto = estado === "RESUELTO";

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!tipoAyudaId) errs.tipo_ayuda_id = "Seleccione el tipo de ayuda";
    if (!gestorId) errs.gestor_id = "Seleccione el responsable";
    if (!fechaLimite) errs.fecha_limite = "Obligatoria";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) {
      toast.show("Revise los campos marcados en rojo", "error");
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.set("referido_id", String(referidoId));
      fd.set("tipo_ayuda_id", tipoAyudaId);
      fd.set("gestor_id", gestorId);
      fd.set("fecha_limite", fechaLimite);
      fd.set("observaciones", observaciones);
      fd.set("estado", estado);
      fd.set("costo", resuelto ? costo : "");
      fd.set("fotos_existentes", JSON.stringify(fotosExistentes));
      fotosNuevas.forEach((f) => fd.append("fotos", f));

      if (gestionId) {
        await apiPutForm(`/api/gestiones/${gestionId}`, fd);
        toast.show("Gestión actualizada", "success");
      } else {
        await apiPostForm("/api/gestiones", fd);
        toast.show("Gestión creada", "success");
      }
      onSaved();
    } catch (err) {
      if (err instanceof ApiError && err.fields) setErrors(err.fields);
      toast.show(err instanceof Error ? err.message : "Error al guardar", "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="py-10 text-center text-sm text-slate-400">Cargando gestión...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select
          label="Tipo de ayuda"
          required
          value={tipoAyudaId}
          error={errors.tipo_ayuda_id}
          onChange={(e) => setTipoAyudaId(e.target.value)}
          options={tiposAyuda.map((t) => ({ value: t.id, label: t.descripcion }))}
        />
        <Select
          label="Responsable"
          required
          value={gestorId}
          error={errors.gestor_id}
          onChange={(e) => setGestorId(e.target.value)}
          options={gestores.map((g) => {
            const contacto = [g.email, g.telefono].filter(Boolean).join(" · ");
            return { value: g.id, label: contacto ? `${g.nombre} (${contacto})` : g.nombre };
          })}
        />
        <div>
          <label className="field-label">Fecha límite *</label>
          <input
            type="date"
            value={fechaLimite}
            onChange={(e) => setFechaLimite(e.target.value)}
            className={`field-input ${errors.fecha_limite ? "field-input-error" : ""}`}
          />
          {errors.fecha_limite && <p className="field-error">{errors.fecha_limite}</p>}
        </div>
      </div>

      <div>
        <label className="field-label">Observaciones</label>
        <textarea
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          rows={3}
          className="field-input"
        />
      </div>

      <RadioGroup
        label="Estado"
        name="estado-gestion"
        value={estado}
        onChange={(v) => setEstado(v as EstadoGestion)}
        options={ESTADO_OPTIONS}
      />

      <div className="grid grid-cols-1 gap-4 rounded-lg bg-slate-50 p-4 sm:grid-cols-2">
        <div>
          <label className={`field-label ${!resuelto ? "text-slate-400" : ""}`}>Costo</label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={costo}
            disabled={!resuelto}
            onChange={(e) => setCosto(e.target.value)}
            placeholder={resuelto ? "0" : "Disponible al marcar Resuelto"}
            className="field-input disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
          />
        </div>
        <div>
          <label className={`field-label ${!resuelto ? "text-slate-400" : ""}`}>Fotografías</label>
          {resuelto ? (
            <MultiPhotoUpload
              existentes={fotosExistentes}
              onExistentesChange={setFotosExistentes}
              onNuevosChange={setFotosNuevas}
            />
          ) : (
            <p className="text-xs text-slate-400">Disponible al marcar Resuelto</p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={saving}>
          Cancelar
        </button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "Guardando..." : gestionId ? "Guardar cambios" : "Crear gestión"}
        </button>
      </div>
    </form>
  );
}
