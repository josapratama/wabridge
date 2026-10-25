# Multi-stage Dockerfile for WhatsApp Dashboard (React + Vite + Nginx)
FROM oven/bun:1.3-alpine AS builder
WORKDIR /app

# Copy dependency specifications
COPY package.json bun.lock* ./

# Install dependencies
RUN bun install

# Copy source code and build production assets
COPY . .
RUN bun run build

# Runner stage with lightweight Nginx
FROM nginx:alpine AS runner

# Copy custom Nginx SPA configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static files
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
