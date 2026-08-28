# Campaña Política — Registro de Colaboradores

Aplicación web para llevar el registro de **líderes** y sus **referidos** en una campaña política: datos personales, sitio de votación (zona/puesto), ubicación territorial (comuna/barrio), catálogos de profesión/ocupación/parentesco y atributos de colaboración (vehículo, redes sociales, orador, cantante, testigo electoral).

## Stack técnico

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS**
- **MariaDB / MySQL** (vía `mysql2`) — conexión a `127.0.0.1`
- Cifrado reversible (AES-256-GCM) para la clave de cada líder (ver Notas de seguridad)

## Estructura del proyecto

```
PIGP/
├─ sql/schema.sql              # Script de creación de BD + datos semilla
├─ src/
│  ├─ app/
│  │  ├─ page.tsx              # Dashboard
│  │  ├─ lideres/page.tsx      # Gestión de líderes
│  │  ├─ referidos/page.tsx    # Gestión de referidos (filtrable por líder)
│  │  ├─ zonas/page.tsx        # Zonas y puestos de votación
│  │  ├─ comunas/page.tsx      # Comunas y barrios
│  │  ├─ configuracion/page.tsx# Profesiones, ocupaciones, parentescos
│  │  └─ api/                  # API routes (REST) para cada entidad
│  ├─ components/               # UI, layout (sidebar/topbar), formularios
│  ├─ hooks/useCatalogos.ts     # Carga combos en cascada
│  └─ lib/                      # db.ts (pool), types.ts, validations.ts, upload.ts
├─ public/uploads/lideres/      # Fotos de líderes subidas desde la app
└─ .env.local                   # Credenciales de conexión a la BD
```

## 1. Requisitos previos

- Node.js 18.17+ (usa Node 24, ya verificado en este equipo)
- MariaDB o MySQL corriendo en `127.0.0.1:3306` con usuario `root` / clave `juanda2005`
  (en este equipo ya se detectó el servicio **MySQL80** activo en el puerto 3306)

## 2. Crear la base de datos

Ejecuta el script SQL inicial (crea la BD `PIGP`, todas las tablas y datos semilla de zonas/comunas/profesiones/ocupaciones/parentescos de ejemplo):

```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -h 127.0.0.1 -u root -pjuanda2005 < sql\schema.sql
```

> Si tu instalación de MySQL/MariaDB está en otra ruta, ajusta la ruta al ejecutable `mysql.exe`, o abre el archivo `sql/schema.sql` con cualquier cliente (HeidiSQL, DBeaver, MySQL Workbench) y ejecútalo completo.

Esto ya fue ejecutado y verificado en este entorno: las 9 tablas fueron creadas y los catálogos de ejemplo insertados correctamente.

## 3. Instalar dependencias

```powershell
npm install
```

## 4. Variables de entorno

El archivo `.env.local` ya está creado con:

```
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=juanda2005
DB_NAME=PIGP
AUTH_SECRET=<clave aleatoria para firmar la sesión de login>
```

Si cambias credenciales, edita este archivo (no se sube a git, ver `.gitignore`).

## 4.1 Usuarios de acceso a la aplicación

La app pide **usuario y clave** antes de dejar entrar a cualquier pantalla. Las credenciales viven en el archivo `users.txt` (raíz del proyecto, **no se sube a git** porque guarda claves en texto plano), un usuario por línea:

```
usuario:contrasena
```

Ya existe uno de ejemplo (`admin:changeme123`) — **cámbialo** antes de usar la app en serio. Para agregar más usuarios, agrega más líneas con el mismo formato y reinicia el servidor (`npm run dev` / `npm start`) para que tome los cambios. Hay una plantilla en `users.txt.example`.

## 5. Correr en desarrollo

