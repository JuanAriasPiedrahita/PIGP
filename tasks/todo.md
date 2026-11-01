# Optimización: dashboard en paralelo + catálogos admin consolidados

## Contexto
Del análisis de `/optimizar`: el dashboard hace 7 queries SQL secuenciales en vez
de paralelas, y `useCatalogos()` (usado en Líderes/Referidos) hace 8 peticiones
HTTP separadas donde ya demostramos (con `/api/captura/catalogos`) que basta 1.

## Plan

- [x] 1. `src/app/api/dashboard/route.ts`: cambiar las 7 queries secuenciales por
      `Promise.all`, sin cambiar la forma de la respuesta.
- [x] 2. Nuevo endpoint `src/app/api/catalogos/route.ts`: devuelve zonas, puestos,
      comunas, barrios, profesiones, ocupaciones, parentescos y dependencias en
      una sola respuesta (mismo patrón que `/api/captura/catalogos`). No toca los
      endpoints individuales (`/api/profesiones`, etc.) porque Configuración los
      sigue usando por separado (traen un `total` que este nuevo endpoint no
      necesita).
- [x] 3. `src/hooks/useCatalogos.ts`: cambiar las 8 llamadas `apiGet` por una sola
      a `/api/catalogos`.
- [x] 4. Verificar `npx tsc --noEmit` sin errores.

## Revisión final

- El dashboard ahora dispara sus 7 consultas en paralelo con `Promise.all` en vez
  de una tras otra; la respuesta JSON no cambió de forma.
- Se agregó `GET /api/catalogos`, que junta zonas/puestos/comunas/barrios/
  profesiones/ocupaciones/parentescos/dependencias en una sola respuesta,
  replicando el patrón que ya usaba `/api/captura/catalogos`.
- `useCatalogos()` (usado por los formularios de Líderes y Referidos en el panel
  admin) pasó de hacer 8 peticiones HTTP a hacer 1 sola.
- Los endpoints individuales (`/api/profesiones`, `/api/ocupaciones`, etc.) no se
  tocaron: Configuración sigue usándolos directamente porque traen el campo
  `total` (conteo de uso) que el nuevo endpoint combinado no necesita.
- `npx tsc --noEmit` sin errores.
