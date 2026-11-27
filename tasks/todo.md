# Enviar correo a Referidos (igual que en Líderes)

## Contexto
En Líderes existe: selección múltiple con checkboxes en la tabla, botón
"Enviar correo (N)" que guarda los seleccionados en `sessionStorage` y
navega a `/lideres/enviar-correo`, donde se redacta asunto/cuerpo con
placeholders y se envía vía `POST /api/lideres/enviar-correo` (un correo
por destinatario, con placeholders reemplazados, delay entre envíos,
reporta enviados/omitidos sin email/fallidos). Se pide la misma
funcionalidad para Referidos, reutilizando los mismos placeholders de
persona (nombre, apellido, dirección, barrio, comuna, puesto, email,
teléfono, variantes de género).

## Plan
- [x] `src/components/referidos/ReferidoTable.tsx`: agregar columna de
      checkbox (seleccionar todos / seleccionar fila) igual que
      `LiderTable.tsx` (`selectedIds`, `onToggleSelect`,
      `onToggleSelectAll`). Props opcionales para no afectar el otro
      lugar donde se usa la tabla sin selección (`captura/page.tsx`).
- [x] `src/app/referidos/page.tsx`: agregar `selectedIds`, función
      `irAEnviarCorreo()` (guarda en sessionStorage key
      `pigp:referidos:envio-correo` y navega a
      `/referidos/enviar-correo`), botón "Enviar correo (N)" junto al
      de "Nuevo referido" (igual que en Líderes), y resetear selección
      al recargar la lista.
- [x] `src/app/api/referidos/enviar-correo/route.ts` (nuevo): mismo
      patrón que `api/lideres/enviar-correo/route.ts` pero consultando
      `referidos` (join a barrios/comunas/puestos para los
      placeholders de ubicación).
- [x] `src/app/referidos/enviar-correo/page.tsx` (nuevo): mismo patrón
      que `lideres/enviar-correo/page.tsx`, leyendo de sessionStorage
      key `pigp:referidos:envio-correo` y llamando al nuevo endpoint.
      Reutiliza `LIDER_PLACEHOLDERS` (son placeholders de persona, no
      específicos de líder).
- [x] Verificar `tsc --noEmit`.

## Fuera de alcance
- Subir y desplegar: en un paso aparte, cuando el usuario lo apruebe.

## Revisión

- Referidos ya tiene selección múltiple (checkbox por fila + "seleccionar
  todos" en la página actual) y un botón "Enviar correo (N)" junto a
  "Nuevo referido", igual que en Líderes.
- Se agregó `/referidos/enviar-correo` (redacción de asunto/cuerpo con
  los mismos placeholders de persona: nombre, apellido, dirección,
  barrio, comuna, puesto, email, teléfono, variantes de género) y el
  endpoint `POST /api/referidos/enviar-correo` que envía un correo por
  destinatario con los placeholders reemplazados, reportando enviados,
  omitidos (sin email) y fallidos.
- `ReferidoTable` recibió props de selección opcionales para no romper
  su otro uso en `captura/page.tsx`, donde no se necesita esta función.
- Verificado con `tsc --noEmit` sin errores.
