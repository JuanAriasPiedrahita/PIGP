"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPutJson } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";

const PLANTILLAS = [
  { key: "gestion-nueva", label: "Gestiones nuevas", endpoint: "/api/plantillas/gestion-nueva" },
] as const;

/** Lista de plantillas de correo disponibles; al elegir una se abre su editor (texto plano). */
export function PlantillasManager() {
  const [activa, setActiva] = useState<(typeof PLANTILLAS)[number] | null>(null);

  if (activa) {
    return <EditorPlantilla plantilla={activa} onVolver={() => setActiva(null)} />;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        Plantillas de correo usadas por el sistema. El placeholder <code>$nombre</code> se reemplaza por el
        nombre del destinatario.
      </p>
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
  const [contenido, setContenido] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    let activo = true;
    setLoading(true);
    apiGet<{ contenido: string }>(plantilla.endpoint)
      .then((data) => { if (activo) setContenido(data.contenido); })
      .catch((err) => toast.show(err instanceof Error ? err.message : "Error cargando la plantilla", "error"))
      .finally(() => { if (activo) setLoading(false); });
    return () => { activo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plantilla.endpoint]);

  async function handleGuardar() {
    setSaving(true);
    try {
      await apiPutJson(plantilla.endpoint, { contenido });
      toast.show("Plantilla guardada", "success");
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Error al guardar la plantilla", "error");
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

      {loading ? (
        <div className="h-48 animate-pulse rounded-lg bg-slate-100" />
      ) : (
        <textarea
          value={contenido}
          onChange={(e) => setContenido(e.target.value)}
          rows={12}
          placeholder="Hola $nombre, se te ha asignado una nueva gestión..."
          className="field-input w-full font-mono text-sm"
        />
      )}

      <div className="flex justify-end gap-2">
        <button type="button" className="btn-primary" disabled={saving || loading} onClick={handleGuardar}>
          Guardar
        </button>
      </div>
    </div>
  );
}
