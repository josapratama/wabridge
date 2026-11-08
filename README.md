# 💬 WABridge — WhatsApp Multi-Device Integration Suite (Monorepo)

A self-hosted, multi-device WhatsApp API Gateway and Management Dashboard built with **Bun**, **NestJS + Baileys**, **Drizzle/PostgreSQL**, and **Vite + React/Tailwind**.

---

## 🏗️ Monorepo Architecture

```
wabridge/
├── apps/
│   ├── backend/              # NestJS + Baileys + Drizzle ORM API Gateway
│   └── frontend/             # Vite + React + Tailwind WhatsApp Dashboard
├── docker-compose.yml        # Multi-service stack (Postgres + Backend + Frontend)
└── package.json              # Bun Workspace orchestration
```

### Features
- **Official & Multi-Device Baileys Engine**: QR Code scan pairing, session auto-reconnect, and message queueing.
- **REST API Endpoints**: Send text, images, documents, templates, and buttons.
- **Webhook Inbound Listener**: Inbound message listener with auto-dispatching to external services.
- **Web Dashboard**: Device management, live QR login, message history, broadcast campaigns, and contact sync.

---

## 🚀 Quick Start

### Run with Docker Compose
```bash
docker compose up -d --build
```
- **Web Dashboard**: `http://localhost:5173`
- **REST API & Swagger**: `http://localhost:3000`

### Run with Bun
```bash
# Install dependencies
bun install

# Run both backend & frontend concurrently
bun run dev
```

---

## 📄 License
MIT
