# ─── Stage 1: Builder ────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (layer cache)
COPY package*.json ./
RUN npm ci --ignore-scripts

# Copy source and compile
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ─── Stage 2: Production ─────────────────────────────────────────────────────
FROM node:20-alpine AS production

# Security: run as non-root
RUN addgroup -g 1001 -S nodejs && adduser -S pawspace -u 1001

WORKDIR /app

# Copy only what's needed
COPY --from=builder --chown=pawspace:nodejs /app/dist ./dist
COPY --from=builder --chown=pawspace:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=pawspace:nodejs /app/package.json ./

# Switch to non-root user
USER pawspace

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "dist/server.js"]
