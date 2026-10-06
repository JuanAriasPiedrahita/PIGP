"use client";

import { Checkbox } from "@/components/ui/FormControls";
import type { Atributos } from "@/lib/types";

const ATRIBUTOS_META: { key: keyof Atributos; label: string }[] = [
  { key: "vehiculo", label: "Vehículo" },
  { key: "redes_sociales", label: "Redes sociales" },
  { key: "orador_publico", label: "Orador en público" },
  { key: "cantante", label: "Cantante" },
  { key: "testigo_electoral", label: "Testigo electoral" },
];

interface Props {
  value: Atributos;
  onChange: (value: Atributos) => void;
  /** Checkboxes adicionales (no parte de Atributos) para compartir la misma grilla, ej. en LiderForm. */
  children?: React.ReactNode;
}

export function AtributosCheckboxes({ value, onChange, children }: Props) {
  return (
    <div>
      <span className="field-label">Atributos</span>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {ATRIBUTOS_META.map((a) => (
          <Checkbox
            key={a.key}
            label={a.label}
            checked={value[a.key]}
            onChange={(checked) => onChange({ ...value, [a.key]: checked })}
          />
        ))}
        {children}
      </div>
    </div>
  );
}

export const DEFAULT_ATRIBUTOS: Atributos = {
  vehiculo: false,
  redes_sociales: false,
  orador_publico: false,
  cantante: false,
  testigo_electoral: false,
};
