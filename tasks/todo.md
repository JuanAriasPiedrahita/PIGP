# Plan: Resumen de gestiones por comuna/barrio (Configuración → Comunas y Barrios)

## Decisión validada contigo
"Pendientes" cuenta todas las gestiones en estado PENDIENTE (incluye las
vencidas); "Vencidas" es un subconjunto/alerta adicional que se solapa con
Pendientes — igual convención que ya usa el resto del módulo de Gestiones.
Las 4 columnas por lo tanto NO suman necesariamente el total.

## Backend
- [x] `GET /api/gestiones/territorio?comuna_id=X` o `&barrio_id=Y` — resumen
      agrupado por tipo de ayuda (resueltas/pendientes/vencidas/no_viables),
      `ORDER BY resueltas DESC`. Une `gestiones` → `referidos` (filtro por
      comuna_id/barrio_id) → `tipos_ayuda`.
- [x] `GET /api/gestiones/territorio/detalle?comuna_id=X|barrio_id=Y&tipo_ayuda_id=Z&columna=resueltas|pendientes|vencidas|no_viables`
      — lista de gestiones de ese tipo que caen en esa columna, con
      colaborador (referido), fecha (resolución si existe, si no límite),
      responsable (gestor), costo.

## Frontend
- [x] `src/components/comunas/GestionesTerritorioModal.tsx` — modal con dos
      vistas: resumen (tabla por tipo de ayuda, columnas clicables) y
      detalle (al hacer clic en un número, lista de gestiones de esa
      columna/tipo, con botón "← Volver" al resumen).
- [x] `ComunasManager.tsx` — ícono de reloj (mismo ícono que en el
      historial de Referidos) antes de "Editar", tanto en cada fila de
      Comuna como en cada fila de Barrio; abre el modal filtrado por
      comuna_id o barrio_id según corresponda.

## Cierre
- [x] Prueba real contra la base de datos (no solo compilación)
- [x] `npx tsc --noEmit` sin errores
- [x] Sección de revisión al final de este archivo

---

## Revisión final

**Qué se construyó:** en Configuración → Comunas y Barrios, un ícono de
reloj junto a cada comuna y cada barrio que abre un reporte de gestiones:
resumen por tipo de ayuda (resueltas/pendientes/vencidas/no viables,
ordenado por resueltas descendente) y, al hacer clic en cualquier número,
el detalle de esas gestiones puntuales (colaborador, fecha de resolución o
límite, responsable, costo).

**Decisión validada contigo antes de programar:** "Vencidas" se solapa con
"Pendientes" (una gestión pendiente y vencida cuenta en ambas columnas),
igual que en el resto del módulo de Gestiones — las 4 columnas no suman
necesariamente el total.

**Detalle técnico encontrado durante la prueba:** MySQL devuelve los
`SUM()` como string (BIGINT vía mysql2) en vez de number; se ajustó el
componente para convertir explícitamente con `Number()` antes de comparar
o mostrar, en vez de depender de la coerción implícita de JavaScript.

**Verificación realizada en este entorno (contra datos reales, no solo
compilación):** el servicio de MariaDB estaba detenido — lo reinició el
usuario (requería permisos de administrador que esta sesión no tiene).
Con el servicio arriba, se probó el resumen de una comuna con una gestión
pendiente-vencida, el resumen de otra comuna con gestiones resueltas con
costo, y el drill-down de cada columna (pendientes, vencidas, resueltas,
y una columna vacía que correctamente devolvió lista vacía). Solo lecturas
(`GET`) — no se modificó ningún dato existente.

**Pendiente para el usuario:** revisar visualmente el reporte en el
navegador y decidir si se sube a GitHub.
