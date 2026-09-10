# Plan: Módulo de Eventos

## Contexto / decisiones de diseño
- Cada evento: nombre, ubicación, fecha, hora.
- Listado `/eventos` ordenado en dos bloques:
  1. **Próximos a ocurrir** (fecha+hora >= ahora), del más cercano al más lejano.
  2. **Ya realizados** (fecha+hora < ahora), del más antiguo al más reciente — van
     inmediatamente después del bloque anterior.
  - Colores distintos por bloque (ej. verde/ámbar "Próximo" vs. gris "Realizado").
- Clic en un evento → pantalla de detalle: formulario editable (nombre/ubicación/
  fecha/hora) y, debajo, un buscador de referidos por nombre/cédula para ir
  registrando asistentes (clic en un resultado = lo agrega a la lista de
  asistentes de ese evento, sin salir de la pantalla).
- Reutiliza el patrón ya existente en el módulo de Gestiones (búsqueda de
  referidos con debounce, Modal, ConfirmDialog, toasts).

## Base de datos (`sql/schema.sql`, no destructivo — solo tablas nuevas)
- [x] Tabla `eventos` (id, nombre, ubicacion, fecha DATE, hora TIME, timestamps)
- [x] Tabla `evento_asistentes` (id, evento_id FK→eventos ON DELETE CASCADE,
      referido_id FK→referidos ON DELETE CASCADE, timestamps, UNIQUE
      (evento_id, referido_id) para no duplicar asistencia)
- [x] Índices: evento_asistentes(evento_id)
- [x] Ejecutar el script contra la base `PIGP` local (solo el bloque nuevo)

## Backend (API routes)
- [x] `GET/POST /api/eventos` — listado con el orden de dos bloques descrito
      arriba (incluye total de asistentes por evento); crear evento
- [x] `GET/PUT/DELETE /api/eventos/[id]` — detalle, editar, eliminar
- [x] `GET/POST /api/eventos/[id]/asistentes` — listar asistentes registrados;
      registrar asistencia de un referido (referido_id)
- [x] `DELETE /api/eventos/[id]/asistentes/[asistenteId]` — quitar un asistente
- [x] Reutiliza `GET /api/referidos?q=` (ya existe) para el buscador por
      nombre/cédula — no requiere endpoint nuevo

## Frontend
- [x] Tipos `Evento` y `EventoAsistente` en `src/lib/types.ts`
- [x] Ítem "Eventos" en el menú lateral (`Sidebar.tsx`)
- [x] `src/app/eventos/page.tsx` — listado (próximos vs. realizados con color
      distinto), botón "Nuevo evento" (modal con formulario), clic en fila →
      `/eventos/[id]`
- [x] `src/components/eventos/EventoForm.tsx` — formulario crear/editar
      (nombre, ubicación, fecha, hora)
- [x] `src/app/eventos/[id]/page.tsx` — detalle: formulario editable arriba +
      buscador de referidos + tabla de asistentes registrados (con opción de
      quitar)

## Cierre
- [x] `npx tsc --noEmit` sin errores
- [x] Sección de revisión al final de este archivo

---

## Revisión final

**Qué se construyó:** módulo completo de Eventos — 2 tablas nuevas
(`eventos`, `evento_asistentes`), 5 endpoints API, un formulario reutilizable
(crear/editar), la página de listado `/eventos` y la de detalle
`/eventos/[id]` con registro de asistencia.

**Decisión validada contigo antes de programar:** los eventos ya realizados
se listan del más antiguo al más reciente (orden ascendente literal), no al
revés — confirmaste esa opción explícitamente.

**Orden del listado (verificado con datos de prueba reales contra la BD):**
próximos del más cercano al más lejano, luego pasados del más antiguo al más
reciente — usa `TIMESTAMP(fecha, hora)` combinando las dos columnas para
comparar correctamente incluso cuando dos eventos comparten la misma fecha.

**Colores:** fila con borde izquierdo y badge verde esmeralda ("Próximo") vs.
borde y badge gris ("Realizado") en `/eventos`.

**Verificación realizada en este entorno (no solo compilación):** levanté un
servidor de desarrollo en un puerto aparte (sin tocar el `npm run dev` que
ya tenías corriendo), autenticado con sesión real, y probé contra la base de
datos: crear 5 eventos con fechas variadas y confirmar el orden exacto,
editar un evento, buscar un referido real por nombre, registrarlo como
asistente, verificar que el endpoint de duplicados lo rechaza, quitar un
asistente, y borrar los eventos de prueba (confirmando el `ON DELETE CASCADE`
sobre `evento_asistentes`). Sin datos de prueba dejados en la base.

**Pendiente para ti:** revisar visualmente `/eventos` en el navegador
(colores, responsive) y decidir si quieres subir estos cambios a GitHub.
