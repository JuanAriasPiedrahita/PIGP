# Combobox Sí/No para el filtro "Votó la vez pasada" en Referidos

## Contexto
En Configuración > Referidos, el filtro "Votó la vez pasada" es hoy un
checkbox que, cuando está marcado, solo permite filtrar por "sí votó"
(`voto_anterior = 1`). Se pide agregar, justo después de ese checkbox, un
combobox con valores "Sí" / "No" (por defecto "Sí"), de forma que:
- Checkbox desmarcado → el filtro no se aplica (como hoy).
- Checkbox marcado + combobox "Sí" → solo los que votaron (`voto_anterior = 1`).
- Checkbox marcado + combobox "No" → solo los que NO votaron (`voto_anterior = 0`).

## Plan
- [x] `src/app/api/referidos/route.ts`: cambiar el filtro `votaron` para
      aceptar `"true"` (→ `voto_anterior = 1`) o `"false"` (→
      `voto_anterior = 0`), en vez de solo comparar con `"true"`.
- [x] `src/app/referidos/page.tsx`:
      - Nuevo estado `votaronValor` ("true" | "false"), por defecto "true",
        inicializado también desde `searchParams` si viene `votaron=false`.
      - Al construir el query, enviar `votaron=<votaronValor>` solo si
        `votaronFilter` está activo.
      - Agregar un `<select>` (Sí/No) justo después del checkbox "Votó la
        vez pasada", deshabilitado cuando el checkbox está desmarcado.
      - `limpiarFiltros()` debe resetear `votaronValor` a "true".
- [x] Verificar `tsc --noEmit`.

## Fuera de alcance
- Subir y desplegar: se hace en un paso aparte, cuando el usuario lo
  apruebe explícitamente.

## Revisión

- Se agregó un combobox Sí/No justo después del checkbox "Votó la vez
  pasada" en Referidos, por defecto "Sí", deshabilitado mientras el
  checkbox esté desmarcado.
- El query `/api/referidos?votaron=...` ahora distingue entre `true`
  (`voto_anterior = 1`) y `false` (`voto_anterior = 0`); si el checkbox
  está desmarcado no se envía el parámetro y el filtro no se aplica.
- Verificado con `tsc --noEmit` sin errores.
