# Plan: Relojitos (detalle) en Profesiones / Ocupaciones / Parentescos / Dependencias

## Contexto encontrado
- En Configuración, las pestañas **Gestores** y **Tipos de ayuda** ya tienen
  un ícono de reloj (`IconoReloj`) por fila que abre un modal
  (`GestionesTerritorioModal`) con el detalle de gestiones.
- Las pestañas **Profesiones, Ocupaciones, Parentescos, Dependencias** (en
  `SimpleCatalogManager.tsx`, rama `totalLabel`) ya muestran una columna de
  **Total** con el conteo correcto (commit `240998d`, hecho hace unas
  semanas):
  - Profesiones → total de **líderes** con esa profesión
    (`/api/profesiones` ya hace `COUNT(l.id)` con `profesion_id`).
  - Ocupaciones → total de **líderes** con esa ocupación (`ocupacion_id`).
  - Parentescos → total de **referidos** con ese parentesco
    (`parentesco_id`).
  - Dependencias → total de **líderes contratistas** con esa dependencia
    (`dependencia_id` + `contratista = 1`).
- Lo que falta es lo que pides ahora: el **reloj** en esas 4 pestañas que,
  al hacer clic, abra un modal con el **detalle** (la lista de personas
  detrás de ese total) — igual en espíritu a como el reloj de Gestores/
  Tipos de ayuda abre el detalle de gestiones, en vez de solo mostrar el
  número.

## Backend
- [x] `src/app/api/configuracion/catalogo-detalle/route.ts` (nuevo): `GET
      ?tipo=profesion|ocupacion|parentesco|dependencia&id=N` → devuelve la
      lista de personas de ese total (id, nombre, apellidos, cedula,
      celular): líderes para profesión/ocupación/dependencia (dependencia
      filtrando también `contratista = 1`), referidos para parentesco.
- [x] `src/lib/types.ts`: tipo liviano `CatalogoDetalleFila` para esa
      respuesta.

## Frontend
- [x] `src/components/catalogos/CatalogoDetalleModal.tsx` (nuevo): modal
      simple (tabla Nombre/Cédula/Celular + total en el encabezado) que
      recibe `{ tipo, id, nombre } | null` y pide
      `/api/configuracion/catalogo-detalle`.
- [x] `src/components/catalogos/SimpleCatalogManager.tsx`: nuevo prop
      `detalleTipo` (uno de los 4 valores); cuando viene, la rama
      `totalLabel` agrega el botón de reloj junto a Editar/Eliminar (igual
      estilo que en Tipos de ayuda) y renderiza `CatalogoDetalleModal`.
- [x] `src/app/configuracion/page.tsx`: agregar `detalleTipo: "profesion" |
      "ocupacion" | "parentesco" | "dependencia"` a esas 4 pestañas en
      `TABS` y pasarlo al componente.

## Cierre
- [x] `npx tsc --noEmit` sin errores
- [x] Prueba funcional contra el servidor de dev real (tuve que levantarlo
      yo mismo, estaba caído) y la base de datos local: para cada uno de
      los 4 tipos probé el endpoint de detalle contra una fila con total
      > 0 y confirmé que la cantidad de filas devueltas coincide exacto
      con el número ya mostrado en la columna "Total":
      - Profesión "Abogado(a)" (total 1) → 1 líder.
      - Ocupación "Independiente" (total 2) → 2 líderes.
      - Parentesco "Amigo(a)" (total 4) → 4 referidos.
      - Dependencia "Secretaría de Gobierno" (total 1) → 1 contratista.
      - Dependencia con total 0 → lista vacía (`[]`).
      - `tipo` inválido → `400`; sin sesión → `401`.
      - La página `/configuracion` carga `200`.
- [x] Sección de revisión al final de este archivo

---

## Revisión final

**Qué se construyó:** en Configuración, las pestañas **Profesiones,
Ocupaciones, Parentescos y Dependencias** ahora tienen el mismo reloj que
ya tenían Gestores y Tipos de ayuda. Al hacer clic, abre un modal con la
lista de personas detrás del total que ya se veía en cada fila:
- Profesiones/Ocupaciones → líderes con esa profesión/ocupación.
- Parentescos → referidos con ese parentesco.
- Dependencias → líderes **contratistas** de esa dependencia.

**Detalle técnico:** un endpoint nuevo y genérico
(`/api/configuracion/catalogo-detalle?tipo=...&id=...`) resuelve la
consulta según el tipo (reutilizando exactamente el mismo criterio que ya
usaban los totales existentes), y un modal nuevo y genérico
(`CatalogoDetalleModal`) se reutiliza en las 4 pestañas vía un nuevo prop
`detalleTipo` en `SimpleCatalogManager`. No se tocó la columna "Total" que
ya existía ni la lógica de Gestores/Tipos de ayuda.

**Verificación:** `npx tsc --noEmit` sin errores, y prueba funcional
completa con `curl` contra el servidor de desarrollo real y la base de
datos local — el detalle de cada tipo coincide exacto con el total ya
mostrado, y los casos borde (sin resultados, tipo inválido, sin sesión)
responden como se esperaba.

**Pendiente para el usuario:** darle un vistazo visual en el navegador
(abrir Configuración, probar el reloj en cada una de las 4 pestañas) para
confirmar que se ve bien. No se desplegó a producción — avísame si quieres
que lo suba igual que la vez anterior.
