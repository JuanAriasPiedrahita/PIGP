"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPutJson, ApiError } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { Input } from "@/components/ui/FormControls";
import { LIDER_PLACEHOLDERS, GESTION_PLACEHOLDERS } from "@/lib/emailPlaceholders";

const PLANTILLAS = [
  {
    key: "gestion-nueva",
    label: "Gestiones nuevas",
    endpoint: "/api/plantillas/gestion-nueva",
    placeholders: GESTION_PLACEHOLDERS,
  },
  {
    key: "vencimiento-gestion",
    label: "Vencimiento gestiones",
    endpoint: "/api/plantillas/vencimiento-gestion",
    placeholders: GESTION_PLACEHOLDERS,
  },
  {
    key: "cumpleanos-lider",
    label: "Cumpleaños Líderes",
    endpoint: "/api/plantillas/cumpleanos-lider",
    placeholders: LIDER_PLACEHOLDERS,
  },
] as const;

/** Lista de plantillas de correo disponibles; al elegir una se abre su editor (texto plano). */
export function PlantillasManager() {
  const [activa, setActiva] = useState<(typeof PLANTILLAS)[number] | null>(null);

  if (activa) {
    return <EditorPlantilla plantilla={activa} onVolver={() => setActiva(null)} />;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">Plantillas de correo usadas por el sistema.</p>
      <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
        {PLANTILLAS.map((p) => (
          <li
            key={p.key}
            onClick={() => setActiva(p)}
            className="cursor-pointer px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            {p.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

function EditorPlantilla({ plantilla, onVolver }: { plantilla: (typeof PLANTILLAS)[number]; onVolver: () => void }) {
  const [asunto, setAsunto] = useState("");
  const [contenido, setContenido] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [placeholdersOpen, setPlaceholdersOpen] = useState(false);
  const toast = useToast();

  useEffect(() => {
    let activo = true;
    setLoading(true);
    apiGet<{ contenido: string; asunto: string }>(plantilla.endpoint)
      .then((data) => { if (activo) { setContenido(data.contenido); setAsunto(data.asunto); } })
      .catch((err) => toast.show(err instanceof Error ? err.message : "Error cargando la plantilla", "error"))
      .finally(() => { if (activo) setLoading(false); });
    return () => { activo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plantilla.endpoint]);

  async function handleGuardar() {
    setSaving(true);
    setErrors({});
    try {
      await apiPutJson(plantilla.endpoint, { contenido, asunto: asunto.trim() });
      toast.show("Plantilla guardada", "success");
    } catch (err) {
      if (err instanceof ApiError && err.fields) {
        setErrors(err.fields);
        toast.show(err.message, "error");
      } else {
        toast.show(err instanceof Error ? err.message : "Error al guardar la plantilla", "error");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">{plantilla.label}</h3>
        <button type="button" className="btn-secondary" onClick={onVolver}>← Volver</button>
      </div>

      <div className="card overflow-hidden p-0">
        <button
          type="button"
          className="flex w-full items-center gap-2 px-5 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
          onClick={() => setPlaceholdersOpen((v) => !v)}
        >
          <span>{placeholdersOpen ? "▼" : "▶"}</span> Placeholders disponibles
        </button>
        {placeholdersOpen && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-t border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-5 py-2 font-medium">Placeholder</th>
                <th className="px-5 py-2 font-medium">Reemplaza con</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {plantilla.placeholders.map(([ph, desc]) => (
                <tr key={ph}>
                  <td className="px-5 py-2">
                    <code className="text-brand-700">{ph}</code>
                  </td>
                  <td className="px-5 py-2 text-slate-600">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {loading ? (
        <div className="h-48 animate-pulse rounded-lg bg-slate-100" />
      ) : (
        <>
          <Input
            label="Asunto"
            value={asunto}
            error={errors.asunto}
            onChange={(e) => setAsunto(e.target.value)}
            hint="Admite los mismos placeholders que el contenido"
          />
          <textarea
            value={contenido}
            onChange={(e) => setContenido(e.target.value)}
            rows={12}
            placeholder="Hola $nombre, se te ha asignado una nueva gestión..."
            className="field-input w-full font-mono text-sm"
          />
        </>
      )}

      <div className="flex justify-end gap-2">
        <button type="button" className="btn-primary" disabled={saving || loading} onClick={handleGuardar}>
          Guardar
        </button>
      </div>
    </div>
  );
}
