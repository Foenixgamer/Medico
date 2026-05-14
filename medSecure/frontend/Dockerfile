# =============================================================================
# MedSecure - Frontend Dockerfile
# Capa 10: Hardening - Imagen slim, usuario no-root
# =============================================================================

FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

FROM node:20-alpine AS development
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --ingroup nodejs medsecure
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN chown -R medsecure:nodejs /app
USER medsecure
EXPOSE 5173
CMD ["npm", "run", "dev"]

FROM node:20-alpine AS production
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --ingroup nodejs medsecure
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN chown -R medsecure:nodejs /app && npm run build
USER medsecure
EXPOSE 3000
CMD ["npm", "run", "preview"]
