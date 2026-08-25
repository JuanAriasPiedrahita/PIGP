# Plan: App de Registro de Colaboradores para Campaña Política

## Stack
Next.js 14 (App Router) + TypeScript + Tailwind CSS + mysql2 (pool) contra MariaDB/MySQL en 127.0.0.1, user root / pass juanda2005, base de datos `campana_politica`.

## Modelo de datos (script SQL inicial)
- [x] `zonas` (id, codigo CHAR(2) UNIQUE, nombre)
- [x] `puestos` (id, zona_id FK, numero CHAR(2), nombre, num_mesas) — único (zona_id, numero)
- [x] `comunas` (id, codigo, descripcion)
- [x] `barrios` (id, comuna_id FK, nombre)
- [x] `profesiones` (id, descripcion)
- [x] `ocupaciones` (id, descripcion)
- [x] `parentescos` (id, descripcion)
- [x] `lideres` (datos personales + comuna/barrio/zona/puesto/profesion/ocupacion FKs + fecha_nacimiento + estado + foto (ruta) + usuario + clave (hash) + 5 checkboxes de atributos + timestamps)
- [x] `referidos` (lider_id FK + datos personales + comuna/barrio/zona/puesto FKs + fecha_nacimiento + parentesco_id FK + voto_anterior + damnificado_terremoto + 5 checkboxes de atributos + timestamps)
- [x] Datos semilla mínimos (zonas/puestos/comunas/barrios/profesiones/ocupaciones/parentescos de ejemplo)

## Backend (API routes bajo app/api)
- [x] Pool de conexión mysql2 reutilizable (lib/db.ts)
- [x] CRUD zonas, puestos (por zona), comunas, barrios (por comuna), profesiones, ocupaciones, parentescos
- [x] CRUD lideres (subida de foto a /public/uploads/lideres y hash de clave con bcrypt)
- [x] CRUD referidos (filtrable por lider_id)
- [x] Endpoint dashboard: totales de líderes y referidos + estadísticas adicionales

## Frontend
- [x] Layout base con Sidebar tipo "hamburguesa" (oculto por defecto, toggle) + topbar
- [x] Dashboard (totales líderes/referidos, líderes por comuna, top líderes)
- [x] Página Líderes: tabla + formulario crear/editar completo (combos en cascada, checkboxes, radio Activo/Inactivo, foto con preview, clave con toggle)
- [x] Página Referidos: listado + filtro por líder + formulario crear/editar
- [x] Página Configuración: CRUD de profesiones, ocupaciones, parentescos (tabs)
- [x] Página Zonas: CRUD de zonas y sus puestos
- [x] Página Comunas: CRUD de comunas y sus barrios
- [x] Componentes reutilizables: Select en cascada, date input estilizado, Modal, Toast
- [x] Validaciones de formulario y manejo de errores de API
- [x] Diseño responsive, paleta sobria (slate/azul marino)

## Cierre
- [x] .env.local con credenciales de conexión
- [x] README con instrucciones de instalación, ejecución y pruebas
- [x] Sección de revisión (abajo)

---

## Revisión final

**Qué se construyó:** aplicación Next.js 14 (App Router + TypeScript + Tailwind) completa para gestionar líderes y referidos de una campaña política, con 9 tablas en MySQL/MariaDB (`zonas`, `puestos`, `comunas`, `barrios`, `profesiones`, `ocupaciones`, `parentescos`, `lideres`, `referidos`), API REST propia para cada entidad, subida de foto de líder a disco, hash de clave con bcrypt, combos en cascada (comuna→barrio, zona→puesto), menú hamburguesa oculto por defecto, dashboard con totales/estadísticas, y páginas de administración de catálogos (Configuración, Zonas, Comunas).

**Verificación realizada en este entorno:**
- `npm install` y `npm run build` sin errores (TypeScript estricto).
- Script `sql/schema.sql` ejecutado contra el MySQL80 local (127.0.0.1, root) — 9 tablas + datos semilla creados.
- Servidor `npm run dev` levantado y probado con peticiones reales: creación de un líder (multipart/foto), creación de un referido asociado, filtro de referidos por líder, y endpoint de dashboard reflejando los totales — luego se limpiaron los datos de prueba.
- Se actualizó `next` a la última versión parcheada de la rama 14 (14.2.35) para cerrar el aviso de seguridad de la 14.2.15 inicial.

**Decisiones tomadas sin preguntar (por ser estándar/no ambiguas):**
- La clave del líder se guarda hasheada con bcrypt (el campo del formulario sigue funcionando igual, solo cambia cómo se persiste).
- El date picker se implementó con `<input type="date">` nativo estilizado con Tailwind, en vez de una librería externa, para no añadir dependencias innecesarias.
- Las fotos se guardan en disco (`public/uploads/lideres`) en vez de como BLOB en la BD, por simplicidad y rendimiento.

**Pendiente para el usuario:** revisar visualmente la app en el navegador y confirmar que el look & feel cumple sus expectativas; los datos de zonas/comunas/catálogos sembrados son solo de ejemplo y deben reemplazarse por los reales de la campaña.
