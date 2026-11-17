# Production Dockerfile for WhatsApp Integration API (Bun + NestJS)
FROM oven/bun:1.3-alpine AS builder

# Install git for Baileys git dependencies (libsignal-node)
RUN apk add --no-cache git openssh-client

WORKDIR /app

# Copy dependency specifications
COPY package.json bun.lock* ./

# Install all dependencies with Bun
RUN bun install

# Copy source code and config files
COPY . .

# Build application with tsconfig.build.json
RUN bun run build

# Verify build output
RUN test -f dist/main.js || (echo "Build failed: dist/main.js not found" && exit 1)

# Production runner image
FROM oven/bun:1.3-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy package and pre-built node_modules from builder
COPY package.json bun.lock* ./
COPY --from=builder /app/node_modules ./node_modules

# Copy compiled application & assets
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/common/database ./src/common/database
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /app/public ./public
COPY --from=builder /app/views ./views

# Create auth directory for Baileys session persistence
RUN mkdir -p /app/baileys_auth_data

# Expose API port
EXPOSE 3000

# Auto-push database schema and start application with Bun
CMD ["sh", "-c", "bun run db:push && bun dist/main.js"]
