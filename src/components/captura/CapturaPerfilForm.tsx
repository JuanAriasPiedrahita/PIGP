"use client";

import { useEffect, useState } from "react";
import { Input, Select, RadioGroup } from "@/components/ui/FormControls";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { PhotoUpload } from "@/components/ui/PhotoUpload";
import { LocationSelects } from "@/components/shared/LocationSelects";
import { AtributosCheckboxes, DEFAULT_ATRIBUTOS } from "@/components/shared/AtributosCheckboxes";
import { apiGet, apiPutForm, ApiError } from "@/lib/api";
import { isValidCedula, isValidCelular, isValidEmail } from "@/lib/validations";
import type { Catalogos } from "@/hooks/useCatalogos";
import type { Atributos } from "@/lib/types";
import { useToast } from "@/components/ui/Toast";

interface PerfilLider {
  nombre: string;
  apellidos: string;
  sexo: string;
  cedula: string;
  celular: string;
  email: string | null;
  comuna_id: number;
  barrio_id: number;
  direccion: string;
  zona_id: number;
  puesto_id: number;
  profesion_id: number | null;
  ocupacion_id: number | null;
  fecha_nacimiento: string;
  foto: string | null;
  usuario: string | null;
  clave: string | null;
  vehiculo: boolean;
  redes_sociales: boolean;
  orador_publico: boolean;
  cantante: boolean;
  testigo_electoral: boolean;
}

interface FormState {
  nombre: string;
  apellidos: string;
  sexo: string;
  cedula: string;
  celular: string;
  email: string;
  comuna_id: string;
  barrio_id: string;
  direccion: string;
  zona_id: string;
  puesto_id: string;
  profesion_id: string;
  ocupacion_id: string;
  fecha_nacimiento: string;
  usuario: string;
  clave: string;
}

const EMPTY_FORM: FormState = {
  nombre: "",
  apellidos: "",
  sexo: "",
  cedula: "",
  celular: "",
  email: "",
  comuna_id: "",
  barrio_id: "",
  direccion: "",
  zona_id: "",
  puesto_id: "",
  profesion_id: "",
  ocupacion_id: "",
  fecha_nacimiento: "",
  usuario: "",
  clave: "",
};

interface Props {
  catalogos: Catalogos;
  onSaved: () => void;
}

