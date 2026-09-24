# Plan: Totales por catálogo en Configuración

## Decisión validada contigo
Los campos de profesión y ocupación solo existen en la ficha de **Líderes**
(no en Referidos), así que:
- **Profesiones:** total de **líderes** con esa profesión.
- **Ocupaciones:** total de **líderes** con esa ocupación.
- **Parentescos:** total de **referidos** con ese parentesco (este sí es
  correcto tal cual lo pediste — `parentesco_id` es de `referidos`).
- **Dependencias:** total de **líderes contratistas** con esa dependencia
  (`dependencia_id` solo se llena cuando `contratista = 1`).

## Backend
Se sigue el mismo patrón que ya usa `tipos-ayuda/route.ts` (sobreescribe el
`GET` del catálogo con su propia consulta `JOIN`+`COUNT`, dejando `POST` tal
cual con `simpleCatalogHandlers`), en vez de modificar la fábrica compartida.
- [x] `src/app/api/profesiones/route.ts`: `GET` propio con total de `lideres`
      (`LEFT JOIN lideres ON profesion_id`, `COUNT`).
- [x] `src/app/api/ocupaciones/route.ts`: igual, con `ocupacion_id`.
- [x] `src/app/api/parentescos/route.ts`: total de `referidos`
      (`parentesco_id`).
- [x] `src/app/api/dependencias/route.ts`: total de `lideres` con
      `dependencia_id = X AND contratista = 1`.
- [x] `tipos_ayuda` sigue igual (ya tiene su propio conteo de gestiones).

## Frontend
- [x] `src/components/catalogos/SimpleCatalogManager.tsx`: agregar columna
      "Total" (genérica, con la etiqueta que corresponda por catálogo) junto
      a cada fila, reemplazando la lista simple por una tabla cuando el
      catálogo trae conteo — similar al patrón que ya existe para
      `conGestiones`, pero solo una columna de total (no resueltas/pendientes).
- [x] `src/app/configuracion/page.tsx`: pasar la nueva prop indicando qué
      etiqueta usar en la columna ("Líderes", "Referidos", "Contratistas").

## Cierre
- [x] `npx tsc --noEmit` sin errores
- [x] Prueba real: la base local (MariaDB) sigue detenida sin permisos de
      administrador para iniciarla, igual que en la tarea anterior — se
      verificaron las 4 consultas nuevas de solo lectura (`SELECT`, sin
      tocar datos) contra la base de **producción**, comparando cada suma
      de totales contra el conteo real (4 líderes, 6 referidos, 3
      contratistas): coincide en los 4 catálogos.
- [x] Sección de revisión al final de este archivo

---

## Revisión final

**Qué se construyó:** en Configuración, los catálogos de Profesiones y
Ocupaciones ahora muestran cuántos **líderes** tienen asignada cada una (son
campos exclusivos de la ficha de Líderes); Parentescos muestra cuántos
**referidos** tienen ese parentesco; Dependencias muestra cuántos **líderes
contratistas** están asignados a cada una.

**Decisión validada contigo:** "total de referidos" en Profesiones/
Ocupaciones en realidad correspondía a líderes, porque `profesion_id` y
`ocupacion_id` solo existen en la tabla `lideres` — no hay esos campos en
`referidos`. Confirmaste que el total debía ser de líderes.

**Detalle técnico:** cada endpoint (`profesiones`, `ocupaciones`,
`parentescos`, `dependencias`) sobreescribe su `GET` con un `LEFT JOIN` +
`COUNT` propio, siguiendo el mismo patrón que ya usaba `tipos-ayuda`, sin
tocar la fábrica compartida `simpleCatalogHandlers`. El frontend
(`SimpleCatalogManager`) ganó una columna "Total" genérica (prop
`totalLabel`), reutilizando el estilo de tabla que ya existía.

**Pendiente para el usuario:** revisar visualmente los 4 catálogos y decidir
si se sube a producción.
