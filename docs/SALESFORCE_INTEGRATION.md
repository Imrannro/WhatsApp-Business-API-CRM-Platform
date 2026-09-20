# Salesforce CRM Integration Guide for WhatsApp Business API Platform

## Overview
This platform features an enterprise-grade **Salesforce CRM Integration** providing bidirectional synchronization between WhatsApp customer interactions and Salesforce CRM (Contacts, Leads, Tasks/Activities, and Cases).

---

## Key Features

1. **OAuth 2.0 Web Server Authentication & Direct Session Connect**
   - Standard OAuth 2.0 authorization code flow with automatic refresh token rotation.
   - Direct connection via Salesforce Connected App tokens or Developer Edition instances.
   - Production (`login.salesforce.com`) and Sandbox (`test.salesforce.com`) environment support.

2. **Bidirectional Contacts & Leads Synchronization**
   - **Inbound (Salesforce → WhatsApp CRM)**:
     - Downloads Contacts & Leads from Salesforce using SOQL query engine.
     - Smart deduplication and record matching by phone number (E.164 normalization) and email address.
   - **Outbound (WhatsApp CRM → Salesforce)**:
     - Automatically creates new Salesforce Contact or Lead records when a customer texts in via WhatsApp.
     - Updates existing Salesforce records with tags, notes, and profile details.

3. **Message & Conversation Logging to Salesforce**
   - **WhatsApp Messages → Salesforce Tasks/Activities**: Every inbound customer message and outbound agent reply is recorded as a completed Activity Task under the matched Contact or Lead (`WhoId`).
   - **WhatsApp Conversations → Salesforce Cases**: Entire support tickets can be logged as Salesforce Cases (`Case` SObject) with conversation transcripts and agent assignments.

4. **Dynamic Field Mapping Manager**
   - Configurable field mapping between local CRM database fields and Salesforce SObject fields (standard & custom fields ending in `__c`).
   - Granular direction control: `BIDIRECTIONAL`, `INBOUND`, or `OUTBOUND`.

5. **Inbound Salesforce Webhook & Change Data Capture (CDC)**
   - Real-time event listener endpoint (`/api/salesforce/webhook`) for Apex Callouts, Salesforce Flow HTTP Callouts, and Workflow Outbound Messages.

6. **Audit Trail & Error Logs**
   - Granular sync logs capturing timestamp, direction, entity type, records processed, records synced, failure reasons, and millisecond execution timings.

---

## Salesforce Connected App Configuration Step-by-Step

### 1. Create a Connected App in Salesforce
1. In Salesforce Setup, navigate to **Apps** → **App Manager**.
2. Click **New Connected App** (top right).
3. Fill in basic information:
   - **Connected App Name**: `WhatsApp Business CRM Gateway`
   - **API Name**: `WhatsApp_Business_CRM_Gateway`
   - **Contact Email**: `admin@yourdomain.com`
4. Enable OAuth Settings:
   - Check **Enable OAuth Settings**.
   - Set **Callback URL**: `https://your-domain.com/api/salesforce/oauth/callback` (or `http://localhost:3000/api/salesforce/oauth/callback` for local development).
   - Add Selected OAuth Scopes:
     - `Access and manage your data (api)`
     - `Perform requests on your behalf at any time (refresh_token, offline_access)`
     - `Provide access to custom applications (visualforce)`
     - `Access unique user identifiers (openid)`
5. Save the Connected App.
6. Note down the **Consumer Key** (`SALESFORCE_CLIENT_ID`) and **Consumer Secret** (`SALESFORCE_CLIENT_SECRET`).

---

## Environment Variables Configuration

Add the following to your `.env` file:

```env
# Salesforce Integration
SALESFORCE_ENVIRONMENT="production" # "production" or "sandbox"
SALESFORCE_CLIENT_ID="3MVG9...your_consumer_key"
SALESFORCE_CLIENT_SECRET="your_consumer_secret"
SALESFORCE_REDIRECT_URI="http://localhost:3000/api/salesforce/oauth/callback"
SALESFORCE_INSTANCE_URL="https://yourdomain.my.salesforce.com"
SALESFORCE_AUTO_SYNC_MESSAGES="true"
SALESFORCE_AUTO_SYNC_CONTACTS="true"
SALESFORCE_TARGET_OBJECT="Contact" # "Contact", "Lead", or "Both"
SALESFORCE_WEBHOOK_SECRET="optional_webhook_signing_secret"
```

---

## API Endpoints

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/salesforce/status` | Get Salesforce connection status & telemetry | Yes |
| `GET` | `/api/salesforce/auth-url` | Generate OAuth 2.0 authorization URL | Yes |
| `POST` | `/api/salesforce/oauth/callback` | Exchange OAuth code for tokens | No / Public |
| `POST` | `/api/salesforce/connect-direct` | Connect using direct token or credentials | Admin |
| `POST` | `/api/salesforce/disconnect` | Disconnect Salesforce integration | Admin |
| `PATCH` | `/api/salesforce/settings` | Update auto-sync & target object settings | Admin |
| `POST` | `/api/salesforce/sync` | Trigger on-demand sync (`CONTACT`, `LEAD`, `ALL`) | Yes |
| `POST` | `/api/salesforce/contacts/:id/sync` | Sync single Contact to Salesforce | Yes |
| `POST` | `/api/salesforce/messages/:id/sync` | Log single WhatsApp message as SF Task | Yes |
| `POST` | `/api/salesforce/conversations/:id/sync` | Sync WhatsApp conversation as SF Case | Yes |
| `GET` | `/api/salesforce/logs` | Fetch sync audit trail logs | Yes |
| `DELETE` | `/api/salesforce/logs` | Clear sync audit logs | Admin |
| `GET` | `/api/salesforce/mappings` | List active field mappings | Yes |
| `POST` | `/api/salesforce/mappings` | Create custom field mapping | Admin |
| `PATCH` | `/api/salesforce/mappings/:id` | Update field mapping | Admin |
| `DELETE` | `/api/salesforce/mappings/:id` | Delete field mapping | Admin |
| `POST` | `/api/salesforce/mappings/reset` | Reset field mappings to default | Admin |
| `GET` | `/api/salesforce/describe/:sobject` | Inspect Salesforce schema fields | Yes |
| `POST` | `/api/salesforce/webhook` | Inbound webhook for Salesforce CDC events | Webhook Token |

---

## Automated Test Execution

Run the complete test suite:
```bash
npm run test
# or
npx vitest run
```
