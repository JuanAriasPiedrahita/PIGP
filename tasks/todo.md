# Envío masivo de correo a líderes seleccionados

## Contexto
En el listado de líderes (`/lideres`), permitir seleccionar varios líderes
con checkboxes y enviarles un correo con asunto/cuerpo personalizado usando
placeholders (nombre, sexo, ubicación, etc.), despachado uno a uno con un
delay configurable, usando el SMTP ya configurado en `.env` (Brevo).

## Confirmado antes de empezar
- [x] `SMTP_HOST=smtp-relay.brevo.com` y `SMTP_PORT=587` (Brevo).
- [x] `$telefono` se mapea al campo `celular` del líder.
- [x] Líderes sin email se omiten y se reportan al final (no bloquean el envío).

## Plan
- [x] Agregar dependencia `nodemailer` (+ `@types/nodemailer`) a package.json
      e instalar.
- [x] Agregar `SMTP_HOST` y `SMTP_PORT` a `.env` y documentar las variables
      SMTP/EMAIL_DELAY_MS en `.env.example` (sin exponer los valores reales).
- [x] Crear `src/lib/emailPlaceholders.ts`: función que reemplaza placeholders
      (`$nombre`, `$apellido`, `$o`, `$a`, `$sexo`, `$genero`, `$direccion`,
      `$barrio`, `$comuna`, `$puesto`, `$email`, `$telefono`) en un texto,
      usando los datos de un líder y su `sexo` para las variantes
      masculino/femenino.
- [x] Crear `src/lib/mailer.ts`: transporter de `nodemailer` con las variables
      SMTP del `.env`, función `sendMailWithDelay` que envía un mensaje y
      espera `EMAIL_DELAY_MS` antes de continuar.
- [x] Crear endpoint `POST /api/lideres/enviar-correo`
      (`src/app/api/lideres/enviar-correo/route.ts`): recibe
      `{ liderIds: number[], asunto: string, cuerpo: string }`, consulta los
      líderes por id, por cada uno con email válido reemplaza placeholders y
      envía el correo secuencialmente con el delay; devuelve un resumen
      (`enviados`, `fallidos`, `omitidos`).
- [x] En `LiderTable.tsx`: agregar columna de checkbox a la izquierda de cada
      fila y un checkbox "seleccionar todos" en el encabezado (evitando que el
      click en el checkbox dispare la edición de la fila).
- [x] En `src/app/lideres/page.tsx`: estado de selección (Set de ids), botón
      "Enviar correo" en la esquina superior derecha (habilitado solo si hay
      selección), que abre un modal de composición.
- [x] Crear `src/components/lideres/ComposeEmailModal.tsx`: formulario con
      asunto, cuerpo (textarea), lista de placeholders disponibles como ayuda,
      botón "Enviar a N líderes"; llama al endpoint y muestra el resultado
      (enviados/omitidos/fallidos) con el sistema de Toast existente.
