"use client";

import { useEffect, useState } from "react";
import { Input, Select, RadioGroup, Checkbox } from "@/components/ui/FormControls";
import { LocationSelects } from "@/components/shared/LocationSelects";
import { AtributosCheckboxes, DEFAULT_ATRIBUTOS } from "@/components/shared/AtributosCheckboxes";
import { apiGet, apiPostJson, apiPutJson, ApiError } from "@/lib/api";
import { isValidCedula, isValidCelular, isValidEmail } from "@/lib/validations";
import type { Catalogos } from "@/hooks/useCatalogos";
import type { Atributos, Lider, Referido } from "@/lib/types";
import { useToast } from "@/components/ui/Toast";

interface FormState {
  lider_id: string;
  cedula: string;
  nombre: string;
  apellidos: string;
  sexo: string;
  celular: string;
  email: string;
  direccion: string;
  comuna_id: string;
  barrio_id: string;
  zona_id: string;
  puesto_id: string;
  fecha_nacimiento: string;
  parentesco_id: string;
}

const EMPTY_FORM: FormState = {
  lider_id: "",
  cedula: "",
  nombre: "",
  apellidos: "",
  sexo: "",
  celular: "",
  email: "",
  direccion: "",
  comuna_id: "",
  barrio_id: "",
  zona_id: "",
  puesto_id: "",
  fecha_nacimiento: "",
  parentesco_id: "",
};

interface Props {
  catalogos: Catalogos;
  lideres: Lider[];
  referidoId?: number;
  defaultLiderId?: number;
  onSaved: () => void;
  onCancel: () => void;
}

export function ReferidoForm({ catalogos, lideres, referidoId, defaultLiderId, onSaved, onCancel }: Props) {
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM, lider_id: defaultLiderId ? String(defaultLiderId) : "" });
  const [atributos, setAtributos] = useState<Atributos>(DEFAULT_ATRIBUTOS);
  const [votoAnterior, setVotoAnterior] = useState(false);
  const [damnificado, setDamnificado] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(!!referidoId);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (!referidoId) return;
    apiGet<Referido>(`/api/referidos/${referidoId}`)
      .then((r) => {
        setForm({
          lider_id: String(r.lider_id),
          cedula: r.cedula,
          nombre: r.nombre,
          apellidos: r.apellidos,
          sexo: r.sexo,
          celular: r.celular,
          email: r.email || "",
          direccion: r.direccion,
          comuna_id: String(r.comuna_id),
          barrio_id: String(r.barrio_id),
          zona_id: String(r.zona_id),
          puesto_id: String(r.puesto_id),
          fecha_nacimiento: r.fecha_nacimiento?.slice(0, 10) || "",
          parentesco_id: String(r.parentesco_id),
        });
        setAtributos({
          vehiculo: !!r.vehiculo,
          redes_sociales: !!r.redes_sociales,
          orador_publico: !!r.orador_publico,
          cantante: !!r.cantante,
          testigo_electoral: !!r.testigo_electoral,
        });
        setVotoAnterior(!!r.voto_anterior);
        setDamnificado(!!r.damnificado_terremoto);
      })
      .catch((err) => toast.show(err.message, "error"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [referidoId]);

  function set<K extends keyof FormState>(field: K, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.lider_id) errs.lider_id = "Seleccione el líder";
    if (!form.nombre.trim()) errs.nombre = "Obligatorio";
    if (!form.apellidos.trim()) errs.apellidos = "Obligatorio";
    if (!form.sexo) errs.sexo = "Seleccione el sexo";
    if (!isValidCedula(form.cedula)) errs.cedula = "Cédula inválida";
    if (!isValidCelular(form.celular)) errs.celular = "Celular inválido";
    if (!isValidEmail(form.email)) errs.email = "Email inválido";
    if (!form.direccion.trim()) errs.direccion = "Obligatorio";
    if (!form.comuna_id) errs.comuna_id = "Seleccione la comuna";
    if (!form.barrio_id) errs.barrio_id = "Seleccione el barrio";
    if (!form.zona_id) errs.zona_id = "Seleccione la zona";
    if (!form.puesto_id) errs.puesto_id = "Seleccione el puesto";
    if (!form.fecha_nacimiento) errs.fecha_nacimiento = "Obligatorio";
    if (!form.parentesco_id) errs.parentesco_id = "Seleccione el parentesco";
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
      const payload = { ...form, voto_anterior: votoAnterior, damnificado_terremoto: damnificado, ...atributos };
      if (referidoId) {
        await apiPutJson(`/api/referidos/${referidoId}`, payload);
        toast.show("Referido actualizado correctamente", "success");
      } else {
        await apiPostJson("/api/referidos", payload);
        toast.show("Referido creado correctamente", "success");
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
    return <div className="py-10 text-center text-sm text-slate-400">Cargando datos del referido...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Select
        label="Líder al que pertenece"
        required
        value={form.lider_id}
        error={errors.lider_id}
        onChange={(e) => set("lider_id", e.target.value)}
        options={lideres.map((l) => ({ value: l.id, label: `${l.nombre} ${l.apellidos}` }))}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="Cédula" required value={form.cedula} error={errors.cedula} onChange={(e) => set("cedula", e.target.value)} />
        <Input label="Nombre" required value={form.nombre} error={errors.nombre} onChange={(e) => set("nombre", e.target.value)} />
        <Input label="Apellidos" required value={form.apellidos} error={errors.apellidos} onChange={(e) => set("apellidos", e.target.value)} />
        <RadioGroup
          label="Sexo"
          name="sexo-referido"
          value={form.sexo}
          onChange={(v) => set("sexo", v)}
          options={[{ value: "MASCULINO", label: "Masculino" }, { value: "FEMENINO", label: "Femenino" }]}
        />
        <Input label="Celular" required value={form.celular} error={errors.celular} onChange={(e) => set("celular", e.target.value)} />
        <Input label="Email" type="email" value={form.email} error={errors.email} onChange={(e) => set("email", e.target.value)} />
        <Input label="Dirección" required value={form.direccion} error={errors.direccion} onChange={(e) => set("direccion", e.target.value)} className="sm:col-span-2" />
        <LocationSelects
          catalogos={catalogos}
          values={{ comuna_id: form.comuna_id, barrio_id: form.barrio_id, zona_id: form.zona_id, puesto_id: form.puesto_id }}
          errors={errors}
          onChange={(field, value) => set(field, value)}
        />
        <Input label="Fecha de nacimiento" type="date" required value={form.fecha_nacimiento} error={errors.fecha_nacimiento} onChange={(e) => set("fecha_nacimiento", e.target.value)} />
        <Select
          label="Parentesco con el líder"
          required
          value={form.parentesco_id}
          error={errors.parentesco_id}
          onChange={(e) => set("parentesco_id", e.target.value)}
          options={catalogos.parentescos.map((p) => ({ value: p.id, label: p.descripcion }))}
        />
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Checkbox label="Votó la vez pasada" checked={votoAnterior} onChange={setVotoAnterior} />
        <Checkbox label="Damnificado en terremoto" checked={damnificado} onChange={setDamnificado} />
      </div>

      <AtributosCheckboxes value={atributos} onChange={setAtributos} />

      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={saving}>
          Cancelar
        </button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "Guardando..." : referidoId ? "Guardar cambios" : "Crear referido"}
        </button>
      </div>
    </form>
  );
}
