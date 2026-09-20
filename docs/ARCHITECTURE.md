# Architecture & System Design
## WhatsApp Business Cloud API + Helpdesk CRM Platform

### 1. High-Level Architecture Overview

```
                          ┌────────────────────────┐
                          │   Meta Graph API v21   │
                          │ WhatsApp Cloud Service │
                          └───────────┬────────────┘
                                      │ Inbound Webhook (HTTPS POST)
                                      │ + HMAC SHA-256 Signature
                                      ▼
┌──────────────────┐       ┌────────────────────────┐       ┌──────────────────┐
│   Agent / Admin  │       │     Express / Next     │       │    PostgreSQL    │
│  React Dashboard │◄─────►│   Backend Controller   │◄─────►│    Prisma ORM    │
│  (Vite/Tailwind) │ HTTP  │   & Webhook Processor  │       │  Persistent DB   │
└──────────────────┘       └───────────┬────────────┘       └──────────────────┘
                                       │ Outbound HTTPS POST
                                       ▼
                          ┌────────────────────────┐
                          │  Meta Cloud API or     │
                          │  MockWhatsAppProvider  │
                          └────────────────────────┘
```

### 2. Core Architectural Pillars

1. **Decoupled Messaging Engine (`WhatsAppProvider` Interface):**
   - The application does not hardcode Graph API HTTP requests directly into business controllers.
   - All WhatsApp operations are encapsulated by the `WhatsAppProvider` contract:
     - `sendTextMessage(params)`
     - `sendTemplateMessage(params)`
     - `verifyWebhook(query)`
     - `validateSignature(rawBody, signature)`
     - `getStatus()`
   - Dynamic provider resolution allows seamless switching between **MetaWhatsAppProvider** (real Cloud API) and **MockWhatsAppProvider** (local development and automated testing without credentials).

2. **Zero Direct Browser Calls to Meta:**
   - Client applications never store or transmit `META_ACCESS_TOKEN`.
   - All outbound messages pass through authenticated backend routes (`/api/conversations/:id/messages`) that enforce user authorization, sanitize inputs with Zod, and log full audit trails.

3. **Webhook Verification & Idempotency:**
   - **Handshake:** Meta sends a `GET` request containing `hub.mode`, `hub.verify_token`, and `hub.challenge`. The backend validates the token and returns the challenge string with HTTP 200.
   - **Signature Verification:** Incoming payloads check the `X-Hub-Signature-256` header against `HMAC-SHA256(rawBody, appSecret)`.
   - **Idempotency Guard:** Every WhatsApp message ID (`wamid`) is recorded in the `WebhookEvent` table. If Meta retransmits an event due to network delay, the system detects the duplicate and ignores it gracefully with HTTP 200.

4. **Multi-Role RBAC (Role-Based Access Control):**
   - **ADMIN:** Complete control over CRM contacts, ticket routing, conversation assignment, agent user provisioning, system settings, audit logs, and WhatsApp provider switching.
   - **AGENT:** Focused workspace: triage assigned tickets, send outbound WhatsApp messages, write internal notes, update ticket resolution status, view customer CRM history.

5. **Stateful CRM Synchronisation:**
   - Incoming messages from new phone numbers automatically provision a CRM `Contact` and open a `Conversation`.
   - When agents reply, the message is stored with an initial `SENT` status, which is subsequently updated to `DELIVERED` and `READ` upon delivery receipt webhooks.
