# Multi-stage Dockerfile for WhatsApp Dashboard (React + Vite + Nginx)
FROM oven/bun:1.3-alpine AS builder
WORKDIR /app

ARG VITE_API_URL=https://wabridge-backend.josapratama.com
ENV VITE_API_URL=$VITE_API_URL

# Copy dependency specifications for frontend
WORKDIR /app/apps/frontend
COPY apps/frontend/package.json apps/frontend/bun.lock* ./
RUN bun install

# Copy frontend source and build
COPY apps/frontend/ .
RUN bun run build

# Runner stage with lightweight Nginx
FROM nginx:alpine AS runner

# Copy custom Nginx SPA configuration
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static files
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
