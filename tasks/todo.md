# Envío automático de alerta de vencimiento de contrato

## Contexto
Activa el envío automático que ya se dejó preparado (parámetro
`correo_gestion_contratos`, plantilla "Vencimiento contratos"): cada día a
las 7:00am se revisan los contratos de líderes contratistas y, si alguno
vence exactamente dentro de `contrato_meses_alerta` meses (contado desde
hoy, hora Bogotá), se envía **un correo por contrato** al correo de
`correo_gestion_contratos`, usando la plantilla "Vencimiento contratos" y
sus placeholders (`$nombre`, `$apellido`, `$objeto`, `$vencimiento`,
`$dependencia`).

## Decisiones a confirmar
- **"El día y solo el día"**: se implementa igual que "Vencimiento
  gestiones" — una comparación de fecha exacta (`vencimiento_contrato =
  hoy + contrato_meses_alerta meses`), no un rango. Si el servidor está caído
  justo ese día, ese contrato no se re-notifica después (mismo
  comportamiento que ya existe para gestiones).
- Nueva columna `despacho_automatico_vencimiento_contrato` (checkbox
  "Enviar alertas de vencimiento contrato") en Configuración > Parámetros,
  sección "Despacho automático". **Por defecto apagada (0)**, a diferencia
  de los otros 2 despachos automáticos (que nacieron ya encendidos) —
  porque esta es una funcionalidad nueva y conviene que el usuario revise
  el contenido de la plantilla y el correo destinatario antes de activarla
  en producción. Dime si prefieres que nazca encendida.
- Si `correo_gestion_contratos` está vacío o no es un email válido, o si la
  plantilla está vacía, el cron no envía nada ese día (mismo patrón que las
  otras 2 alertas automáticas).
- Cron nuevo a las 7:00am hora Bogotá (`0 7 * * *`), independiente de los
  de 6:00am (cumpleaños) y 6:30am (vencimiento gestión).

## Plan
- [x] `sql/004_despacho_automatico_contrato.sql` (nuevo): agrega
      `despacho_automatico_vencimiento_contrato` a `parametros`, con el
      mismo patrón de procedimiento temporal + `information_schema` que
      `003_contrato_vencimiento.sql` (el `ADD COLUMN IF NOT EXISTS` no
      funciona en el MySQL de producción).
- [x] `sql/schema.sql`: agregar la columna al `CREATE TABLE parametros` y
      al `INSERT` (instalaciones nuevas).
- [x] `lib/types.ts`: agregar `despacho_automatico_vencimiento_contrato:
      boolean` a `Parametros`.
- [x] `lib/parametros.ts`: incluirla en el `SELECT` y en
      `actualizarParametros` (es un checkbox normal, no un asunto de
      plantilla).
- [x] `app/api/parametros/route.ts`: incluirla en el `PUT`.
- [x] `lib/accessLog.ts`: agregar `logVencimientoContratoEnviado` (mismo
      patrón que `logVencimientoGestionEnviado`).
- [x] `lib/vencimientoContratos.ts` (nuevo): función
      `enviarVencimientosContratoDeHoy()` — calcula la fecha objetivo
      (hoy + `contrato_meses_alerta` meses, hora Bogotá), consulta
      líderes contratistas cuyo `vencimiento_contrato` sea exactamente esa
      fecha (join a `dependencias`), y envía un correo por contrato a
      `correo_gestion_contratos` con la plantilla "Vencimiento contratos".
- [x] `src/instrumentation.ts`: registrar el cron `0 7 * * *` (hora
      Bogotá), respetando el flag `despacho_automatico_vencimiento_contrato`.
- [x] `components/catalogos/ParametrosManager.tsx`: checkbox "Enviar
      alertas de vencimiento contrato" en la sección "Despacho automático".
- [x] Aplicar la migración en la base de datos de **desarrollo** local
      (verificado: columna presente, valor `0`).
- [x] Verificar `tsc --noEmit` y `next build` (ambos sin errores). También
      se verificó por separado la aritmética de fechas
      (`fechaObjetivoMesesBogota`) con varios casos (fin de mes, cambio de
      año), y se confirmaron datos reales de prueba en `lideres`
      (3 líderes contratistas con `vencimiento_contrato` distintos) contra
      los que correrá la consulta.

## Fuera de alcance (por ahora)
- Aplicar la migración en **producción** y desplegar: se hace en un paso
  aparte, cuando el usuario lo apruebe explícitamente (como las veces
  anteriores).

## Revisión

Se implementó el envío automático de alertas de vencimiento de contrato:

- Cron nuevo a las 7:00am hora Bogotá (`src/instrumentation.ts`), que
  llama a `enviarVencimientosContratoDeHoy()` (`lib/vencimientoContratos.ts`)
  solo si el checkbox "Enviar alertas de vencimiento contrato" está
  activo.
- La función calcula la fecha "hoy + `contrato_meses_alerta` meses" (hora
  Bogotá) y busca líderes contratistas (`lideres.contratista = 1`) cuyo
  `vencimiento_contrato` sea exactamente esa fecha — por eso el envío
  ocurre solo el día en que se cruza el umbral, no en un rango.
- Por cada contrato que coincide, envía un correo independiente a
  `correo_gestion_contratos`, con la plantilla "Vencimiento contratos" y
  sus placeholders (`$nombre`, `$apellido`, `$objeto`, `$vencimiento`,
  `$dependencia`). Si falta la plantilla o el correo destinatario no es
  válido, no envía nada (igual que las otras 2 alertas automáticas).
- Nueva columna `despacho_automatico_vencimiento_contrato` en
  `parametros` (nace en `0`, apagada), con su checkbox en Configuración >
  Parámetros. Migración en `sql/004_despacho_automatico_contrato.sql`
  (aplicada en desarrollo; pendiente en producción) y reflejada en
  `sql/schema.sql`.
- Cada envío se registra en el log de accesos (`logVencimientoContratoEnviado`).
- Verificado con `tsc --noEmit` y `next build` sin errores.
