# Mover asuntos de correos automáticos de Parámetros a Plantillas

## Plan
- [x] En `lib/parametros.ts`: agregar `actualizarAsuntoPlantilla(campo, valor)` para actualizar un solo campo de asunto, y quitar los 3 campos de asunto del `UPDATE` de `actualizarParametros` (ya no se gestionan desde Parámetros).
- [x] En cada endpoint `/api/plantillas/{gestion-nueva,vencimiento-gestion,cumpleanos-lider}/route.ts`: el `GET` también devuelve `asunto` (leído de `getParametros()`), y el `PUT` también valida y guarda `asunto` (con `actualizarAsuntoPlantilla`).
- [x] En `PlantillasManager.tsx`: agregar un campo "Asunto" (Input) en el editor de cada plantilla, junto al textarea de contenido, cargado y guardado junto con el contenido.
- [x] En `ParametrosManager.tsx`: quitar la sección "Asuntos de los correos automáticos" y los campos/estado relacionados.
- [x] En `app/api/parametros/route.ts`: quitar la validación y el manejo de los 3 campos de asunto en el `PUT` (ya no se actualizan desde este endpoint).

## Notas
- Los valores de asunto siguen viviendo en la tabla `parametros` (columnas existentes); no hay migración de base de datos.
- `getParametros()` sigue leyendo esos campos tal cual, porque los usa el envío de correos (`gestiones/route.ts`, `cumpleanosLideres.ts`, `vencimientoGestiones.ts`).

## Plan (fase 2: placeholders en el asunto)
- [x] `gestiones/route.ts`: aplicar `reemplazarPlaceholdersPlantilla` también al `asunto`, con los mismos valores que ya se usan para el `cuerpo`.
- [x] `cumpleanosLideres.ts`: aplicar `reemplazarPlaceholders` también al `asunto`.
- [x] `vencimientoGestiones.ts`: aplicar `reemplazarPlaceholdersPlantilla` también al `asunto`, con los mismos valores que ya se usan para el `cuerpo`.
- [x] `PlantillasManager.tsx`: agregar un hint al input "Asunto" indicando que admite los mismos placeholders que el contenido.

## Revisión

Se movieron los 3 campos "Asunto" de los correos automáticos (gestión nueva, cumpleaños de líderes, vencimiento de gestión) de Configuración > Parámetros a Configuración > Plantillas, dentro del editor de cada plantilla correspondiente, junto al textarea de su contenido.

- Los datos siguen en las mismas columnas de la tabla `parametros` (`plantilla_gestion_nueva_asunto`, `plantilla_cumpleanos_lider_asunto`, `plantilla_vencimiento_gestion_asunto`); no hubo migración de base de datos.
- Se agregó `actualizarAsuntoPlantilla` en `lib/parametros.ts` para actualizar un solo asunto sin tocar el resto de los parámetros, y `actualizarParametros` ya no gestiona esos 3 campos.
- Cada endpoint de plantillas (`/api/plantillas/gestion-nueva`, `/vencimiento-gestion`, `/cumpleanos-lider`) ahora devuelve y guarda `asunto` junto con `contenido`, con la misma validación que tenía antes (obligatorio, máx. 200 caracteres).
- El endpoint `/api/parametros` ya no valida ni acepta los 3 campos de asunto.
- Verificado con `tsc --noEmit` sin errores.

### Fase 2: placeholders en el asunto

Ahora el "Asunto" de los 3 correos automáticos admite los mismos placeholders que su contenido (`$nombre`, `$ayuda`, `$referido`, `$o`/`$a`, etc.), ya que se procesa con la misma función de reemplazo (`reemplazarPlaceholders`/`reemplazarPlaceholdersPlantilla`) y los mismos valores que ya se calculaban para el cuerpo del correo, en `gestiones/route.ts`, `cumpleanosLideres.ts` y `vencimientoGestiones.ts`. Se agregó un hint en el input de Plantillas indicándolo. Verificado con `tsc --noEmit` sin errores.
