import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'WhatsApp Business API & CRM Platform',
  description: 'Production-ready WhatsApp Business Cloud API integration and Helpdesk CRM with automated webhook processing, agent inbox, and full DevOps pipeline.',
  openGraph: {
    title: 'WhatsApp Business API & CRM Platform',
    description: 'Production-ready WhatsApp Business Cloud API integration and Helpdesk CRM with automated webhook processing, agent inbox, and full DevOps pipeline.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WhatsApp Business API & CRM Platform',
    description: 'Production-ready WhatsApp Business Cloud API integration and Helpdesk CRM with automated webhook processing, agent inbox, and full DevOps pipeline.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
