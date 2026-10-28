# Plan: "Mi Cuenta" en /captura (autoedición de datos del líder)

Objetivo: agregar una opción "Mi Cuenta" al menú de /captura que permita al
líder autenticado modificar sus propios datos y subir/cambiar su foto —
el equivalente, dentro de /captura, al formulario de líderes del panel
admin, pero acotado a sus propios datos y sin campos administrativos.

**Campos incluidos** (igual que el formulario admin): nombre, apellidos,
sexo, cédula, celular, email, comuna/barrio, dirección, zona/puesto,
profesión, ocupación, fecha de nacimiento, usuario, clave, atributos
(vehículo, redes sociales, orador público, cantante, testigo electoral) y
foto.

**Campos EXCLUIDOS** (administrativos, no autoeditable por el líder):
estado (activo/inactivo), "Equipo Logístico" (otorga permisos), y todo el
bloque de contratista (objeto/vencimiento del contrato, dependencia).

## Backend

- [x] `src/app/api/captura/catalogos/route.ts`: agregar `profesiones` y
      `ocupaciones` a la respuesta (el formulario de perfil los necesita;
      hoy solo se exponían para referidos).
- [x] `src/hooks/useCapturaCatalogos.ts`: incluir esos dos catálogos en el
      objeto devuelto.
- [x] Nuevo `src/app/api/captura/perfil/route.ts`:
      - `GET`: devuelve los datos del líder autenticado (`requireLider`),
        clave descifrada, sin exponer `estado`/`contratista`.
      - `PUT`: valida y actualiza solo el líder de la sesión (el id nunca
        viene del cliente), maneja la foto (`saveImage`/`deleteImage`) igual
        que `/api/lideres/[id]`, sin tocar `estado`, `coordinador_logistica`
        ni los campos de contratista.

## Frontend

- [x] Nuevo `src/components/captura/CapturaPerfilForm.tsx`: basado en
      `LiderForm`, sin los campos excluidos arriba.
- [x] Nuevo `src/app/captura/perfil/page.tsx`: página con el mismo layout
      (sidebar + header) que `/captura/eventos`, mostrando el formulario
      directamente.
- [x] `src/components/captura/CapturaSidebar.tsx`: agregar ítem "Mi Cuenta"
      → `/captura/perfil`.

## Verificación

- [x] `npx tsc --noEmit` — sin errores.
- [x] Prueba funcional contra la base de datos local: login como líder vía
      `/api/captura/auth/login`, `GET /api/captura/perfil` (datos y clave
      descifrada correctos), `PUT /api/captura/perfil` (actualiza dirección
      y atributos), confirmado por consulta directa a `lideres` que el
      cambio persiste y que `estado`/`coordinador_logistica` (campos
      administrativos) quedan intactos. Cambios de prueba revertidos.

---

## Revisión final

**Qué se hizo:** se agregó la opción "Mi Cuenta" al menú de `/captura`
(`/captura/perfil`), que permite al líder autenticado editar sus propios
datos (igual que el formulario de líderes del panel admin) y subir o
cambiar su foto. Quedan fuera de su alcance, a propósito, los campos
administrativos: `estado`, "Equipo Logístico" (otorga permisos) y el
bloque de contratista — esos solo los puede tocar un admin desde
`/lideres`. Usuario y clave de acceso sí son autoeditables, por decisión
explícita del usuario.

**Decisión de diseño:** se reutilizó el endpoint `/api/captura/catalogos`
(agregándole profesiones/ocupaciones) en vez de crear uno nuevo, y se
extrajo `saveImage`/`deleteImage` (ya existentes en `lib/upload.ts`) en
lugar de los alias `savePhoto`/`deletePhoto`, marcados `@deprecated` en el
código.

**Nada pendiente** de esta tarea.
