"use client";

import { Select } from "@/components/ui/FormControls";
import type { Catalogos } from "@/hooks/useCatalogos";

interface LocationValues {
  comuna_id: string;
  barrio_id: string;
  zona_id: string;
  puesto_id: string;
}

interface Props {
  catalogos: Catalogos;
  values: LocationValues;
  errors?: Partial<Record<keyof LocationValues, string>>;
  onChange: (field: keyof LocationValues, value: string) => void;
}

/** Combos en cascada: Comuna -> Barrio, y Zona -> Puesto de votación. */
export function LocationSelects({ catalogos, values, errors, onChange }: Props) {
  const barriosDisponibles = catalogos.barrios.filter((b) => String(b.comuna_id) === values.comuna_id);
  const puestosDisponibles = catalogos.puestos.filter((p) => String(p.zona_id) === values.zona_id);

  return (
    <>
      <Select
        label="Comuna"
        required
        value={values.comuna_id}
        error={errors?.comuna_id}
        onChange={(e) => {
          onChange("comuna_id", e.target.value);
          onChange("barrio_id", "");
        }}
        options={catalogos.comunas.map((c) => ({ value: c.id, label: c.descripcion }))}
      />
      <Select
        label="Barrio"
        required
        value={values.barrio_id}
        error={errors?.barrio_id}
        disabled={!values.comuna_id}
        onChange={(e) => onChange("barrio_id", e.target.value)}
        options={barriosDisponibles.map((b) => ({ value: b.id, label: b.nombre }))}
        placeholder={values.comuna_id ? "Seleccione..." : "Seleccione primero la comuna"}
      />
      <Select
        label="Zona de votación"
        required
        value={values.zona_id}
        error={errors?.zona_id}
        onChange={(e) => {
          onChange("zona_id", e.target.value);
          onChange("puesto_id", "");
        }}
        options={catalogos.zonas.map((z) => ({ value: z.id, label: z.codigo }))}
      />
      <Select
        label="Puesto de votación"
        required
        value={values.puesto_id}
        error={errors?.puesto_id}
        disabled={!values.zona_id}
        onChange={(e) => onChange("puesto_id", e.target.value)}
        options={puestosDisponibles.map((p) => ({ value: p.id, label: `${p.numero} - ${p.nombre}` }))}
        placeholder={values.zona_id ? "Seleccione..." : "Seleccione primero la zona"}
      />
    </>
  );
}