- [x] Probar en local: seleccionar 1-2 líderes con email real/propio, enviar
      un correo de prueba y confirmar que llega con los placeholders
      resueltos correctamente para un líder masculino y uno femenino.
      (Probado vía script directo contra el SMTP de Brevo con los mismos
      datos de `.env`: ambos correos fueron aceptados por Brevo ("250 OK:
      queued") y los placeholders se resolvieron bien para ambos sexos.
      `npx tsc --noEmit` y `npx next build` también pasan sin errores.)

## Fuera de alcance (por ahora)
- No se sube a GitHub ni se despliega a producción hasta aprobación explícita.
- No se agrega paginación/selección persistente entre filtros (la selección
  aplica sobre lo visible en el listado actual).

## Rediseño UI (basado en capturas de referencia del usuario)
- [ ] Convertir "Redactar email" de modal a **página propia**
      `src/app/lideres/enviar-correo/page.tsx` con link "← Líderes" y título
      "Redactar Email a Líderes" (navegación real, no popup).
- [ ] Tarjeta "DESTINATARIOS (N CON EMAIL)" que lista, si existen, los
      líderes seleccionados **sin email** como "pills" bajo
      "Sin email registrado:".
- [ ] Sección "Placeholders disponibles" **colapsada por defecto**, con un
      link/botón para desplegar la tabla (Placeholder | Reemplaza con), igual
      a las capturas. Se mantienen los 12 placeholders ya implementados.
- [ ] Si ningún seleccionado tiene email: caja de aviso amarilla
      "Ninguno de los líderes seleccionados tiene email registrado." y ocultar
      el formulario de asunto/cuerpo.
- [ ] En `src/app/lideres/page.tsx`: el botón "Enviar correo" guarda los
      líderes seleccionados (id, nombre, apellidos, email) en
      `sessionStorage` y navega a `/lideres/enviar-correo` (ya no abre modal).
- [ ] Eliminar `src/components/lideres/ComposeEmailModal.tsx` y el estado
      `composeOpen`/Modal asociado en `page.tsx` (reemplazado por la página).
- [x] Verificar `tsc --noEmit` y `next build` de nuevo tras el cambio (ambos
      pasan sin errores). No fue posible probar visualmente con navegador
      automatizado en este entorno (no hay `chromium-cli` ni herramienta de
      navegador disponible); sí se confirmó por `curl` contra un servidor dev
      de prueba que `/lideres`, `/lideres/enviar-correo` y `/api/lideres`
      responden sin errores de servidor (exigen autenticación como se
      espera). Pendiente que el usuario confirme visualmente en su propio
      servidor dev ya corriendo.

## Revisión

Cambios realizados:
- `package.json`: se agregó la dependencia `nodemailer` (+ `@types/nodemailer`).
- `.env`: se agregaron `SMTP_HOST=smtp-relay.brevo.com` y `SMTP_PORT=587`
  (faltaban; las demás variables SMTP/EMAIL_DELAY_MS ya existían). `.env.example`
  se actualizó para documentar todas las variables SMTP sin exponer valores reales.
- `src/lib/emailPlaceholders.ts` (nuevo): reemplaza placeholders
  (`$nombre`, `$apellido`, `$o`, `$a`, `$sexo`, `$genero`, `$direccion`,
  `$barrio`, `$comuna`, `$puesto`, `$email`, `$telefono`) según el sexo del
  líder. `$telefono` usa el campo `celular`.
- `src/lib/mailer.ts` (nuevo): transporter de nodemailer con las variables
  SMTP, `sendMail`, `getEmailDelayMs` y `waitEmailDelay` (delay configurable
  entre envíos).
- `src/app/api/lideres/enviar-correo/route.ts` (nuevo): `POST` que recibe
  `{ liderIds, asunto, cuerpo }`, consulta los líderes, omite los sin email,
  reemplaza placeholders y envía uno a uno con el delay de `EMAIL_DELAY_MS`.
  Devuelve `{ enviados, omitidos, fallidos }`.
- `src/components/lideres/LiderTable.tsx`: columna de checkbox por fila +
  checkbox "seleccionar todos" en el encabezado.
- `src/components/lideres/ComposeEmailModal.tsx` (nuevo): formulario de
  asunto/cuerpo con ayuda de placeholders, envía al endpoint y muestra el
  resultado con el Toast existente.
- `src/app/lideres/page.tsx`: estado de selección (`Set<number>`), botón
  "Enviar correo (N)" junto a "Nuevo líder", modal de composición; la
  selección se limpia cada vez que se recarga el listado (cambio de
  filtros/búsqueda).

Validación hecha:
- `npx tsc --noEmit` sin errores.
- `npx next build` compila y genera todas las rutas, incluida
  `/api/lideres/enviar-correo`.
- Prueba end-to-end del envío (script directo con las credenciales SMTP de
  `.env`, sin tocar datos reales de líderes): 2 correos de prueba
  (masculino/femenino) aceptados por Brevo, placeholders resueltos
  correctamente.

No se subió nada a GitHub ni se desplegó a producción, según lo pedido.

---

# Paginación del listado de líderes

## Contexto
En `/lideres`, mostrar la tabla paginada (15 registros por página por
defecto), con botones "Anterior"/"Siguiente", y una caja de texto para que
el usuario elija cuántos registros ver por página. El valor por defecto
(15) debe salir de una variable en `.env`.

## Plan
- [x] Agregar `NEXT_PUBLIC_LIDERES_PAGE_SIZE=15` a `.env` y `.env.example`
      (debe tener el prefijo `NEXT_PUBLIC_` para que Next.js lo exponga al
      navegador; las demás env vars del proyecto son solo de servidor).
- [x] En `src/app/lideres/page.tsx`: estado `page` (página actual) y
      `pageSize` (inicializado desde `NEXT_PUBLIC_LIDERES_PAGE_SIZE`, min 15
      si no está definida). Calcular la porción de `lideres` a mostrar
      (`slice`) según `page`/`pageSize`.
- [x] Reiniciar `page` a 1 cuando cambien los filtros/búsqueda o el
      `pageSize`.
- [x] Pasar a `LiderTable` solo los líderes de la página actual ("seleccionar
      todos" ahora agrega/quita solo los ids de la página visible,
      preservando selección hecha en otras páginas).
- [x] Agregar debajo de la tabla: texto "Página X de Y" + 4 botones de
      ícono (sin texto, tipo "play"/"doble play"): primera página
      (doble flecha izquierda), anterior (flecha izquierda), siguiente
      (flecha derecha), última página (doble flecha derecha); deshabilitados
      en los extremos. Más un campo numérico "Registros por página" que
      actualiza `pageSize` en vivo.
- [x] Verificar `tsc --noEmit` y `next build` (ambos pasan sin errores).

## Fuera de alcance
- No se pagina en el servidor (no se toca `GET /api/lideres`); se pagina
  sobre la lista ya cargada en el cliente, como hoy.
- El valor elegido en la caja de texto no se persiste (vuelve al default de
  `.env` al recargar la página).

## Revisión
(se completa al terminar)

## Revisión

- `.env` / `.env.example`: nueva variable `NEXT_PUBLIC_LIDERES_PAGE_SIZE=15`.
- `src/app/lideres/page.tsx`: estado `page`/`pageSize`, cálculo de
  `paginaLideres` (slice del listado ya cargado), reinicio de página al
  cambiar filtros o tamaño de página, "seleccionar todos" ahora opera solo
  sobre la página visible (sumando/restando del set de selección, sin perder
  lo seleccionado en otras páginas). Controles debajo de la tabla: 4 botones
  de ícono (primera, anterior, siguiente, última — flechas tipo "play"/
  "doble play", sin texto) deshabilitados en los extremos, indicador
  "Página X de Y", y campo numérico "Registros por página".
- `tsc --noEmit` y `next build` sin errores.

Paginación hecha en el cliente, sin cambios en la API `/api/lideres`.

---

# Ocultar firma de nginx al acceder por IP directa (servidor .243)

## Contexto
Al acceder a `http://192.168.227.243` por IP directa (sin nombre de dominio),
nginx mostraba la página por defecto "Welcome to nginx!" y exponía su versión
en el header `Server`. Se busca que esas peticiones no revelen nada y que los
nombres (`jj.pereirasi.co`, `cht.pereirasi.co`) sigan funcionando igual.

## Confirmado antes de empezar
- [x] Ante IP directa / Host no reconocido: cerrar la conexión sin respuesta
      (HTTP 444), no servir una página personalizada.
- [x] Proceder por SSH a editar la config de nginx y recargar el servicio.

## Plan
- [x] Deshabilitar `/etc/nginx/sites-enabled/default` (sitio por defecto de
      Ubuntu que servía la página de bienvenida).
- [x] Crear `/etc/nginx/sites-available/catchall-default`: bloque
      `default_server` en el puerto 80 (IPv4 e IPv6) con `server_name _;` y
      `return 444;`, habilitarlo con symlink en `sites-enabled`.
- [x] Cambiar `server_tokens build;` a `server_tokens off;` en
      `/etc/nginx/nginx.conf` para no exponer la versión de nginx en el
      header `Server`.
- [x] Validar con `nginx -t` y recargar con `systemctl reload nginx`.
- [x] Verificar: IP directa devuelve conexión cerrada sin respuesta (444);
      `jj.pereirasi.co` y `cht.pereirasi.co` siguen respondiendo igual que
      antes; el header `Server` ya no muestra número de versión.

## Revisión

Cambios aplicados en producción (192.168.227.243):
- `/etc/nginx/sites-enabled/default`: symlink eliminado (ya no se sirve la
  página de bienvenida de nginx).
- `/etc/nginx/sites-available/catchall-default` (nuevo) + symlink en
  `sites-enabled`: bloque `default_server` en el puerto 80/[::]:80 que
  responde `444` (cierra la conexión sin enviar nada) para cualquier
  petición por IP directa o con un `Host` no reconocido.
- `/etc/nginx/nginx.conf`: `server_tokens build;` → `server_tokens off;`.
- `nginx -t` y `systemctl reload nginx` ejecutados sin errores.

Validación hecha (desde fuera del servidor):
- `curl http://192.168.227.243/` → conexión cerrada sin respuesta (curl
  exit 52 / "Empty reply from server"), ya no se ve la página de bienvenida.
- `curl -H "Host: jj.pereirasi.co" http://192.168.227.243/` y lo mismo con
  `cht.pereirasi.co` → siguen respondiendo igual que antes (307 a
  `/login`), sin afectación.
- El header `Server` en las respuestas de los sitios nombrados ya no incluye
  el número de versión de nginx (antes `nginx/1.x.x`, ahora solo `nginx`).

Nota: hubo un intento fallido previo por un error de comillas/heredoc
anidado con `sudo -S` (3 intentos de autenticación fallidos, pero ningún
cambio llegó a aplicarse) y luego una caída temporal de conectividad con el
servidor; ninguno de los dos dejó el servidor en un estado intermedio o
roto. El cambio finalmente se aplicó subiendo el script por `pscp` y
ejecutándolo con `sudo -S` sin anidar heredocs.

---

# Log de accesos (logins) en archivo de texto plano

## Contexto
Registrar en un archivo de texto plano cada inicio de sesión a la app
(admin y líderes): fecha, hora, usuario, IP y navegador. El nombre/ruta del
archivo debe ser configurable por `.env`, y si el archivo no existe, se crea
solo.

## Confirmado antes de empezar
- [x] Se registran solo eventos de login (no cada página/petición), porque
      el middleware actual corre en el Edge runtime de Next.js y no tiene
      acceso al sistema de archivos; los endpoints de login sí corren en
      Node.js y pueden escribir archivos.
- [x] Se cubre tanto login de administradores (`users.txt`) como de líderes
      (`/captura`).
- [x] También se registran los intentos fallidos, con una marca de
      resultado (OK / FALLIDO).

## Hallazgo importante
Revisé la config de nginx en producción (`jj.pereirasi.co` y
`cht.pereirasi.co`) y **no** estaba reenviando la IP real del cliente a la
app (no había `proxy_set_header X-Forwarded-For` ni `X-Real-IP`). Sin eso,
el campo "IP" del log mostraría siempre `127.0.0.1` (la IP de nginx), no
la IP real del usuario.
- [x] Aprobado y aplicado: se agregó `proxy_set_header X-Real-IP
      $remote_addr;` y `proxy_set_header X-Forwarded-For
      $proxy_add_x_forwarded_for;` a los dos bloques `server` de
      `/etc/nginx/sites-available/campana` en producción, y se recargó
      nginx.

## Plan
- [x] Agregar `ACCESS_LOG_FILE=access.log` a `.env` y `.env.example`
      (ruta relativa al proyecto, o absoluta si se prefiere).
- [x] Crear `src/lib/accessLog.ts`: función `logAccess({ usuario, ip, userAgent, resultado })`
      que arma la línea (fecha, hora, usuario, ip, navegador, resultado) y
      la agrega (append) al archivo indicado por `ACCESS_LOG_FILE`; si el
      archivo no existe, se crea automáticamente al escribir.
- [x] Agregar helper para extraer la IP real del cliente desde los headers
      `x-forwarded-for` / `x-real-ip` de la petición (con fallback a
      "desconocida" si no vienen, por ejemplo en desarrollo local).
- [x] En `src/app/api/auth/login/route.ts` (login unificado admin/líder):
      llamar a `logAccess` tanto en los casos de éxito (admin y líder) como
      en los de clave incorrecta, antes de responder.
- [x] En `src/app/api/captura/auth/login/route.ts` (login directo de
      líder): mismo cambio, éxito y clave incorrecta.
- [x] Verificar `tsc --noEmit` y `next build`.
- [x] Probar en local: un login correcto y uno incorrecto, confirmar que el
      archivo de log se crea solo y las líneas tienen el formato esperado.
- [x] Agregar `access.log` a `.gitignore` (contiene datos de usuarios
      reales: usuario, IP, navegador — no debe subirse al repo).

## Fuera de alcance (por ahora)
- No se loguea cada página/petición, solo eventos de login (ver arriba).
- No se rota ni se limita el tamaño del archivo de log (si crece mucho,
  quedaría para una mejora futura).

## Revisión

Cambios realizados:
- `.env` / `.env.example`: nueva variable `ACCESS_LOG_FILE=access.log`
  (ruta configurable del archivo de log; relativa al proyecto o absoluta).
- `src/lib/accessLog.ts` (nuevo): `getClientIp(req)` (lee
  `x-forwarded-for` / `x-real-ip`, con fallback a "desconocida") y
  `logAccess({ usuario, ip, userAgent, resultado })`, que agrega
  (`appendFile`) una línea tab-separada (fecha, hora, usuario, ip,
  navegador, resultado) al archivo de `ACCESS_LOG_FILE`; el archivo se
  crea solo si no existe.
- `src/app/api/auth/login/route.ts` (login unificado admin/líder): se
  registra un evento OK o FALLIDO en cada intento, tanto para admin
  (`users.txt`) como para líder.
- `src/app/api/captura/auth/login/route.ts` (login directo de líder en
  `/captura`): mismo registro de OK/FALLIDO.
- `.gitignore`: se agregó `access.log` (contiene usuario, IP y navegador
  de usuarios reales; no debe versionarse).
- Producción (192.168.227.243), `/etc/nginx/sites-available/campana`: se
  agregó `proxy_set_header X-Real-IP $remote_addr;` y
  `proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;` a los
  bloques de `jj.pereirasi.co` y `cht.pereirasi.co` (antes no se
  reenviaba la IP real del cliente a la app). Se hizo backup del archivo
  original (`campana.bak-<fecha>`) antes de modificarlo, se validó con
  `nginx -t` y se recargó con `systemctl reload nginx`.

Validación hecha:
- `npx tsc --noEmit` sin errores.
- `npx next build` compila y genera todas las rutas sin errores.
- Prueba end-to-end en un servidor dev de prueba (puerto 3002, aparte del
  dev server del usuario): login con clave incorrecta y login correcto
  contra el usuario `admin` de `users.txt`, con `X-Forwarded-For` de
  prueba — el archivo `access.log` se creó solo y quedaron las dos líneas
  con el formato esperado (fecha, hora, usuario, ip, navegador,
  OK/FALLIDO). Archivo de prueba borrado después.
- En producción: `jj.pereirasi.co` y `cht.pereirasi.co` siguen
  respondiendo igual que antes del cambio de nginx (307 a `/login`).

No se subió nada a GitHub ni se desplegó a producción (la app en sí no
cambió de versión desplegada), según la regla general del proyecto. Solo
se tocó la config de nginx en el host, con aprobación explícita.

---

# Log de acciones de administrador sobre líderes y referidos

## Contexto
`ACCESS_LOG_FILE` (`access.log`) ya registra logins (OK/FALLIDO) vía
`logAccess` (`src/lib/accessLog.ts`). Ahora se pide registrar, en el mismo
archivo, cuando un **administrador** (usuario de `users.txt`, no un líder)
modifica o elimina un líder o un referido. Cada evento: fecha, hora,
usuario, IP y acción (`lider <nombre completo> modificado`, `lider <nombre
completo> eliminado`, `referido <nombre completo> modificado`, `referido
<nombre completo> eliminado`). Los líderes también tienen acceso al
sistema (zona `/captura`) pero sus acciones ahí **no** se registran — solo
las del panel de admin.

Las rutas afectadas (`/api/lideres/[id]` y `/api/referidos/[id]`, métodos
PUT/DELETE) ya están protegidas por el middleware con la cookie de sesión
de admin (`pigp_session`), así que todo lo que llega ahí es admin, nunca
un líder (los líderes usan rutas separadas bajo `/api/captura`).

## Plan
- [x] En `src/lib/accessLog.ts`: agregar `logAction({ usuario, ip, accion })`
      que agrega al mismo `ACCESS_LOG_FILE` una línea tab-separada (fecha,
      hora, usuario, ip, accion), reusando `resolveLogFile()`.
- [x] En `src/app/api/lideres/[id]/route.ts`:
      - `PUT`: tras el `UPDATE` exitoso, leer el usuario admin desde la
        cookie de sesión (`verifySessionToken`) y la IP (`getClientIp`), y
        llamar `logAction` con `lider <nombre> <apellidos> modificado`.
      - `DELETE`: ampliar el `SELECT` existente (que ya trae `foto`) para
        traer también `nombre, apellidos` antes de borrar, y registrar
        `lider <nombre> <apellidos> eliminado`.
- [x] En `src/app/api/referidos/[id]/route.ts`:
      - `PUT`: tras el `UPDATE` exitoso, registrar `referido <nombre>
        <apellidos> modificado` (nombre/apellidos ya vienen en el body).
      - `DELETE`: agregar un `SELECT nombre, apellidos` antes de borrar (hoy
        no hay ninguno) y registrar `referido <nombre> <apellidos>
        eliminado`.
- [x] Verificar `npx tsc --noEmit` (sin errores). No se hizo prueba manual
      en navegador en este entorno (ver nota en Revisión).

## Fuera de alcance (por ahora)
- No se registra nada de las acciones de los líderes en `/captura`.
- No se sube a GitHub ni se despliega a producción hasta aprobación
  explícita.

## Revisión

Cambios realizados:
- `src/lib/accessLog.ts`: nueva función `logAction({ usuario, ip, accion })`
  que agrega una línea tab-separada (fecha, hora, usuario, ip, accion) al
  mismo archivo de `ACCESS_LOG_FILE`, independiente de `logAccess` (que
  sigue solo para logins).
- `src/app/api/lideres/[id]/route.ts`: `PUT` registra `lider <nombre>
  <apellidos> modificado` tras el update; `DELETE` ahora también selecciona
  `nombre, apellidos` (antes solo `foto`) y registra `lider <nombre>
  <apellidos> eliminado` antes de responder. En ambos casos se lee el
  usuario admin de la cookie `pigp_session` (`verifySessionToken`) y solo
  se escribe el log si hay una sesión de admin válida.
- `src/app/api/referidos/[id]/route.ts`: `PUT` registra `referido <nombre>
  <apellidos> modificado`; `DELETE` agrega un `SELECT nombre, apellidos`
  nuevo (antes no había ninguno) y registra `referido <nombre> <apellidos>
  eliminado`.

Nota de diseño: ambas rutas (`/api/lideres/[id]` y `/api/referidos/[id]`)
están protegidas por el middleware con la cookie de admin (`pigp_session`),
y los líderes usan rutas separadas bajo `/api/captura` — por eso nunca
llega a estas rutas una sesión de líder, y no fue necesario distinguir
roles más allá de confirmar que la cookie de admin es válida.

Validación hecha:
- `npx tsc --noEmit` sin errores.
- No se probó en navegador en este entorno (sin servidor dev corriendo ni
  herramienta de browser disponible); queda pendiente que el usuario
  confirme en su propio entorno editando/eliminando un líder y un referido
  de prueba y revisando las líneas nuevas en `access.log`.

No se subió nada a GitHub ni se desplegó a producción, según lo pedido.

---

# Plantilla de correo "Gestiones nuevas" + envío automático al crear gestión

## Contexto
Nueva pestaña "Plantillas" en Configuración, con una primera opción
"Gestiones nuevas". Al crearse una gestión nueva (`POST /api/gestiones`),
se envía un correo automático al gestor responsable (email de la tabla
`gestores`) usando esa plantilla, con el placeholder `$nombre` resuelto al
nombre del gestor. Se reutiliza el SMTP ya configurado (`src/lib/mailer.ts`).

## Decisiones confirmadas
- [x] El asunto del correo queda fijo en código, pero el texto es
      configurable vía una variable de `.env` (ej.
      `PLANTILLA_GESTION_NUEVA_ASUNTO=Nueva gestión asignada`); el archivo
      de la plantilla es solo el cuerpo del mensaje.
- [x] La plantilla se guarda como archivo de texto plano; la ruta del
      archivo se define en `.env` (ej.
      `PLANTILLA_GESTION_NUEVA_FILE=plantillas/gestion_nueva.txt`), mismo
      patrón que `ACCESS_LOG_FILE`.
- [x] La edición de la plantilla ocurre **dentro de la misma pestaña**
      "Plantillas" (cambia el panel a un editor con textarea + Guardar/
      Volver), igual al patrón de las demás pestañas de Configuración — no
      es una página/URL aparte.
- [x] Si el envío del correo falla (SMTP caído, gestor sin email, etc.), la
      gestión se crea igual; el error solo se registra con
      `console.error`, nunca bloquea ni se reporta en la respuesta al
      usuario.

## Plan
- [x] `.env` / `.env.example`: agregar
      `PLANTILLA_GESTION_NUEVA_FILE=plantillas/gestion_nueva.txt` y
      `PLANTILLA_GESTION_NUEVA_ASUNTO=Nueva gestión asignada`.
- [x] `.gitignore`: agregar `plantillas/` (contenido editable en
      producción, no debe versionarse, igual que `users.txt`/`access.log`).
- [x] Crear `src/lib/plantillas.ts`: `leerPlantilla(envVar, defaultPath)` /
      `guardarPlantilla(...)` que leen/escriben el archivo de texto plano
      (crean el directorio si no existe); si el archivo no existe aún,
      devuelve `""` en la lectura.
- [x] Endpoint `GET /api/plantillas/gestion-nueva` (devuelve
      `{ contenido }`) y `PUT /api/plantillas/gestion-nueva` (recibe
      `{ contenido }`, sobreescribe el archivo). Protegido por el
      middleware de admin existente (no está bajo `/api/captura`).
- [x] Reusar/extender `reemplazarPlaceholders` o una variante mínima para
      soportar `$nombre` → nombre del gestor (sin reusar `LiderPlaceholderData`,
      que no aplica aquí — función propia simple en `src/lib/plantillas.ts`
      o inline en el endpoint de envío).
- [x] En `src/app/configuracion/page.tsx`: agregar pestaña `{ key:
      "plantillas", label: "Plantillas", kind: "plantillas" }` a `TABS`, y
      renderizar un nuevo componente `PlantillasManager` cuando
      `kind === "plantillas"`.
- [x] Crear `src/components/catalogos/PlantillasManager.tsx`: lista con un
      solo ítem "Gestiones nuevas"; al hacer click cambia el panel a un
      editor (carga el contenido actual vía `GET`, textarea, botones
      "Guardar" y "Volver"), con el Toast existente para confirmar guardado.
- [x] En `src/app/api/gestiones/route.ts` (`POST`, tras el `INSERT`
      exitoso): consultar `nombre, email` del `gestor_id` recién asignado;
      si hay email válido, leer la plantilla, reemplazar `$nombre` y enviar
      el correo con `sendMail` usando el asunto de
      `PLANTILLA_GESTION_NUEVA_ASUNTO`. Nunca bloquea ni falla la respuesta
      si el envío falla (try/catch con `console.error`).
- [x] Verificar `npx tsc --noEmit` y `npx next build`. Probar en local:
      editar la plantilla, crear una gestión de prueba con un gestor con
      email real/propio y confirmar que llega el correo con `$nombre`
      resuelto.

## Fuera de alcance (por ahora)
- No se agregan más plantillas aparte de "Gestiones nuevas" (la pestaña
  queda preparada para agregar más después, pero hoy solo tiene una).
- No se sube a GitHub ni se despliega a producción hasta aprobación
  explícita (y, de desplegarse, habrá que agregar un volumen Docker para
  `plantillas/` igual que se hizo con `access.log`, para que el archivo no
  se pierda en cada deploy — se documentará en ese momento).

## Revisión

Cambios realizados:
- `.env` / `.env.example`: nuevas variables `PLANTILLA_GESTION_NUEVA_FILE`
  y `PLANTILLA_GESTION_NUEVA_ASUNTO`.
- `.gitignore`: se agregó `/plantillas/` (contenido editable en
  producción, no se versiona).
- `src/lib/plantillas.ts` (nuevo): `leerPlantilla`/`guardarPlantilla`
  (archivo de texto plano, crean el directorio si falta) y
  `reemplazarPlaceholdersGestor` (placeholder `$nombre`).
- `src/app/api/plantillas/gestion-nueva/route.ts` (nuevo): `GET`/`PUT` de
  la plantilla. Se marcó `export const dynamic = "force-dynamic"` porque
  Next optimizaba el `GET` como ruta estática (cacheaba el contenido leído
  al momento del build) — sin eso, los cambios guardados desde la UI no se
  habrían reflejado en producción hasta el próximo build/redeploy.
- `src/components/catalogos/PlantillasManager.tsx` (nuevo): lista con el
  ítem "Gestiones nuevas"; al click cambia el panel a un editor
  (textarea + Guardar/Volver), mismo patrón que el resto de Configuración.
- `src/app/configuracion/page.tsx`: nueva pestaña "Plantillas".
- `src/app/api/gestiones/route.ts` (`POST`): tras crear la gestión,
  `notificarGestorNuevaGestion` consulta el email del gestor, lee la
  plantilla, reemplaza `$nombre` y envía el correo con `sendMail`; si no
  hay email válido, no hay plantilla guardada, o el envío falla, no
  bloquea ni falla la respuesta (try/catch con `console.error`).

Validación hecha:
- `npx tsc --noEmit` y `npx next build` sin errores.
- Prueba end-to-end en un servidor de prueba local (puerto 3002, aparte
  del dev server del usuario): login como admin, guardar una plantilla de
  prueba vía `PUT` y confirmar que el `GET` posterior la refleja (no
  cacheada), crear un gestor y una gestión de prueba con el email del
  usuario, y confirmar que no quedó ningún error en el log del servidor
  tras el envío. Gestor y gestión de prueba se eliminaron después; el
  archivo de plantilla de prueba también se borró.
- Pendiente que el usuario confirme si el correo de prueba llegó
  efectivamente a su bandeja (el código no reporta error, pero esa es la
  confirmación final de extremo a extremo).

No se subió nada a GitHub ni se desplegó a producción, según lo pedido.

---

# Más placeholders en la plantilla "Gestiones nuevas"

## Contexto
Además de `$nombre`, la plantilla de correo al gestor debe soportar:
- `$ayuda`: descripción del tipo de ayuda seleccionado.
- `$fecha`: la fecha límite definida.
- `$observaciones`: el texto de observaciones de la gestión.

También agregar en el editor de la plantilla una ayuda "Placeholders
disponibles", igual a la de `/lideres/enviar-correo` (tabla colapsable con
placeholder + descripción).

