# Nuevo parámetro "Correo gestión contratos" + plantilla "Vencimiento contratos"

## Contexto
Se agrega la infraestructura para un futuro envío automático de alerta de
vencimiento de contrato de líderes contratistas. El evento que disparará el
envío se definirá más adelante; por ahora solo se agrega:
- El correo del gestor de contratos (destinatario fijo) y el asunto del
  mensaje, como nuevos parámetros.
- Una nueva plantilla "Vencimiento contratos" en Configuración > Plantillas,
  con placeholders para objeto del contrato, vencimiento y dependencia
  (datos que viven en la tabla `lideres`), siguiendo el mismo estilo de las
  plantillas existentes (gestión nueva, cumpleaños, vencimiento gestión).

## Decisiones a confirmar
- Placeholders de la nueva plantilla: `$nombre`, `$apellido` (líder
  contratista), `$objeto` (objeto del contrato), `$vencimiento` (fecha de
  vencimiento) y `$dependencia` (descripción de la dependencia). Se incluyen
  nombre/apellido además de los 3 pedidos porque el correo necesita
  identificar de quién es el contrato.
- "Correo electrónico gestión contratos" queda como campo **opcional** en
  Parámetros (se valida formato de email solo si se diligencia), para no
  bloquear el guardado de los demás parámetros mientras no exista aún el
  envío automático.
- El asunto de la nueva plantilla sigue la misma regla que las otras 3:
  obligatorio, máximo 200 caracteres.
- No se agrega checkbox de "despacho automático" todavía (se hará junto con
  el evento disparador, cuando se defina).

## Plan
- [x] `sql/003_contrato_vencimiento.sql` (nuevo): `ALTER TABLE parametros ADD COLUMN IF NOT EXISTS correo_gestion_contratos` y `plantilla_vencimiento_contrato_asunto`, para bases ya existentes (dev y prod).
- [x] `sql/schema.sql`: agregar ambas columnas al `CREATE TABLE parametros` y al `INSERT` (instalaciones nuevas).
- [x] `lib/types.ts`: agregar `correo_gestion_contratos` y `plantilla_vencimiento_contrato_asunto` a la interfaz `Parametros`.
- [x] `lib/parametros.ts`: incluir las 2 columnas nuevas en el `SELECT`; `correo_gestion_contratos` editable vía `actualizarParametros` (como el resto de Parámetros); `plantilla_vencimiento_contrato_asunto` editable solo vía `actualizarAsuntoPlantilla` (como los otros 3 asuntos).
- [x] `app/api/parametros/route.ts`: validar `correo_gestion_contratos` (opcional; si viene, debe ser email válido y ≤150 caracteres) e incluirlo en el `PUT`.
- [x] `app/api/plantillas/vencimiento-contrato/route.ts` (nuevo): mismo patrón que los otros 3 endpoints de plantilla, con `PLANTILLA_VENCIMIENTO_CONTRATO_FILE` / `plantillas/vencimiento_contrato.txt`.
- [x] `lib/emailPlaceholders.ts`: agregar `CONTRATO_PLACEHOLDERS`.
- [x] `components/catalogos/ParametrosManager.tsx`: agregar input "Correo electrónico gestión contratos" (sección "Líderes y contratos").
- [x] `components/catalogos/PlantillasManager.tsx`: agregar entrada "Vencimiento contratos" a la lista de plantillas.
- [x] `.env` y `.env.example`: agregar `PLANTILLA_VENCIMIENTO_CONTRATO_FILE=plantillas/vencimiento_contrato.txt`.
- [x] Migración `003_contrato_vencimiento.sql` aplicada contra la base de desarrollo local (verificado: columnas presentes con sus defaults).
- [ ] Migración `003_contrato_vencimiento.sql` aplicada contra la base de producción (.243) — pendiente, se hace junto con el despliegue.

## Fuera de alcance (por ahora)
- El envío automático en sí (falta que el usuario indique el evento disparador).
- El archivo físico `plantillas/vencimiento_contrato.txt` no se crea a mano; se genera al guardar la plantilla desde la UI, igual que las demás.

## Revisión

Se agregó la infraestructura para la futura alerta de vencimiento de contrato:

- **BD**: nuevas columnas `correo_gestion_contratos` (VARCHAR 150, opcional) y `plantilla_vencimiento_contrato_asunto` (VARCHAR 200) en `parametros`. Migración en `sql/003_contrato_vencimiento.sql` (aplicada en desarrollo; pendiente en producción al desplegar) y reflejadas en `sql/schema.sql` para instalaciones nuevas.
- **Parámetros**: nuevo campo "Correo electrónico gestión contratos" en Configuración > Parámetros, sección "Líderes y contratos". Opcional; si se diligencia, debe ser un email válido.
- **Plantillas**: nueva plantilla "Vencimiento contratos" en Configuración > Plantillas (`/api/plantillas/vencimiento-contrato`, archivo controlado por `PLANTILLA_VENCIMIENTO_CONTRATO_FILE` en `.env`), con asunto editable y placeholders `$nombre`, `$apellido`, `$objeto`, `$vencimiento`, `$dependencia` (`CONTRATO_PLACEHOLDERS` en `lib/emailPlaceholders.ts`).
- Verificado con `tsc --noEmit` y `next build` sin errores.
- No se implementó el envío automático: falta que el usuario indique el evento que lo dispara.
