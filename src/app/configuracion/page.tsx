"use client";

import { useState } from "react";
import { SimpleCatalogManager } from "@/components/catalogos/SimpleCatalogManager";

const TABS = [
  { key: "profesiones", label: "Profesiones", endpoint: "/api/profesiones", singular: "profesión", placeholder: "Ej: Ingeniero(a)" },
  { key: "ocupaciones", label: "Ocupaciones", endpoint: "/api/ocupaciones", singular: "ocupación", placeholder: "Ej: Independiente" },
  { key: "parentescos", label: "Parentescos", endpoint: "/api/parentescos", singular: "parentesco", placeholder: "Ej: Hermano(a)" },
] as const;

export default function ConfiguracionPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("profesiones");
  const active = TABS.find((t) => t.key === tab)!;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Configuración</h2>
        <p className="text-sm text-slate-500">Tablas accesorias usadas en los formularios de líderes y referidos.</p>
      </div>

      <div className="card p-2">
        <div className="flex gap-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                tab === t.key ? "bg-brand-700 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card p-5">
        <SimpleCatalogManager endpoint={active.endpoint} singular={active.singular} placeholder={active.placeholder} />
      </div>
    </div>
  );
}
