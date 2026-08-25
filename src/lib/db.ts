import mysql from "mysql2/promise";

// Pool de conexión único y reutilizable contra MariaDB/MySQL.
// Credenciales tomadas de variables de entorno (ver .env.local).
declare global {
  // eslint-disable-next-line no-var
  var _mysqlPool: mysql.Pool | undefined;
}

function createPool(): mysql.Pool {
  return mysql.createPool({
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "PIGP",
    charset: "utf8mb4",
    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 10,
    idleTimeout: 60000,
    queueLimit: 0,
    dateStrings: true,
  });
}

// En dev, Next.js recarga módulos; usamos global para no abrir un pool nuevo cada vez.
const pool = global._mysqlPool ?? createPool();
if (process.env.NODE_ENV !== "production") {
  global._mysqlPool = pool;
}

export default pool;

export class DbError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.status = status;
    this.name = "DbError";
  }
}

/** Traduce errores comunes de MySQL a mensajes entendibles para el usuario. */
export function friendlyDbError(err: unknown): { message: string; status: number } {
  const e = err as { code?: string; sqlMessage?: string };
  if (e?.code === "ER_DUP_ENTRY") {
    return { message: "Ya existe un registro con esos datos únicos (cédula, usuario, código, etc.).", status: 409 };
  }
  if (e?.code === "ER_ROW_IS_REFERENCED_2" || e?.code === "ER_ROW_IS_REFERENCED") {
    return { message: "No se puede eliminar: el registro está siendo usado por otros datos.", status: 409 };
  }
  if (e?.code === "ECONNREFUSED") {
    return { message: "No fue posible conectar a la base de datos. Verifique que MariaDB/MySQL esté corriendo en 127.0.0.1.", status: 503 };
  }
  if (e?.code === "ER_BAD_DB_ERROR") {
    return { message: "La base de datos 'PIGP' no existe. Ejecute el script sql/schema.sql.", status: 503 };
  }
  if (e?.code === "ER_NO_SUCH_TABLE") {
    return { message: "Faltan tablas en la base de datos. Ejecute el script sql/schema.sql.", status: 503 };
  }
  return { message: e?.sqlMessage || "Error interno del servidor.", status: 500 };
}
