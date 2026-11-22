"use client";

import { useEffect, useState } from "react";
import { Input, Checkbox } from "@/components/ui/FormControls";
import { apiGet, apiPutJson, ApiError } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import type { Parametros } from "@/lib/types";

interface FormState {
  sentinel_birth_year: string;
  contrato_meses_alerta: string;
  gestiones_vencimiento_dias_alerta: string;
  lideres_page_size: string;
  plantilla_gestion_nueva_asunto: string;
  plantilla_cumpleanos_lider_asunto: string;
  plantilla_vencimiento_gestion_asunto: string;
  despacho_automatico_cumpleanos: boolean;
  despacho_automatico_vencimiento_gestion: boolean;
}

const EMPTY_FORM: FormState = {
  sentinel_birth_year: "",
  contrato_meses_alerta: "",
  gestiones_vencimiento_dias_alerta: "",
  lideres_page_size: "",
  plantilla_gestion_nueva_asunto: "",
  plantilla_cumpleanos_lider_asunto: "",
  plantilla_vencimiento_gestion_asunto: "",
  despacho_automatico_cumpleanos: true,
  despacho_automatico_vencimiento_gestion: true,
};

/** Parámetros del sistema (Configuración > Parámetros): valores que antes vivían en .env a discreción del administrador. */
export function ParametrosManager() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    apiGet<Parametros>("/api/parametros")
      .then((p) =>
        setForm({
          sentinel_birth_year: String(p.sentinel_birth_year),
          contrato_meses_alerta: String(p.contrato_meses_alerta),
          gestiones_vencimiento_dias_alerta: String(p.gestiones_vencimiento_dias_alerta),
          lideres_page_size: String(p.lideres_page_size),
          plantilla_gestion_nueva_asunto: p.plantilla_gestion_nueva_asunto,
          plantilla_cumpleanos_lider_asunto: p.plantilla_cumpleanos_lider_asunto,
          plantilla_vencimiento_gestion_asunto: p.plantilla_vencimiento_gestion_asunto,
          despacho_automatico_cumpleanos: p.despacho_automatico_cumpleanos,
          despacho_automatico_vencimiento_gestion: p.despacho_automatico_vencimiento_gestion,
        })
      )
      .catch((err) => toast.show(err instanceof Error ? err.message : "Error cargando los parámetros", "error"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      await apiPutJson("/api/parametros", {
        sentinel_birth_year: Number(form.sentinel_birth_year),
        contrato_meses_alerta: Number(form.contrato_meses_alerta),
        gestiones_vencimiento_dias_alerta: Number(form.gestiones_vencimiento_dias_alerta),
        lideres_page_size: Number(form.lideres_page_size),
        plantilla_gestion_nueva_asunto: form.plantilla_gestion_nueva_asunto.trim(),
        plantilla_cumpleanos_lider_asunto: form.plantilla_cumpleanos_lider_asunto.trim(),
        plantilla_vencimiento_gestion_asunto: form.plantilla_vencimiento_gestion_asunto.trim(),
        despacho_automatico_cumpleanos: form.despacho_automatico_cumpleanos,
        despacho_automatico_vencimiento_gestion: form.despacho_automatico_vencimiento_gestion,
      });
      toast.show("Parámetros guardados", "success");
    } catch (err) {
      if (err instanceof ApiError && err.fields) {
        setErrors(err.fields);
        toast.show(err.message, "error");
      } else {
        toast.show(err instanceof Error ? err.message : "Error al guardar los parámetros", "error");
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-slate-100" />
        ))}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">Parámetros del sistema</h3>
        <p className="text-xs text-slate-500">Valores operativos de la aplicación</p>
      </div>

      <section className="space-y-4">
        <h4 className="text-sm font-semibold text-slate-700">Líderes y contratos</h4>
        <div className="space-y-4">
          <Input
            label="Año centinela (fecha de nacimiento desconocida)"
            type="number"
            value={form.sentinel_birth_year}
            error={errors.sentinel_birth_year}
            onChange={(e) => set("sentinel_birth_year", e.target.value)}
            hint="Si un líder nace este año, su edad se muestra como 0"
            style={{ maxWidth: "6rem" }}
          />
          <Input
            label="Meses de alerta de vencimiento de contrato"
            type="number"
            value={form.contrato_meses_alerta}
            error={errors.contrato_meses_alerta}
            onChange={(e) => set("contrato_meses_alerta", e.target.value)}
            style={{ maxWidth: "6rem" }}
          />
          <Input
            label="Registros por página (listado de líderes)"
            type="number"
            value={form.lideres_page_size}
            error={errors.lideres_page_size}
            onChange={(e) => set("lideres_page_size", e.target.value)}
            style={{ maxWidth: "6rem" }}
          />
        </div>
      </section>

      <section className="space-y-4 border-t border-slate-100 pt-4">
        <h4 className="text-sm font-semibold text-slate-700">Gestiones</h4>
        <div className="space-y-4">
          <Input
            label="Días de anticipación para alertar vencimiento"
            type="number"
            value={form.gestiones_vencimiento_dias_alerta}
            error={errors.gestiones_vencimiento_dias_alerta}
            onChange={(e) => set("gestiones_vencimiento_dias_alerta", e.target.value)}
            style={{ maxWidth: "6rem" }}
          />
        </div>
      </section>

      <section className="space-y-4 border-t border-slate-100 pt-4">
        <h4 className="text-sm font-semibold text-slate-700">Asuntos de los correos automáticos</h4>
        <div className="grid grid-cols-1 gap-4">
          <Input
            label="Gestión nueva asignada"
            value={form.plantilla_gestion_nueva_asunto}
            error={errors.plantilla_gestion_nueva_asunto}
            onChange={(e) => set("plantilla_gestion_nueva_asunto", e.target.value)}
          />
          <Input
            label="Cumpleaños de líderes"
            value={form.plantilla_cumpleanos_lider_asunto}
            error={errors.plantilla_cumpleanos_lider_asunto}
            onChange={(e) => set("plantilla_cumpleanos_lider_asunto", e.target.value)}
          />
          <Input
            label="Vencimiento de gestión"
            value={form.plantilla_vencimiento_gestion_asunto}
            error={errors.plantilla_vencimiento_gestion_asunto}
            onChange={(e) => set("plantilla_vencimiento_gestion_asunto", e.target.value)}
          />
        </div>
      </section>

      <section className="space-y-4 border-t border-slate-100 pt-4">
        <h4 className="text-sm font-semibold text-slate-700">Despacho automático</h4>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Checkbox
            label="Enviar felicitaciones de cumpleaños"
            checked={form.despacho_automatico_cumpleanos}
            onChange={(v) => set("despacho_automatico_cumpleanos", v)}
          />
          <Checkbox
            label="Enviar alertas de vencimiento de gestiones"
            checked={form.despacho_automatico_vencimiento_gestion}
            onChange={(v) => set("despacho_automatico_vencimiento_gestion", v)}
          />
        </div>
      </section>

      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}
