export type Sexo = "MASCULINO" | "FEMENINO";
export type Estado = "ACTIVO" | "INACTIVO";

export interface Zona {
  id: number;
  codigo: string;
}

export interface Puesto {
  id: number;
  zona_id: number;
  numero: string;
  nombre: string;
  direccion: string | null;
  num_mesas: number;
}

export interface Comuna {
  id: number;
  descripcion: string;
}

export interface Barrio {
  id: number;
  comuna_id: number;
  nombre: string;
}

export interface Profesion {
  id: number;
  descripcion: string;
}

export interface Ocupacion {
  id: number;
  descripcion: string;
}

export interface Parentesco {
  id: number;
  descripcion: string;
}

export interface Dependencia {
  id: number;
  descripcion: string;
}

export interface Atributos {
  vehiculo: boolean;
  redes_sociales: boolean;
  orador_publico: boolean;
  cantante: boolean;
  testigo_electoral: boolean;
}

export interface Lider extends Atributos {
  id: number;
  nombre: string;
  apellidos: string;
  sexo: Sexo;
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
  estado: Estado;
  foto: string | null;
  usuario: string | null;
  // "clave" solo viene poblada al pedir un líder individual (edición); en el
  // listado nunca se selecciona/retorna. Va descifrada (ver src/lib/liderClave.ts).
  clave?: string | null;
  contratista: boolean;
  objeto_contrato: string | null;
  vencimiento_contrato: string | null;
  dependencia_id: number | null;
  edad?: number;
  comuna_descripcion?: string;
  barrio_nombre?: string;
  zona_codigo?: string;
  puesto_nombre?: string;
  profesion_descripcion?: string | null;
  ocupacion_descripcion?: string | null;
  dependencia_descripcion?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Referido extends Atributos {
  id: number;
  lider_id: number;
  cedula: string;
  nombre: string;
  apellidos: string;
  sexo: Sexo;
  celular: string;
  email: string | null;
  direccion: string;
  comuna_id: number;
  barrio_id: number;
  zona_id: number;
  puesto_id: number;
  fecha_nacimiento: string;
  parentesco_id: number;
  voto_anterior: boolean;
  damnificado_terremoto: boolean;
  lider_nombre?: string;
  comuna_descripcion?: string;
  barrio_nombre?: string;
  zona_codigo?: string;
  puesto_nombre?: string;
  parentesco_descripcion?: string;
  created_at?: string;
  updated_at?: string;
}
