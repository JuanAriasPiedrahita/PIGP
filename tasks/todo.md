# Plan: Menú hamburguesa en /captura (Referidos / Eventos de solo lectura)

## Contexto encontrado
- `/captura` es una zona aparte con sesión propia de líder (cookie
  `pigp_lider_session`), fuera del `Sidebar`/`Topbar` del panel admin
  (`AppShell.tsx` los omite explícitamente para rutas `/captura*`).
- El header actual de `/captura/page.tsx` es un `<header>` fijo simple, sin
  menú, con logout.
- `GET /api/eventos` (admin) exige sesión de **usuario admin**, no de líder
  — un líder no puede usarlo. Hace falta un endpoint propio bajo
  `/api/captura/eventos`, protegido por `requireLider` (mismo patrón que
  `/api/captura/referidos`), que la reciba automáticamente el middleware
  (ya cubre todo `/api/captura/*`).

## Backend
- [ ] `src/app/api/captura/eventos/route.ts` — **solo GET**, protegido con
      `requireLider(req)`. Reutiliza la misma consulta y orden que
      `/api/eventos` (próximos primero, luego realizados; incluye
      `total_asistentes`). Sin POST/PUT/DELETE: es de solo lectura para
      líderes.

## Frontend
- [ ] `src/components/captura/CapturaSidebar.tsx` — drawer oscuro, mismo
      estilo visual que el `Sidebar` del panel admin (fondo `bg-brand-950`,
      resaltado de ruta activa), con exactamente dos opciones:
      **Referidos** (`/captura`) y **Eventos** (`/captura/eventos`).
- [ ] `src/components/captura/CapturaHeader.tsx` — header fijo con botón
      hamburguesa (abre/cierra el drawer), título según la ruta, nombre del
      líder autenticado y botón de cerrar sesión — mismo patrón que
      `Topbar.tsx`, reemplazando el `<header>` inline actual.
- [ ] `src/app/captura/page.tsx` — usar `CapturaSidebar` + `CapturaHeader`
      en vez del header inline; el resto de la lógica de Referidos no
      cambia.
- [ ] `src/app/captura/eventos/page.tsx` (nueva) — mismo `CapturaSidebar`/
      `CapturaHeader`, tabla de eventos **de solo lectura**: nombre,
      ubicación, fecha, hora, duración, asistentes y estado
      (Próximo/Realizado) — igual que la tabla admin pero **sin** botón
      "Nuevo evento", sin acción de eliminar y sin clic para entrar al
      detalle (el líder no gestiona asistentes).

## Cierre
- [ ] `npx tsc --noEmit` sin errores
- [ ] Prueba real: la base local sigue sin servicio disponible (mismo
      impedimento de tareas anteriores); se verificará que el nuevo
      endpoint `/api/captura/eventos` exige sesión (401 sin cookie) y, tras
      desplegar, quedará pendiente que confirmes visualmente el menú y el
      listado con un usuario/clave real de líder (no tengo credenciales de
      ningún líder para probarlo yo mismo).
- [ ] Sección de revisión al final de este archivo