```powershell
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## 6. Compilar para producción

```powershell
npm run build
npm start
```

(`npm run build` ya fue probado en este entorno y compila sin errores.)

---

## Cómo probar cada característica

0. **Login unificado** (`/login`): al abrir la app se pide usuario y clave (ver sección 4.1). Primero se valida contra `users.txt`: si el usuario existe ahí, entra al panel de administración completo. Si no, se busca ese mismo usuario/clave en la tabla `lideres` y, de coincidir, entra directo a `/captura` (su propio portal de referidos) en vez del panel. Con credenciales incorrectas muestra un error; con las correctas queda una sesión de 8 horas. El botón de la esquina superior derecha (junto al nombre de usuario) cierra sesión y vuelve a `/login`.
1. **Menú hamburguesa**: al entrar, el panel lateral está oculto y solo se ve el Dashboard. Haz clic en el ícono ☰ (arriba a la izquierda) para mostrar/ocultar el menú.
2. **Dashboard**: muestra total de líderes, total de referidos, promedio de referidos por líder, damnificados por terremoto, líderes por comuna y el top 5 de líderes con más referidos.
3. **Zonas** (menú → Zonas): crea zonas (código de 2 dígitos, ej. `01`) y, al seleccionar una zona, agrega sus puestos de votación (número de 2 dígitos, nombre y número de mesas).
4. **Comunas** (menú → Comunas): crea comunas (código + descripción) y, al seleccionar una, agrega sus barrios.
5. **Configuración** (menú → Configuración): tres pestañas para gestionar Profesiones, Ocupaciones y Parentescos (catálogos usados luego en los formularios).
6. **Líderes** (menú → Líderes):
   - Clic en "Nuevo líder" abre el formulario completo: datos personales, sexo (radio), comuna→barrio y zona→puesto en cascada, profesión/ocupación (combos), fecha de nacimiento (date picker), estado (Activo/Inactivo), foto (subir imagen y verla en tamaño carné), usuario y clave (opcionales, en una línea corta, con botón de mostrar/ocultar clave), los 5 checkboxes de atributos y la sección "Contratista".
   - La tabla muestra la **edad** (calculada desde la fecha de nacimiento; si nació en el año centinela `SENTINEL_BIRTH_YEAR` del `.env`, se muestra edad 0) y, debajo del nombre, la etiqueta "Contratista" cuando aplica.
   - Filtros por comuna, barrio (en cascada), puesto de votación, atributos y "solo contratistas", además de la búsqueda por nombre/apellido/cédula.
   - Clic en cualquier parte de la fila abre la edición; eliminar un líder borra también sus referidos.
7. **Referidos** (menú → Referidos):
   - Requiere al menos un líder creado. El formulario pide el líder al que pertenece, datos personales, ubicación (comuna/barrio, zona/puesto), parentesco, checkboxes "votó la vez pasada" y "damnificado en terremoto", y los mismos 5 atributos.
   - La lista se puede **filtrar por líder** con el combo superior, y buscar por nombre/cédula. La columna "Edad" se calcula igual que en Líderes (respetando `SENTINEL_BIRTH_YEAR`).
8. **Validaciones**: cédula (solo números), celular, email, y todos los campos obligatorios muestran mensajes de error en rojo antes de permitir guardar; los errores de base de datos (duplicados, conexión caída, etc.) se muestran como notificación (toast).
9. **Responsive**: reduce el ancho del navegador o pruébalo en un celular; las tablas hacen scroll horizontal y los formularios se apilan en una sola columna.
10. **Captura para líderes** (`/captura`): portal aparte para que cada líder gestione sus propios referidos, sin entrar al panel de administración.
    - Se llega ahí iniciando sesión en `/login` con el usuario/clave del líder (ver punto 0), o directamente en `/captura/login` con esas mismas credenciales.
    - Al entrar ve **únicamente sus propios referidos**, con búsqueda, crear/editar/eliminar.
    - El formulario de referido **no pide líder** — el backend lo asigna automáticamente al líder que inició sesión; un líder no puede ver ni modificar referidos de otro (se valida en el servidor, no solo se oculta en la pantalla).
    - Sesión independiente de la del panel admin; cada una usa su propia cookie.
11. **Gestiones** (menú → Gestiones): seguimiento de ayudas/favores solicitados por los referidos.
    - La pantalla principal lista solo los referidos que **ya tienen alguna gestión**, ordenados por la fecha límite pendiente más próxima a vencer (las vencidas quedan primero, resaltadas), con columnas Nombre, Próxima fecha, Total, Pendientes, No viables, Resueltas y Vencidas.
    - Arriba hay un **buscador por nombre/cédula** que encuentra cualquier referido (tenga o no gestiones) para abrirle su pantalla y registrarle la primera.
    - Clic en un referido (de la lista o del buscador) abre su pantalla de gestiones: tabla de sus gestiones + botón "Nueva gestión".
    - Cada gestión captura: tipo de ayuda (catálogo), responsable (catálogo de gestores, nombre + email + teléfono), fecha límite, observaciones, y estado (Pendiente / No viable / Resuelto). **Costo** y **fotografías** están deshabilitados y solo se pueden diligenciar cuando el estado pasa a "Resuelto" (al pasar a Resuelto queda registrada la fecha/hora exacta de resolución).
    - Las fotos de la gestión se pueden **ampliar y descargar**: pasa el mouse sobre una miniatura y haz clic en el ícono de lupa para verla en grande, con un botón de descarga.
    - Catálogos "Tipos de ayuda" y "Gestores" se administran desde **Configuración**.

## Notas de seguridad

- La clave del líder se guarda **cifrada de forma reversible** (AES-256-GCM, clave derivada de `AUTH_SECRET`) en vez de con hash bcrypt: al editar un líder desde el panel, el campo Clave viene prellenado con su clave actual (protegida, con botón de mostrar/ocultar), para poder decírsela si la olvidó sin tener que asignarle una nueva. Es una decisión consciente de seguridad más baja a cambio de esa funcionalidad — el listado de líderes nunca incluye la clave, solo la edición individual la descifra. Líderes creados antes de este cambio (con clave en bcrypt) no se pueden migrar automáticamente; hay que asignarles una clave nueva.
- Las fotos se guardan en `public/uploads/lideres/` con nombre aleatorio; solo se aceptan JPG/PNG/WEBP hasta 5MB.
- El login de la aplicación usa `users.txt` con contraseñas **en texto plano**, tal como se pidió — es un mecanismo simple pensado para uso interno/local, no equivalente en seguridad al hash de las claves de líderes. La sesión se guarda en una cookie `httpOnly` firmada (HMAC), no en el propio archivo.
