# Build multi-stage para una imagen liviana de producción (Next.js standalone).
# La configuración (DB, AUTH_SECRET, etc.) NO va aquí: se pasa en tiempo de
# ejecución con --env-file (ver DEPLOY.md, sección Docker).

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Carpeta de fotos subidas (líderes/gestiones): se monta como volumen para
# que las fotos sobrevivan a un rebuild/recreate del contenedor.
RUN mkdir -p ./public/uploads/lideres ./public/uploads/gestiones && chown -R nextjs:nodejs ./public/uploads

USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
