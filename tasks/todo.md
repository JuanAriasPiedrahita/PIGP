# Plan: Coordinadores de logística pueden editar eventos y gestionar asistentes desde /captura

## Contexto encontrado
- `/captura/eventos` (zona de líderes) hoy es **de solo lectura**: lista eventos
  vía `GET /api/captura/eventos`, protegido con `requireLider` (sesión de
  líder, cookie `pigp_lider_session`). No hay edición ni manejo de asistentes
  ahí — eso solo existe en el panel admin (`/eventos/[id]`), protegido por
  sesión de **administrador** (middleware separa `/api/captura/*` de todo lo
  demás; un líder no puede llamar `/api/eventos*`).
- La sesión de líder (`LiderSession` en `src/lib/liderSession.ts`) hoy solo
  guarda `{ id, nombre }` — no sabe si el líder es coordinador de logística.
  Hay que agregar `coordinador_logistica` ahí y propagarlo desde el login
  (`/api/captura/auth/login`), que ya consulta la tabla `lideres`.
- El panel admin ya tiene todo lo necesario para clonar hacia líderes:
  - `EventoForm.tsx`: formulario de datos del evento (nombre, ubicación,
    fecha, hora, duración), hoy apunta fijo a `/api/eventos`.
  - `/eventos/[id]/page.tsx`: buscador de referidos + alta/baja de
    asistentes, hoy contra `/api/eventos/[id]/asistentes*` y
    `/api/referidos?q=` (búsqueda **sin restringir por líder** — el admin
    puede agregar cualquier referido de cualquier líder como asistente).
- **Decisión que asumo** (dime si prefieres otra cosa): un coordinador de
  logística podrá buscar y agregar como asistente a **cualquier referido,
  de cualquier líder** — igual que hace el admin hoy — porque la logística
  de un evento no depende de quién refirió a cada persona. Esto requiere un
  endpoint nuevo de búsqueda de referidos accesible con sesión de líder
  (hoy `/api/referidos` es solo-admin), que por diseño no se restringe al
  líder autenticado. Si prefieres que el coordinador solo pueda agregar
  referidos de su propia lista, lo ajusto.
- Eliminar eventos sigue siendo **solo admin** (no lo pediste); el
  coordinador solo modifica datos del evento y gestiona asistentes.

## Backend
- [x] `src/lib/liderSession.ts`: agregar `coordinador_logistica: boolean` a
      `LiderSession` (se firma y viaja en la cookie).
- [x] `src/app/api/captura/auth/login/route.ts`: incluir
      `coordinador_logistica` en el `SELECT` a `lideres` y pasarlo a
      `createLiderSessionToken`.
- [x] `src/lib/requireLider.ts`: agregar `requireCoordinadorLogistica(req)`
      que reutiliza `requireLider` y además exige el flag (devuelve `null`
      si no es coordinador, para responder 403).
- [x] `src/app/api/captura/eventos/[id]/route.ts` (nuevo): `GET` y `PUT`
      iguales a los de `/api/eventos/[id]` pero protegidos con
      `requireCoordinadorLogistica`.
- [x] `src/app/api/captura/eventos/[id]/asistentes/route.ts` (nuevo): `GET`
      y `POST` iguales a los de `/api/eventos/[id]/asistentes`, protegidos
      con `requireCoordinadorLogistica`.
- [x] `src/app/api/captura/eventos/[id]/asistentes/[asistenteId]/route.ts`
      (nuevo): `DELETE` igual al admin, protegido con
      `requireCoordinadorLogistica`.
- [x] `src/app/api/captura/eventos/buscar-referidos/route.ts` (nuevo): `GET
      ?q=` protegido con `requireCoordinadorLogistica`; busca por
      nombre/apellidos/cédula en **todos** los referidos (sin filtrar por
      líder) y devuelve los campos mínimos que necesita el buscador
      (id, nombre, apellidos, cedula, barrio_nombre).
- [x] (hallazgo extra) `src/app/api/auth/login/route.ts` — el login
      unificado de `/login` también crea sesión de líder y le faltaba el
      mismo cambio; se corrigió ahí también (lo detectó `tsc`).

## Frontend
- [x] `src/lib/types.ts`: tipo liviano `ReferidoBusqueda` (id, nombre,
      apellidos, cedula, barrio_nombre) para el buscador de asistentes.
- [x] `src/components/eventos/EventoForm.tsx`: nuevo prop opcional
      `apiBase` (default `/api/eventos`) para poder reusarlo también contra
      `/api/captura/eventos`.
- [x] `src/components/eventos/EventoAsistentesManager.tsx` (nuevo): extraigo
      el bloque de "buscar y agregar / quitar asistentes" que hoy vive
      inline en `/eventos/[id]/page.tsx`, parametrizado por `apiBase` y por
      la URL de búsqueda de referidos — para no duplicar ~120 líneas entre
      el panel admin y la vista nueva de líderes.
- [x] `src/app/eventos/[id]/page.tsx`: lo actualizo para usar
      `EventoAsistentesManager` (mismo comportamiento de hoy, sin cambios
      visibles) en vez del bloque inline.
