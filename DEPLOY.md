# Despliegue en producción — Ubuntu Linux

Guía para poner PIGP a correr en un servidor Ubuntu (22.04/24.04) limpio.
Cubre Node.js, MariaDB, la app (con PM2) y Nginx como reverse proxy con HTTPS.

## 1. Preparar el servidor

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git build-essential ufw
```

## 2. Instalar Node.js 20 LTS

El proyecto requiere Node 18.17+ (usa 20 LTS, verificado en desarrollo).

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # v20.x
npm -v
```

## 3. Instalar y asegurar MariaDB

```bash
sudo apt install -y mariadb-server
sudo systemctl enable --now mariadb
sudo mysql_secure_installation
```

Responde `Y` a todo (fijar clave de root, quitar usuarios anónimos, deshabilitar login remoto de root, quitar la base `test`, recargar privilegios).

**Importante**: `enable` deja MariaDB arrancando automáticamente en cada reinicio del servidor — no lo olvides, es el error más común al mover esto de un entorno de desarrollo a producción.

Crea la base de datos y un usuario dedicado para la app (evita usar `root` directamente):

```bash
sudo mysql -u root -p
```

```sql
CREATE DATABASE PIGP CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'pigp_app'@'localhost' IDENTIFIED BY 'CLAVE_FUERTE_AQUI';
GRANT ALL PRIVILEGES ON PIGP.* TO 'pigp_app'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## 4. Bajar el código

```bash
sudo mkdir -p /var/www/pigp
sudo chown $USER:$USER /var/www/pigp
git clone https://github.com/JuanAriasPiedrahita/PIGP.git /var/www/pigp
cd /var/www/pigp
```

## 5. Instalar dependencias

```bash
npm ci
```

## 6. Crear la base de datos: ejecutar el schema

```bash
mysql -u pigp_app -p PIGP < sql/schema.sql
```

Esto crea todas las tablas y siembra los catálogos de ejemplo (zonas, comunas, barrios, profesiones, etc. — algunos son datos reales de Pereira, otros de ejemplo; revísalos y ajústalos según la campaña real).

## 7. Variables de entorno (`.env`)

Crea `/var/www/pigp/.env` (nunca lo subas a git — ya está en `.gitignore`):

```bash
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=pigp_app
DB_PASSWORD=CLAVE_FUERTE_AQUI
DB_NAME=PIGP

# Genera una propia y única para este servidor — NO reutilices la de desarrollo.
AUTH_SECRET=

# Año centinela de "fecha de nacimiento desconocida" (edad se muestra como 0).
SENTINEL_BIRTH_YEAR=1900

# Meses antes del vencimiento de un contrato para marcarlo "por vencer" en el dashboard.
CONTRATO_MESES_ALERTA=1

NODE_ENV=production
```

Genera `AUTH_SECRET` (firma las cookies de sesión Y cifra la clave de los líderes — debe ser único por entorno):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

⚠️ Si vas a copiar datos de líderes ya creados desde otro entorno, sus claves quedaron cifradas con el `AUTH_SECRET` de ese entorno — con uno distinto en producción no se podrán descifrar y esos líderes necesitarán que les asignes una clave nueva.

## 8. Usuarios de acceso al panel (`users.txt`)

```bash
cp users.txt.example users.txt
```

Edita `users.txt` (una línea `usuario:clave` por persona) y **cambia la clave de ejemplo** antes de exponer el sitio.

## 9. Compilar

```bash
npm run build
```

## 10. Carpeta de fotos subidas

Se crea sola en el primer upload (`public/uploads/lideres`, `public/uploads/gestiones`), pero confirma que el usuario que corre el proceso Node tenga permiso de escritura sobre `/var/www/pigp/public/uploads`.

## 11. Levantar la app con PM2 (mantiene el proceso vivo y lo reinicia si cae o si el servidor reinicia)

```bash
sudo npm install -g pm2
pm2 start npm --name pigp -- start
pm2 save
pm2 startup   # ejecuta el comando que imprime (usa sudo)
```

Por defecto `next start` sirve en el puerto 3000. Comandos útiles:

```bash
pm2 logs pigp
pm2 restart pigp
pm2 status
```

## 12. Nginx como reverse proxy

```bash
sudo apt install -y nginx
```

`/etc/nginx/sites-available/pigp`:

```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    client_max_body_size 10M;  # las fotos permiten hasta 5MB

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/pigp /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 13. HTTPS (Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d tu-dominio.com
```

Certbot configura la renovación automática; verifica con `sudo certbot renew --dry-run`.

## 14. Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'   # 80 + 443
sudo ufw enable
```

No abras el puerto 3000 al público — solo Nginx debe hablarle a la app.

## 15. Actualizar la app después del primer despliegue

```bash
cd /var/www/pigp
git pull origin main
npm ci
npm run build
pm2 restart pigp
```

Si el `git pull` trae cambios en `sql/schema.sql`, revísalo antes de aplicarlo — normalmente son solo tablas/columnas nuevas (`CREATE TABLE IF NOT EXISTS`, `ALTER TABLE ... ADD COLUMN`), pero conviene correr solo el bloque nuevo si el script completo ya se ejecutó antes (`CREATE INDEX` sin `IF NOT EXISTS` falla si el índice ya existe).

## Checklist de seguridad antes de anunciar el sitio

- [ ] `AUTH_SECRET` generado específicamente para este servidor (no reutilizado de desarrollo)
- [ ] Clave del usuario `admin` en `users.txt` cambiada del valor de ejemplo
- [ ] Clave de `pigp_app` en MariaDB fuerte y distinta a la de cualquier otro entorno
- [ ] `mysql_secure_installation` corrido, sin usuarios anónimos ni root remoto
- [ ] MariaDB no escucha en una IP pública (por defecto solo `127.0.0.1`, verifica `bind-address` en `/etc/mysql/mariadb.conf.d/50-server.cnf`)
- [ ] HTTPS activo (Let's Encrypt) y puerto 3000 no expuesto directamente
- [ ] `pm2 startup` configurado para que la app sobreviva un reinicio del servidor
