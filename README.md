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

Ejecuta el script SQL inicial (crea la BD `campana_politica`, todas las tablas y datos semilla de zonas/comunas/profesiones/ocupaciones/parentescos de ejemplo):

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
DB_NAME=campana_politica
```

Si cambias credenciales, edita este archivo (no se sube a git, ver `.gitignore`).

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

## Notas de seguridad

- La clave del líder se guarda **hasheada** (bcrypt) en la base de datos; nunca se devuelve en las respuestas de la API. El campo del formulario solo permite mostrar/ocultar el texto mientras se digita.
- Las fotos se guardan en `public/uploads/lideres/` con nombre aleatorio; solo se aceptan JPG/PNG/WEBP hasta 5MB.
