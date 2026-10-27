/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Build "standalone": empaqueta solo lo necesario para correr (sin el
  // resto de node_modules) — lo que usa el Dockerfile para una imagen liviana.
  output: "standalone",
};

export default nextConfig;