/** Formulario de "Mi Cuenta" en /captura: igual al de líderes del panel admin, pero sin estado/contratista/Equipo Logístico. */
export function CapturaPerfilForm({ catalogos, onSaved }: Props) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [atributos, setAtributos] = useState<Atributos>(DEFAULT_ATRIBUTOS);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    apiGet<PerfilLider>("/api/captura/perfil")
      .then((l) => {
        setForm({
          nombre: l.nombre,
          apellidos: l.apellidos,
          sexo: l.sexo,
          cedula: l.cedula,
          celular: l.celular,
          email: l.email || "",
          comuna_id: String(l.comuna_id),
          barrio_id: String(l.barrio_id),
          direccion: l.direccion,
          zona_id: String(l.zona_id),
          puesto_id: String(l.puesto_id),
          profesion_id: l.profesion_id ? String(l.profesion_id) : "",
          ocupacion_id: l.ocupacion_id ? String(l.ocupacion_id) : "",
          fecha_nacimiento: l.fecha_nacimiento?.slice(0, 10) || "",
          usuario: l.usuario || "",
          clave: l.clave || "",
        });
        setAtributos({
          vehiculo: !!l.vehiculo,
          redes_sociales: !!l.redes_sociales,
          orador_publico: !!l.orador_publico,
          cantante: !!l.cantante,
          testigo_electoral: !!l.testigo_electoral,
        });
        setFotoUrl(l.foto || null);
      })
      .catch((err) => toast.show(err instanceof Error ? err.message : "Error cargando sus datos", "error"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function set<K extends keyof FormState>(field: K, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.nombre.trim()) errs.nombre = "Obligatorio";
    if (!form.apellidos.trim()) errs.apellidos = "Obligatorio";
    if (!form.sexo) errs.sexo = "Seleccione el sexo";
    if (!isValidCedula(form.cedula)) errs.cedula = "Cédula inválida";
    if (!isValidCelular(form.celular)) errs.celular = "Celular inválido";
    if (!isValidEmail(form.email)) errs.email = "Email inválido";
    if (!form.comuna_id) errs.comuna_id = "Seleccione la comuna";
    if (!form.barrio_id) errs.barrio_id = "Seleccione el barrio";
    if (!form.direccion.trim()) errs.direccion = "Obligatorio";
    if (!form.zona_id) errs.zona_id = "Seleccione la zona";
    if (!form.puesto_id) errs.puesto_id = "Seleccione el puesto";
    if (!form.fecha_nacimiento) errs.fecha_nacimiento = "Obligatorio";
    if (form.clave && form.clave.length < 4) errs.clave = "Mínimo 4 caracteres";
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
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      Object.entries(atributos).forEach(([k, v]) => fd.append(k, String(v)));
      if (fotoFile) fd.append("foto", fotoFile);

      await apiPutForm("/api/captura/perfil", fd);
      toast.show("Datos actualizados correctamente", "success");
      onSaved();
    } catch (err) {
      if (err instanceof ApiError && err.fields) setErrors(err.fields);
      toast.show(err instanceof Error ? err.message : "Error al guardar", "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="py-10 text-center text-sm text-slate-400">Cargando sus datos...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <div className="order-first sm:order-last">
          <PhotoUpload initialUrl={fotoUrl} onFileSelected={setFotoFile} />
        </div>
        <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Nombre" required value={form.nombre} error={errors.nombre} onChange={(e) => set("nombre", e.target.value)} />
          <Input label="Apellidos" required value={form.apellidos} error={errors.apellidos} onChange={(e) => set("apellidos", e.target.value)} />
          <RadioGroup
            label="Sexo"
            name="sexo"
            value={form.sexo}
            onChange={(v) => set("sexo", v)}
            options={[{ value: "MASCULINO", label: "Masculino" }, { value: "FEMENINO", label: "Femenino" }]}
          />
          {errors.sexo && <p className="field-error -mt-3">{errors.sexo}</p>}
          <Input label="Cédula" required value={form.cedula} error={errors.cedula} onChange={(e) => set("cedula", e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="Celular" required value={form.celular} error={errors.celular} onChange={(e) => set("celular", e.target.value)} />
        <Input label="Email" type="email" value={form.email} error={errors.email} onChange={(e) => set("email", e.target.value)} />
        <LocationSelects
          catalogos={catalogos}
          values={{ comuna_id: form.comuna_id, barrio_id: form.barrio_id, zona_id: form.zona_id, puesto_id: form.puesto_id }}
          errors={errors}
          onChange={(field, value) => set(field, value)}
        />
        <Input label="Dirección" required value={form.direccion} error={errors.direccion} onChange={(e) => set("direccion", e.target.value)} className="sm:col-span-2" />
        <Select
          label="Profesión"
          value={form.profesion_id}
          onChange={(e) => set("profesion_id", e.target.value)}
          options={catalogos.profesiones.map((p) => ({ value: p.id, label: p.descripcion }))}
        />
        <Select
          label="Ocupación"
          value={form.ocupacion_id}
          onChange={(e) => set("ocupacion_id", e.target.value)}
          options={catalogos.ocupaciones.map((o) => ({ value: o.id, label: o.descripcion }))}
        />
        <Input label="Fecha de nacimiento" type="date" required value={form.fecha_nacimiento} error={errors.fecha_nacimiento} onChange={(e) => set("fecha_nacimiento", e.target.value)} />
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="w-36">
          <Input label="Usuario" value={form.usuario} error={errors.usuario} onChange={(e) => set("usuario", e.target.value)} autoComplete="username" />
        </div>
        <div className="w-36">
          <PasswordInput
            label="Clave"
            value={form.clave}
            error={errors.clave}
            onChange={(v) => set("clave", v)}
            hint={form.clave ? "Esta es su clave actual — cámbiela para asignar una nueva" : "Sin clave asignada todavía"}
          />
        </div>
      </div>

      <AtributosCheckboxes value={atributos} onChange={setAtributos} />

      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}
