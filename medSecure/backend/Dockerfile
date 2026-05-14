# =============================================================================
# MedSecure - Backend Dockerfile
# Capa 10: Hardening - Imagen slim, usuario no-root, multi-stage build
# =============================================================================
# Mitiga: Ejecución como root, superficie de ataque del contenedor
# Artículo HIPAA: 164.312(a)(1) - Procesos y procedimientos de seguridad
# =============================================================================

# ---- Stage 1: Dependencias ----
FROM node:20-alpine AS deps
LABEL stage=builder

RUN apk add --no-cache libc6-compat python3 make g++

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ---- Stage 2: Build / Development ----
FROM node:20-alpine AS development
WORKDIR /app

# Capa 10: Crear usuario no-root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --ingroup nodejs medsecure

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN mkdir -p /app/logs && chown -R medsecure:nodejs /app/logs

# Cambiar a usuario no-root
USER medsecure

EXPOSE 4000

CMD ["node", "src/server.js"]

# ---- Stage 3: Producción optimizada ----
FROM node:20-alpine AS production
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --ingroup nodejs medsecure

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN mkdir -p /app/logs && chown -R medsecure:nodejs /app/logs

USER medsecure

EXPOSE 4000

CMD ["node", "src/server.js"]
