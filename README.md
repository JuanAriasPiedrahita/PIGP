# Campaña Política — Registro de Colaboradores

Aplicación web para llevar el registro de **líderes** y sus **referidos** en una campaña política: datos personales, sitio de votación (zona/puesto), ubicación territorial (comuna/barrio), catálogos de profesión/ocupación/parentesco y atributos de colaboración (vehículo, redes sociales, orador, cantante, testigo electoral).

## Stack técnico

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS**
- **MariaDB / MySQL** (vía `mysql2`) — conexión a `127.0.0.1`
- `bcryptjs` para el hash de la clave de cada líder

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

0. **Login**: al abrir la app se pide usuario y clave (ver sección 4.1). Con credenciales incorrectas muestra un error; con las correctas entra y queda una sesión de 8 horas. El botón de la esquina superior derecha (junto al nombre de usuario) cierra sesión.
1. **Menú hamburguesa**: al entrar, el panel lateral está oculto y solo se ve el Dashboard. Haz clic en el ícono ☰ (arriba a la izquierda) para mostrar/ocultar el menú.
2. **Dashboard**: muestra total de líderes, total de referidos, promedio de referidos por líder, damnificados por terremoto, líderes por comuna y el top 5 de líderes con más referidos.
3. **Zonas** (menú → Zonas): crea zonas (código de 2 dígitos, ej. `01`) y, al seleccionar una zona, agrega sus puestos de votación (número de 2 dígitos, nombre y número de mesas).
4. **Comunas** (menú → Comunas): crea comunas (código + descripción) y, al seleccionar una, agrega sus barrios.
5. **Configuración** (menú → Configuración): tres pestañas para gestionar Profesiones, Ocupaciones y Parentescos (catálogos usados luego en los formularios).
6. **Líderes** (menú → Líderes):
   - Clic en "Nuevo líder" abre el formulario completo: datos personales, sexo (radio), comuna→barrio y zona→puesto en cascada, profesión/ocupación (combos), fecha de nacimiento (date picker), estado (Activo/Inactivo), foto (subir imagen y verla en tamaño carné), usuario y clave (con botón de mostrar/ocultar), y los 5 checkboxes de atributos.
   - La tabla permite buscar por nombre/apellido/cédula, editar y eliminar (eliminar un líder borra también sus referidos).
7. **Referidos** (menú → Referidos):
   - Requiere al menos un líder creado. El formulario pide el líder al que pertenece, datos personales, ubicación (comuna/barrio, zona/puesto), parentesco, checkboxes "votó la vez pasada" y "damnificado en terremoto", y los mismos 5 atributos.
   - La lista se puede **filtrar por líder** con el combo superior, y buscar por nombre/cédula.
8. **Validaciones**: cédula (solo números), celular, email, y todos los campos obligatorios muestran mensajes de error en rojo antes de permitir guardar; los errores de base de datos (duplicados, conexión caída, etc.) se muestran como notificación (toast).
9. **Responsive**: reduce el ancho del navegador o pruébalo en un celular; las tablas hacen scroll horizontal y los formularios se apilan en una sola columna.
10. **Captura para líderes** (`/captura`): portal aparte para que cada líder gestione sus propios referidos, sin entrar al panel de administración.
    - Cada líder ingresa con el **usuario y clave que tiene registrados como líder** (los mismos campos "Usuario"/"Clave" de su ficha en el panel admin).
    - Al entrar ve **únicamente sus propios referidos**, con búsqueda, crear/editar/eliminar.
    - El formulario de referido **no pide líder** — el backend lo asigna automáticamente al líder que inició sesión; un líder no puede ver ni modificar referidos de otro (se valida en el servidor, no solo se oculta en la pantalla).
    - Sesión independiente de la del panel admin (`/login`); cada una usa su propia cookie.

## Notas de seguridad

- La clave del líder se guarda **hasheada** (bcrypt) en la base de datos; nunca se devuelve en las respuestas de la API. El campo del formulario solo permite mostrar/ocultar el texto mientras se digita.
- Las fotos se guardan en `public/uploads/lideres/` con nombre aleatorio; solo se aceptan JPG/PNG/WEBP hasta 5MB.
- El login de la aplicación usa `users.txt` con contraseñas **en texto plano**, tal como se pidió — es un mecanismo simple pensado para uso interno/local, no equivalente en seguridad al hash de las claves de líderes. La sesión se guarda en una cookie `httpOnly` firmada (HMAC), no en el propio archivo.
