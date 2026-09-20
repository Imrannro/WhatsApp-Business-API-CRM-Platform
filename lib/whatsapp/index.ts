import { WhatsAppProvider } from './provider.interface';
import { MetaWhatsAppProvider } from './meta.provider';
import { MockWhatsAppProvider } from './mock.provider';

let activeProviderOverride: WhatsAppProvider | null = null;

export function getWhatsAppProvider(): WhatsAppProvider {
  if (activeProviderOverride) {
    return activeProviderOverride;
  }

  const explicitMode = process.env.WHATSAPP_PROVIDER?.toLowerCase();
  const hasMetaCreds = Boolean(
    process.env.META_ACCESS_TOKEN && process.env.META_PHONE_NUMBER_ID
  );

  if (explicitMode === 'meta' && hasMetaCreds) {
    return new MetaWhatsAppProvider();
  }

  if (explicitMode === 'mock') {
    return new MockWhatsAppProvider();
  }

  // Default: if credentials exist, use Meta; otherwise use Mock
  return hasMetaCreds ? new MetaWhatsAppProvider() : new MockWhatsAppProvider();
}

export function setWhatsAppProviderOverride(provider: 'meta' | 'mock'): WhatsAppProvider {
  if (provider === 'meta') {
    activeProviderOverride = new MetaWhatsAppProvider();
  } else {
    activeProviderOverride = new MockWhatsAppProvider();
  }
  return activeProviderOverride;
}

export * from './provider.interface';
export * from './meta.provider';
export * from './mock.provider';
export * from './types';
