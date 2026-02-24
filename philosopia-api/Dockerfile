# ---- Stage 1: Install dependencies ----
FROM node:22-alpine AS deps

WORKDIR /app

# Copy only package files first (leverages Docker layer caching —
# dependencies are only re-installed when package.json/lock changes)
COPY package.json package-lock.json* ./

RUN npm ci --omit=dev

# ---- Stage 2: Production image ----
FROM node:22-alpine

# Security: run as non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy installed production dependencies from stage 1
COPY --from=deps /app/node_modules ./node_modules

# Copy application source code
COPY . .

# Switch to non-root user
USER appuser

# Default port (can be overridden via environment variable)
EXPOSE 5000

CMD ["node", "server.js"]
