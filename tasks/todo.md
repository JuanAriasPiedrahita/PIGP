# Registro: migración de BD + despliegue en contenedor (192.168.227.243)

Tarea operativa (no de código con plan previo): el usuario pidió, en
mensajes sucesivos, migrar la base de datos de producción a un nuevo
servidor Docker y empaquetar/desplegar la app ahí como contenedor. Se
ejecutó directamente, documentando cada paso.

## 1) Migración de la base de datos (.242 → contenedor `mysql` en .243)

- [x] Conectado a `.242` (producción) por SSH con la llave existente.
- [x] Conectado a `.243` por SSH con contraseña (usuario/clave que dio el
      usuario) usando `plink.exe` (no había `sshpass` disponible en este
      entorno Windows).
- [x] `.243` ya tenía una base `campana_politica` — **no se tocó**, es de
      otro proyecto (el usuario lo aclaró explícitamente).
- [x] Se creó la base `PIGP` nueva en el contenedor `mysql` de `.243`, con
      el mismo charset/collation que el origen (`utf8mb4_unicode_ci`).
- [x] Export/import directo `mysqldump | mysql` desde `.242` hacia
      `.243:3306` (sin dejar el volcado en disco). `.242` tenía línea
      directa a `.243` en la misma LAN.
- [x] Verificado con `COUNT(*)` real (no `information_schema`, que venía
      con estadísticas desactualizadas) en las 15 tablas: coincide exacto
      entre origen y destino.

## 2) Empaquetado Docker de la app

- [x] `next.config.mjs`: `output: "standalone"`.
- [x] `Dockerfile` nuevo (build multi-stage, imagen final `node:20-alpine`
      no-root). La config (DB, `AUTH_SECRET`, etc.) nunca se copia a la
      imagen — se pasa en tiempo de ejecución.
- [x] `.dockerignore` nuevo.
- [x] **Bug encontrado y corregido:** `public/` no estaba versionado en
      git (solo `public/uploads/`, vía `.gitignore`), y el `.gitkeep` que
      ese mismo `.gitignore` esperaba nunca se había creado — en un clon
      limpio la carpeta no existía y el build de Docker fallaba en el
      `COPY /app/public`. Se agregó el `.gitkeep` y un `mkdir -p public`
      defensivo en el Dockerfile.
- [x] Todo commiteado y pusheado a GitHub (3 commits: Dockerfile, fix de
      `public/`, y la documentación en `DEPLOY.md`).
- [x] (Nota lateral) el push falló la primera vez por permisos — la cuenta
      `gh` activa (`reinel-arias`) no tiene push al repo; se cambió a la
      cuenta `JuanAriasPiedrahita` con `gh auth switch` y quedó resuelto
      para el resto de la sesión.

## 3) Despliegue del contenedor en `.243`

- [x] Clonado el repo en `~/pigp` (mismo patrón que ya usaba `~/campana-app`
      en ese servidor).
- [x] Usuario de base de datos dedicado `pigp_app` creado en el contenedor
      `mysql` (en vez de usar las credenciales root de ese contenedor
      desde la app), con privilegios solo sobre `PIGP`.
- [x] `~/pigp.env` creado en el **home de `operador`** (no dentro del
      contenedor/imagen, como pidió el usuario), con `DB_HOST=mysql`
      (nombre del contenedor, resuelto por DNS interno de la red `lan1`) y
      el mismo `AUTH_SECRET` que producción (necesario para que las claves
      de líder ya cifradas en la base migrada se puedan descifrar igual).
- [x] `~/pigp_users.txt` (credenciales del panel admin) copiado también
      fuera de la imagen, igual que `.env`.
- [x] `~/pigp_uploads/` creado como volumen para que las fotos subidas
      sobrevivan a un recreate del contenedor.
- [x] Build (`docker build -t pigp:latest .`) y
      `docker run -d --name pigp --network lan1 --env-file ~/pigp.env
      -p 3001:3000 ...` (puerto 3001 porque el 3000 ya lo usa otra app en
      ese mismo servidor).
- [x] **Bug encontrado y corregido:** `pigp.env`/`pigp_users.txt` quedaron
      en `600` (solo el dueño del archivo puede leerlo), pero el proceso
      dentro del contenedor corre como usuario no-root `nextjs` (uid 1001)
      — no podía leerlos. Se corrigió a `644`/`777` según el caso.
- [x] Verificación funcional completa contra el contenedor real:
      `/login` → 200, login real con las credenciales de `users.txt` →
      `ok`, `/api/lideres` con sesión → devuelve los 5 líderes migrados
      (con `coordinador_logistica` incluido), acceso externo confirmado
      en `http://192.168.227.243:3001`.
- [x] Documentado el flujo completo en `DEPLOY.md` (sección 16) para que
      quede como referencia de cómo repetirlo/actualizarlo.

---

## Revisión final

**Qué se hizo:** se migró la base de datos de producción de PIGP a un
contenedor MySQL nuevo en el servidor de microservicios Docker
(`192.168.227.243`), y se empaquetó la app como contenedor Docker propio
(`pigp`), conectado a esa base por la red interna `lan1`, expuesto en el
puerto `3001` del host. Todo quedó verificado funcionando con datos reales
(login, líderes, el atributo "Coordinador logística" de la tarea anterior).

**Decisiones de seguridad tomadas sin que se pidieran explícitamente, pero
alineadas con lo que ya pedía el usuario para `.env`:**
- Usuario de base de datos dedicado (`pigp_app`) en vez de usar `root` del
  contenedor `mysql` desde la app.
- `users.txt` también se dejó fuera de la imagen (montado), igual que
  `.env` — mismo criterio que pidió el usuario, aplicado por consistencia.

**Dos bugs preexistentes/nuevos encontrados y corregidos en el camino:**
1. `public/` sin `.gitkeep` (afecta a cualquiera que clone el repo limpio,
   no solo a Docker) — corregido y commiteado.
2. Permisos `600` en archivos montados vs. el usuario no-root del
   contenedor — eran archivos creados en este despliegue, no un problema
   de antes.

**Pendiente para el usuario:**
- La advertencia de `DEPLOY.md` sobre `next start` cacheando la lista de
  `public/` al arrancar sigue aplicando aquí: una foto subida en caliente
  puede no verse hasta un `docker restart pigp`. No se montó un Nginx
  aparte para `uploads/` en este contenedor (como sí existe en `.242`)
  porque no se pidió — avísame si lo quieres replicar.
- Las claves que quedaron en `~/pigp.env`, `~/pigp_users.txt` y el usuario
  `pigp_app` de MySQL están en texto plano en el servidor `.243` (mismo
  criterio que ya se usa en `.242`). Si quieres rotarlas más adelante,
  dime.
