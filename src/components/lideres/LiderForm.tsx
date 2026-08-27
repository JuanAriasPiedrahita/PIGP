"use client";

import { useEffect, useState } from "react";
import { Input, Select, RadioGroup, Checkbox } from "@/components/ui/FormControls";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { PhotoUpload } from "@/components/ui/PhotoUpload";
import { LocationSelects } from "@/components/shared/LocationSelects";
import { AtributosCheckboxes, DEFAULT_ATRIBUTOS } from "@/components/shared/AtributosCheckboxes";
import { apiGet, apiPostForm, apiPutForm, ApiError } from "@/lib/api";
import { isValidCedula, isValidCelular, isValidEmail } from "@/lib/validations";
import type { Catalogos } from "@/hooks/useCatalogos";
import type { Atributos, Lider } from "@/lib/types";
import { useToast } from "@/components/ui/Toast";

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
  estado: string;
  usuario: string;
  clave: string;
  objeto_contrato: string;
  vencimiento_contrato: string;
  dependencia_id: string;
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
  estado: "ACTIVO",
  usuario: "",
  clave: "",
  objeto_contrato: "",
  vencimiento_contrato: "",
  dependencia_id: "",
};

interface Props {
  catalogos: Catalogos;
  liderId?: number;
  onSaved: () => void;
  onCancel: () => void;
}

export function LiderForm({ catalogos, liderId, onSaved, onCancel }: Props) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [atributos, setAtributos] = useState<Atributos>(DEFAULT_ATRIBUTOS);
  const [contratista, setContratista] = useState(false);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(!!liderId);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (!liderId) return;
    apiGet<Lider>(`/api/lideres/${liderId}`)
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
          estado: l.estado,
          usuario: l.usuario || "",
          clave: l.clave || "",
          objeto_contrato: l.objeto_contrato || "",
          vencimiento_contrato: l.vencimiento_contrato?.slice(0, 10) || "",
          dependencia_id: l.dependencia_id ? String(l.dependencia_id) : "",
        });
        setAtributos({
          vehiculo: !!l.vehiculo,
          redes_sociales: !!l.redes_sociales,
          orador_publico: !!l.orador_publico,
          cantante: !!l.cantante,
          testigo_electoral: !!l.testigo_electoral,
        });
        setContratista(!!l.contratista);
        setFotoUrl(l.foto || null);
      })
      .catch((err) => toast.show(err.message, "error"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liderId]);

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
    if (contratista) {
      if (!form.objeto_contrato.trim()) errs.objeto_contrato = "Obligatorio";
      if (!form.vencimiento_contrato) errs.vencimiento_contrato = "Obligatorio";
      if (!form.dependencia_id) errs.dependencia_id = "Seleccione la dependencia";
    }
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
      fd.set("contratista", String(contratista));
      if (fotoFile) fd.append("foto", fotoFile);

      if (liderId) {
        await apiPutForm(`/api/lideres/${liderId}`, fd);
        toast.show("Líder actualizado correctamente", "success");
      } else {
        await apiPostForm("/api/lideres", fd);
        toast.show("Líder creado correctamente", "success");
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
    return <div className="py-10 text-center text-sm text-slate-400">Cargando datos del líder...</div>;
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
        <RadioGroup
          label="Estado"
          name="estado"
          value={form.estado}
          onChange={(v) => set("estado", v)}
          options={[{ value: "ACTIVO", label: "Activo" }, { value: "INACTIVO", label: "Inactivo" }]}
        />
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
            hint={
              liderId
                ? form.clave
                  ? "Esta es la clave actual del líder — cámbiala para asignar una nueva"
                  : "Sin clave asignada todavía. Sin cambios si se deja en blanco"
                : "Opcional, mín. 4 caracteres"
            }
          />
        </div>
      </div>

      <AtributosCheckboxes value={atributos} onChange={setAtributos} />

      <div className="space-y-4 border-t border-slate-100 pt-4">
        <Checkbox label="Contratista" checked={contratista} onChange={setContratista} />
        {contratista && (
          <div className="grid grid-cols-1 gap-4 rounded-lg bg-slate-50 p-4 sm:grid-cols-2">
            <Input
              label="Objeto del contrato"
              required
              value={form.objeto_contrato}
              error={errors.objeto_contrato}
              onChange={(e) => set("objeto_contrato", e.target.value)}
              className="sm:col-span-2"
            />
            <Input
              label="Vencimiento"
              type="date"
              required
              value={form.vencimiento_contrato}
              error={errors.vencimiento_contrato}
              onChange={(e) => set("vencimiento_contrato", e.target.value)}
            />
            <Select
              label="Dependencia"
              required
              value={form.dependencia_id}
              error={errors.dependencia_id}
              onChange={(e) => set("dependencia_id", e.target.value)}
              options={catalogos.dependencias.map((d) => ({ value: d.id, label: d.descripcion }))}
            />
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={saving}>
          Cancelar
        </button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "Guardando..." : liderId ? "Guardar cambios" : "Crear líder"}
        </button>
      </div>
    </form>
  );
}
