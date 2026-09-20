import { createApp } from './app';
import { env } from './config/env';

const app = createApp();
const PORT = process.env.PORT || env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`  WhatsApp Business API + CRM Backend Server`);
  console.log(`  Environment: ${env.NODE_ENV}`);
  console.log(`  Listening on: http://localhost:${PORT}`);
  console.log(`  Health Check: http://localhost:${PORT}/health`);
  console.log(`  Webhook URL:  http://localhost:${PORT}/api/webhooks/whatsapp`);
  console.log(`  Provider:     ${env.WHATSAPP_PROVIDER}`);
  console.log(`====================================================`);
});
