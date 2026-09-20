# WhatsApp Business Cloud API + Helpdesk CRM Platform

A production-grade, enterprise-ready WhatsApp Business Cloud API integration and omnichannel CRM Helpdesk application built from scratch with **React, Vite, Next.js, Node.js, Express, TypeScript, PostgreSQL, Prisma, and Tailwind CSS**.

---

## Key Features

- **Direct Meta WhatsApp Cloud API v21.0 Integration**: Outbound text and template messaging with Graph API, status tracking, and error handling.
- **Provider Abstraction Architecture (`WhatsAppProvider`)**: Dynamic switching between official `MetaWhatsAppProvider` and `MockWhatsAppProvider` for testing without credentials.
- **Bi-Directional Webhooks**: Secure Meta webhook challenge verification (`hub.challenge`), HMAC SHA-256 signature verification, and idempotency deduplication.
- **Omnichannel CRM & Helpdesk**:
  - 3-Panel Agent Workspace: Conversation list, real-time message stream with status receipts (`SENT`, `DELIVERED`, `READ`), and contact CRM drawer.
  - Ticket triage: Status lifecycle (`OPEN`, `PENDING`, `RESOLVED`, `CLOSED`), priority tagging, and agent reassignment.
  - Team Collaboration: Internal support notes visible only to agents.
- **Analytics & SLA Dashboard**: Real-time stats, inbound vs. outbound volume trends, status breakdown, and audit activity feeds.
- **Built-in WhatsApp Simulator**: Test incoming WhatsApp messages and status updates directly in the UI.
- **Security & RBAC**: JWT authentication, bcrypt password hashing, role enforcement (`ADMIN` vs `AGENT`), Helmet headers, and CORS protection.
- **DevOps & Testing**: Complete Docker Compose setup (Postgres + Backend + Frontend), GitHub Actions CI pipeline, and 24 Vitest integration tests.

---

## Monorepo Project Structure

```
├── app/                        # Next.js App Router (Live Preview & Unified Server)
│   ├── api/                    # Server-side API endpoints matching backend routes
│   │   ├── auth/               # Login, Register, Current User
│   │   ├── contacts/           # CRM Contact CRUD
│   │   ├── conversations/      # Inbox, Messages, Notes, Assignment
│   │   ├── webhooks/           # Meta Webhook Handshake & Simulator
│   │   ├── dashboard/          # Analytics & Audit Logs
│   │   └── users/              # Admin Agent Management & Settings
│   ├── layout.tsx              # Root Layout with Font & Meta Tags
│   └── page.tsx                # Production CRM & Helpdesk UI
├── backend/                    # Node.js + Express Backend
│   ├── src/
│   │   ├── config/             # Environment validation with Zod
│   │   ├── controllers/        # Auth, Contact, Conversation, Webhook, User
│   │   ├── middleware/         # Auth, RBAC, Validation, Error Handling
│   │   ├── routes/             # Express API routes
│   │   ├── app.ts              # Express App definition
│   │   └── index.ts            # Server entry point
│   └── tests/                  # Vitest + Supertest integration suite (24 tests)
├── database/                   # PostgreSQL Schema & Migrations
│   └── prisma/
│       ├── schema.prisma       # Relational Schema
│       ├── migrations/         # SQL migration scripts
│       └── seed.ts             # Initial seed data
├── docker/                     # Multi-stage Dockerfiles
│   ├── Dockerfile.backend      # Alpine Node.js runner
│   └── Dockerfile.frontend     # Nginx SPA web server
├── docs/                       # Project Documentation
│   ├── ARCHITECTURE.md         # Architecture diagrams & component flows
│   ├── API.md                  # REST API & OpenAPI specification
│   ├── WHATSAPP_SETUP.md       # Meta Developer & Cloud API setup guide
│   └── CASE_STUDY.md           # Engineering case study showcase
├── frontend/                   # React + Vite + Tailwind Client Application
├── lib/                        # Shared Domain Libraries
│   ├── auth/                   # JWT & Bcrypt password helpers
│   ├── db/                     # Data types & in-memory store repository
│   ├── validation/             # Zod validation schemas
│   ├── webhook/                # Webhook signature & idempotency processor
│   └── whatsapp/               # Provider interface, Meta & Mock providers
└── docker-compose.yml          # Container orchestration (Postgres, Backend, Frontend)
```

---

## Quick Start Guide

### 1. Run Automated Test Suite
```bash
npx vitest run
```
*All 24 unit and integration tests will execute against Auth, CRM Contacts, Conversations, Webhook Ingestion, and WhatsApp Provider logic.*

### 2. Local Development with Docker Compose
```bash
docker-compose up --build
```
This boots:
- **PostgreSQL** on `localhost:5432`
- **Backend API** on `localhost:3000`
- **Frontend App** on `localhost:80`

### 3. Running Without Docker
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## Seed Accounts (Quick Demo Access)

| Role | Name | Email | Password |
| :--- | :--- | :--- | :--- |
| **Admin** | Alexander Wright | `admin@enterprise-whatsapp.io` | `AdminPassword123!` |
| **Agent** | Sarah Connor | `agent.sarah@enterprise-whatsapp.io` | `AgentPassword123!` |
| **Agent** | Marcus Vance | `agent.marcus@enterprise-whatsapp.io` | `AgentPassword123!` |

*(One-click demo sign-in buttons are also provided on the login screen).*
