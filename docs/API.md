# WhatsApp Business CRM — API Reference & OpenAPI Spec

All endpoints are prefixed with `/api`. Protected routes require a Bearer token in the `Authorization` header: `Authorization: Bearer <jwt_token>` or via the `token` HTTP cookie.

---

### Authentication

#### `POST /api/auth/login`
- **Description:** Authenticates user and returns JWT token.
- **Request Body:**
  ```json
  {
    "email": "admin@enterprise-whatsapp.io",
    "password": "AdminPassword123!"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Logged in successfully",
    "data": {
      "user": {
        "id": "usr-001",
        "email": "admin@enterprise-whatsapp.io",
        "name": "Alexander Wright",
        "role": "ADMIN",
        "status": "ACTIVE"
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
    }
  }
  ```

#### `POST /api/auth/register`
- **Description:** Creates a new agent account.
- **Request Body:** `name`, `email`, `password`, `role` (ADMIN | AGENT).

#### `GET /api/auth/me`
- **Description:** Returns profile of the authenticated user.

---

### Conversations & Messaging

#### `GET /api/conversations`
- **Query Params:** `status` (OPEN | PENDING | RESOLVED | CLOSED), `assignedAgentId`, `unreadOnly`, `search`, `all` (boolean).
- **Response (200 OK):** List of conversations with nested contact profile, latest message, and unread count.

#### `GET /api/conversations/:id`
- **Description:** Returns conversation details, full message history, and internal notes.
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "conversation": { "id": "conv-001", "status": "OPEN", "priority": "HIGH" },
      "messages": [
        {
          "id": "msg-001",
          "direction": "INBOUND",
          "body": "Hello, I need an update on my enterprise invoice.",
          "status": "READ",
          "createdAt": "2026-09-19T10:30:00.000Z"
        }
      ],
      "internalNotes": [
        {
          "id": "note-001",
          "content": "Customer is on SLA tier 1.",
          "author": { "name": "Alexander Wright" }
        }
      ]
    }
  }
  ```

#### `POST /api/conversations/:id/messages`
- **Description:** Dispatches an outbound WhatsApp text or template message via the active WhatsApp provider.
- **Request Body:**
  ```json
  {
    "body": "Your invoice has been updated and sent to your email.",
    "type": "TEXT"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "id": "msg-003",
      "conversationId": "conv-001",
      "whatsappMessageId": "wamid.mock.1726779000",
      "direction": "OUTBOUND",
      "status": "SENT",
      "body": "Your invoice has been updated and sent to your email."
    },
    "provider": {
      "name": "Mock WhatsApp Sandbox Provider",
      "isMock": true
    }
  }
  ```

#### `POST /api/conversations/:id/assign` *(Admin only)*
- **Description:** Assigns or transfers conversation to an agent.
- **Request Body:** `{ "agentId": "usr-002" }`

#### `POST /api/conversations/:id/notes`
- **Description:** Attaches an internal collaboration note visible only to support staff.
- **Request Body:** `{ "content": "Customer contacted billing department." }`

---

### Contacts CRM

#### `GET /api/contacts`
- **Query Params:** `search` (name or phone), `tag`.

#### `POST /api/contacts`
- **Request Body:** `name`, `phoneNumber` (E.164 format), `email`, `company`, `tags`, `notes`.

#### `PATCH /api/contacts/:id`
- **Request Body:** Partial update fields (`name`, `company`, `tags`, `notes`).

#### `DELETE /api/contacts/:id`
- **Description:** Removes contact and associated data.

---

### Webhooks

#### `GET /api/webhooks/whatsapp`
- **Description:** Meta Webhook Challenge verification.
- **Query Params:** `hub.mode`, `hub.verify_token`, `hub.challenge`.
- **Response:** Plain-text challenge string when token matches.

#### `POST /api/webhooks/whatsapp`
- **Description:** Ingestion endpoint for Meta Cloud API webhook dispatches.
- **Headers:** `X-Hub-Signature-256` (HMAC SHA-256 signature).
- **Processing:** Validates signature, verifies idempotency, creates/updates contacts, messages, and delivery receipts.

#### `POST /api/webhooks/whatsapp/simulate`
- **Description:** Test simulator for development and preview environments.
- **Simulates:** Inbound messages or delivery receipts without needing live Meta credentials.
