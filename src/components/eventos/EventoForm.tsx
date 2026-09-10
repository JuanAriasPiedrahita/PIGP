"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/FormControls";
import { apiGet, apiPostJson, apiPutJson, ApiError } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import type { Evento } from "@/lib/types";

interface FormState {
  nombre: string;
  ubicacion: string;
  fecha: string;
  hora: string;
}

const EMPTY_FORM: FormState = { nombre: "", ubicacion: "", fecha: "", hora: "" };

interface Props {
  eventoId?: number;
  onSaved: (id: number) => void;
  onCancel?: () => void;
}

export function EventoForm({ eventoId, onSaved, onCancel }: Props) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(!!eventoId);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (!eventoId) return;
    apiGet<Evento>(`/api/eventos/${eventoId}`)
      .then((e) => {
        setForm({
          nombre: e.nombre,
          ubicacion: e.ubicacion,
          fecha: e.fecha?.slice(0, 10) || "",
          hora: e.hora?.slice(0, 5) || "",
        });
      })
      .catch((err) => toast.show(err.message, "error"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventoId]);

  function set<K extends keyof FormState>(field: K, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.nombre.trim()) errs.nombre = "Obligatorio";
    if (!form.ubicacion.trim()) errs.ubicacion = "Obligatorio";
    if (!form.fecha) errs.fecha = "Obligatoria";
    if (!form.hora) errs.hora = "Obligatoria";
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
      if (eventoId) {
        await apiPutJson(`/api/eventos/${eventoId}`, form);
        toast.show("Evento actualizado correctamente", "success");
        onSaved(eventoId);
      } else {
        const { id } = await apiPostJson<{ id: number }>("/api/eventos", form);
        toast.show("Evento creado correctamente", "success");
        onSaved(id);
      }
    } catch (err) {
      if (err instanceof ApiError && err.fields) setErrors(err.fields);
      toast.show(err instanceof Error ? err.message : "Error al guardar", "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="py-10 text-center text-sm text-slate-400">Cargando evento...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Nombre del evento"
          required
          value={form.nombre}
          error={errors.nombre}
          onChange={(e) => set("nombre", e.target.value)}
          className="sm:col-span-2"
        />
        <Input
          label="Ubicación"
          required
          value={form.ubicacion}
          error={errors.ubicacion}
          onChange={(e) => set("ubicacion", e.target.value)}
          className="sm:col-span-2"
        />
        <Input
          label="Fecha"
          type="date"
          required
          value={form.fecha}
          error={errors.fecha}
          onChange={(e) => set("fecha", e.target.value)}
        />
        <Input
          label="Hora"
          type="time"
          required
          value={form.hora}
          error={errors.hora}
          onChange={(e) => set("hora", e.target.value)}
        />
      </div>

      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
        {onCancel && (
          <button type="button" className="btn-secondary" onClick={onCancel} disabled={saving}>
            Cancelar
          </button>
        )}
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "Guardando..." : eventoId ? "Guardar cambios" : "Crear evento"}
        </button>
      </div>
    </form>
  );
}
