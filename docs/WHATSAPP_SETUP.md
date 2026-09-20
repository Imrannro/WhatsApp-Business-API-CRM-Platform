# Meta WhatsApp Business Cloud API Configuration Guide

This step-by-step guide explains how to connect this application to the official Meta WhatsApp Business Cloud API for production or staging environments.

---

### Step 1: Create a Meta Developer App
1. Go to [developers.facebook.com](https://developers.facebook.com) and log in with your Facebook account.
2. Click **My Apps** > **Create App**.
3. Select **Other** as the use case, then choose **Business** as the app type.
4. Name your application (e.g., `Enterprise WhatsApp CRM`) and link it to your Meta Business Account.

---

### Step 2: Add WhatsApp Product
1. On the App Dashboard, locate **WhatsApp** and click **Set up**.
2. Meta provides a test sandbox with a temporary access token and a test phone number.
3. Note down the following values:
   - **Phone Number ID** (e.g., `104857294829102`)
   - **WhatsApp Business Account ID (WABA ID)** (e.g., `109283746152431`)
   - **Temporary Access Token** (valid for 24 hours, or create a Permanent System User Token below).

---

### Step 3: Generate a Permanent System User Access Token
1. Go to **Meta Business Settings** (`business.facebook.com/settings`).
2. Under **Users**, select **System Users**.
3. Click **Add**, name the system user `whatsapp-crm-service`, and select the **Admin** role.
4. Click **Generate New Token**, select your WhatsApp App, and grant the following permissions:
   - `whatsapp_business_messaging`
   - `whatsapp_business_management`
5. Copy the generated permanent token and paste it into `META_ACCESS_TOKEN`.

---

### Step 4: Configure Webhooks in Meta App Dashboard
1. In the WhatsApp section on the left sidebar, click **Configuration**.
2. In the **Webhook** card, click **Edit**.
3. Set the **Callback URL** to your server's public endpoint:
   ```
   https://<your-domain>/api/webhooks/whatsapp
   ```
   *(For local development, use an ngrok or Cloudflare tunnel, e.g., `https://xyz.ngrok-free.app/api/webhooks/whatsapp`)*.
4. Set the **Verify Token** to the string defined in your `META_VERIFY_TOKEN` (default: `whatsapp_webhook_secret_token_123`).
5. Click **Verify and Save**. Meta will send a `GET` request to your callback URL with the challenge code.
6. Under **Webhook Fields**, click **Manage** and subscribe to:
   - `messages` (inbound text, media, location, interactive buttons)
   - `message_template_status_update` (optional)

---

### Step 5: Configure App Environment Variables
Populate your `.env` file with your Meta credentials:

```env
WHATSAPP_PROVIDER=meta
META_ACCESS_TOKEN=EAAG...your_system_user_token
META_PHONE_NUMBER_ID=104857294829102
META_BUSINESS_ACCOUNT_ID=109283746152431
META_APP_SECRET=your_app_secret_from_app_basic_settings
META_VERIFY_TOKEN=whatsapp_webhook_secret_token_123
META_API_VERSION=v21.0
```

Restart your application. The status indicator in the top navbar and settings page will reflect `Meta Cloud API (Connected)`.