## Plan
- [x] `src/lib/plantillas.ts`: generalizar
      `reemplazarPlaceholdersGestor(texto, nombre)` a una función que
      reciba un mapa de valores (`{ nombre, ayuda, fecha, observaciones }`)
      y reemplace cada `$clave`, igual al patrón de
      `emailPlaceholders.ts`.
- [x] `src/app/api/gestiones/route.ts`: `notificarGestorNuevaGestion`
      recibe también `tipo_ayuda_id`, `fecha_limite` y `observaciones`;
      consulta la descripción del tipo de ayuda (`tipos_ayuda`) y arma el
      mapa de placeholders antes de reemplazar.
- [x] `src/components/catalogos/PlantillasManager.tsx`: agregar sección
      colapsable "Placeholders disponibles" (tabla placeholder/descripción)
      en el editor, igual patrón que `enviar-correo/page.tsx`.
- [x] Verificar `npx tsc --noEmit` y `npx next build`.

## Fuera de alcance (por ahora)
- No se sube a GitHub ni se despliega a producción hasta aprobación
  explícita.

## Revisión

Cambios realizados:
- `src/lib/plantillas.ts`: `reemplazarPlaceholdersGestor` reemplazada por
  `reemplazarPlaceholdersPlantilla(texto, valores)`, genérica (mapa
  clave→valor), igual patrón que `emailPlaceholders.ts`.
- `src/app/api/gestiones/route.ts`: `notificarGestorNuevaGestion` ahora
  recibe `{ gestorId, tipoAyudaId, fechaLimite, observaciones }`, consulta
  la descripción del tipo de ayuda y arma `$nombre`, `$ayuda`, `$fecha`
  (recortada a `YYYY-MM-DD`) y `$observaciones` antes de enviar.
- `src/components/catalogos/PlantillasManager.tsx`: cada plantilla declara
  su lista de `placeholders`; el editor muestra una sección colapsable
  "Placeholders disponibles" con esa tabla, igual a la de
  `/lideres/enviar-correo`.

Validación hecha:
- `npx tsc --noEmit` y `npx next build` sin errores.

No se subió nada a GitHub ni se desplegó a producción, según lo pedido.
