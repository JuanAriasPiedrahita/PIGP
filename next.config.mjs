/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Build "standalone": empaqueta solo lo necesario para correr (sin el
  // resto de node_modules) — lo que usa el Dockerfile para una imagen liviana.
  output: "standalone",
  // Requerido en Next 14.2 para que src/instrumentation.ts (cron de
  // cumpleaños de líderes) se detecte y se empaquete en el build; sin esto
  // el archivo se ignora en silencio, sin error.
  experimental: {
    instrumentationHook: true,
  },
  // instrumentation.ts también se compila para el runtime "edge" (por el
  // middleware), pero su código solo-Node (node-cron, nodemailer, mysql2)
  // nunca corre ahí (está protegido por NEXT_RUNTIME !== "nodejs"). Sin
  // esto, el build de edge falla intentando inlinear sus imports "node:*".
  webpack: (config, { nextRuntime }) => {
    if (nextRuntime === "edge") {
      config.externals = [
        ...(config.externals || []),
        /^node-cron(\/.*)?$/,
        /^nodemailer(\/.*)?$/,
        /^mysql2(\/.*)?$/,
        "fs",
        "fs/promises",
        "path",
      ];
    }
    return config;
  },
};

export default nextConfig;