- [x] `src/hooks/useLiderSesion.ts` (nuevo): como `useNombreLider` pero
      devuelve también `coordinadorLogistica` (de `/api/captura/auth/me`).
- [x] `src/app/captura/eventos/page.tsx`: usar `useLiderSesion`; si el líder
      es coordinador, las filas de la tabla son clicables y llevan a
      `/captura/eventos/[id]`; si no, se queda exactamente como hoy
      (solo lectura).
- [x] `src/app/captura/eventos/[id]/page.tsx` (nuevo): mismo layout que la
      vista admin (`EventoForm` + `EventoAsistentesManager`, apuntando a
      `/api/captura/eventos`), con `CapturaSidebar`/`CapturaHeader`. Si el
      líder autenticado no es coordinador, lo redirige de vuelta a
      `/captura/eventos` (la API ya lo bloquea con 403; esto es solo mejor
      UX).

## Cierre
- [x] `npx tsc --noEmit` sin errores
- [x] Prueba funcional end-to-end contra el servidor de dev (`localhost:3000`)
      y la base de datos local, con dos líderes reales:
      - `elopez` (coordinador): `GET`/`PUT` del evento 7, `GET` de
        asistentes, búsqueda de referidos, `POST` y `DELETE` de un
        asistente de prueba (se dejó el evento igual que antes) — todo
        `200`/`201`.
      - `alvaro` (líder normal, no coordinador): los 3 endpoints nuevos
        responden `403 No autorizado`; la lista de solo lectura
        (`GET /api/captura/eventos`) sigue funcionando normal (`200`).
      - Sin sesión: `401` (lo bloquea el middleware antes de llegar a la
        ruta).
      - Las páginas `/captura/eventos` y `/captura/eventos/7` cargan
        `200` con la sesión de `elopez`.
- [x] Sección de revisión al final de este archivo

---

## Revisión final

**Qué se construyó:** los líderes marcados como **"Coordinador logística"**
(el checkbox agregado antes en `/lideres`) ahora pueden, desde
`/captura/eventos`, hacer clic en un evento para editar sus datos y
agregar/quitar asistentes — igual que el admin, pero sin poder eliminar
eventos. Un líder normal sigue viendo la tabla exactamente igual que antes
(solo lectura, filas no clicables).

**Detalle técnico:**
- La sesión de líder (`LiderSession`) ahora incluye `coordinador_logistica`,
  tomado de la tabla `lideres` en el login (tanto `/api/captura/auth/login`
  como el login unificado de `/login`) y firmado en la cookie. Un nuevo
  helper `requireCoordinadorLogistica` protege los endpoints nuevos.
- 4 endpoints nuevos bajo `/api/captura/eventos` (editar evento, listar/
  agregar/quitar asistentes, buscar referidos), clones de los del panel
  admin pero exigiendo el flag de coordinador. La búsqueda de referidos
  **no se restringe al líder autenticado** (puede agregar como asistente a
  cualquier referido de la campaña) — igual que ya hace el admin hoy; fue
  una decisión explícita que te planteé y aceptaste.
- Para no duplicar ~120 líneas entre el panel admin y la vista nueva, se
  extrajo `EventoAsistentesManager` (buscador + alta/baja de asistentes) a
  un componente compartido, y `EventoForm` ahora acepta un `apiBase`
  configurable. La página admin (`/eventos/[id]`) quedó funcionalmente
  idéntica, solo usando el componente compartido.
- Nueva página `/captura/eventos/[id]`, con el mismo look & feel
  (`CapturaSidebar`/`CapturaHeader`) y una redirección de respaldo si un
  líder sin el atributo entra directo a la URL (la API ya lo bloquea con
  403; esto es solo mejor UX).

**Hallazgo y corrección fuera del alcance original:** la base de datos
local de desarrollo no tenía la columna `duracion_horas` de `eventos`
(de una funcionalidad anterior, commit `e9c96fa`) — se aplicó el `ALTER
TABLE` ya existente en `sql/schema.sql` para ponerla al día; sin eso, la
prueba de edición de evento habría fallado por una causa no relacionada
con este cambio. Vale la pena revisar si la base de datos de producción
también quedó atrás en esa columna.

**Verificación:** `npx tsc --noEmit` sin errores, y prueba funcional
completa con `curl` contra el servidor de desarrollo real (login,
permisos 403/200, edición de evento, alta/baja de asistente, páginas
cargando) — detalle en "Cierre" arriba.

**Pendiente para el usuario:**
- Dar un vistazo visual en el navegador (fila clicable, formulario de
  edición, buscador de asistentes) para confirmar que se ve bien.
- **Producción no se tocó.** Al desplegar, además de `git pull && npm run
  build && pm2 restart`, conviene confirmar que la columna `duracion_horas`
  de `eventos` también exista allá (ver hallazgo arriba) — si no, correr el
  `ALTER TABLE` correspondiente de `sql/schema.sql` junto con el resto.
