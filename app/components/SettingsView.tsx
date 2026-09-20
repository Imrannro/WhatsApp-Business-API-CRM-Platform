'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Radio,
  Key,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { apiClient } from './apiClient';

export const SettingsView: React.FC = () => {
  const [whatsappStatus, setWhatsappStatus] = useState<any>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSwitching, setIsSwitching] = useState<boolean>(false);

  const loadSettings = async () => {
    try {
      const res = await apiClient.getWhatsAppSettings();
      if (res.whatsapp) setWhatsappStatus(res.whatsapp);
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleToggleProvider = async (provider: 'meta' | 'mock') => {
    setIsSwitching(true);
    try {
      const res = await apiClient.toggleWhatsAppProvider(provider);
      if (res.status) setWhatsappStatus(res.status);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to switch provider');
    } finally {
      setIsSwitching(false);
    }
  };

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(id);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const currentOrigin =
    typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const webhookCallbackUrl = `${currentOrigin}/api/webhooks/whatsapp`;

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Cloud API & Gateway Configuration
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Meta WhatsApp Business Cloud API v21.0 integration parameters and sandbox controls
        </p>
      </div>

      {/* Provider Toggle Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Active WhatsApp Gateway Engine</h3>
            <p className="text-xs text-slate-500">
              Select between live Meta Graph API or local simulated developer sandbox
            </p>
          </div>
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase ${
              whatsappStatus?.isMock
                ? 'bg-amber-100 text-amber-800'
                : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            {whatsappStatus?.isMock ? 'Mock Provider Active' : 'Meta Cloud API Active'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Mock Option */}
          <div
            onClick={() => handleToggleProvider('mock')}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
              whatsappStatus?.isMock
                ? 'border-amber-500 bg-amber-50/50 shadow-xs'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Radio
                  className={`w-4 h-4 ${
                    whatsappStatus?.isMock ? 'text-amber-500' : 'text-slate-400'
                  }`}
                />
                <h4 className="text-sm font-bold text-slate-900">Mock Sandbox Engine</h4>
              </div>
              <span className="text-[10px] bg-slate-100 font-bold px-2 py-0.5 rounded text-slate-700">
                Zero Meta Setup
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Enables local development, automated Vitest suites, and test simulations without
              needing a verified Meta business account or incurring API charges.
            </p>
          </div>

          {/* Meta Cloud Option */}
          <div
            onClick={() => handleToggleProvider('meta')}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
              !whatsappStatus?.isMock
                ? 'border-emerald-500 bg-emerald-50/50 shadow-xs'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Radio
                  className={`w-4 h-4 ${
                    !whatsappStatus?.isMock ? 'text-emerald-500' : 'text-slate-400'
                  }`}
                />
                <h4 className="text-sm font-bold text-slate-900">Meta WhatsApp Cloud API</h4>
              </div>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                Production Ready
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Connects directly to Meta Graph API v21.0 using your System User Access Token, WABA
              ID, and verified business phone number.
            </p>
          </div>
        </div>
      </div>

      {/* Meta Webhook Integration Coordinates */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900">Meta Developer Webhook Setup Guide</h3>
          <p className="text-xs text-slate-500">
            Paste these exact values into your Meta Developer App Dashboard under WhatsApp ➔
            Configuration ➔ Webhooks
          </p>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Callback URL</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={webhookCallbackUrl}
                className="flex-1 p-2 font-mono bg-slate-50 border border-slate-200 rounded-lg text-slate-800 select-all"
              />
              <button
                onClick={() => copyText(webhookCallbackUrl, 'cb_url')}
                className="px-3 py-2 border border-slate-200 rounded-lg hover:bg-slate-100 flex items-center gap-1.5 font-semibold shrink-0"
              >
                {copiedField === 'cb_url' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>Copy URL</span>
              </button>
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Verify Token (hub.verify_token)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={whatsappStatus?.verifyToken || 'whatsapp_webhook_secret_token_123'}
                className="flex-1 p-2 font-mono bg-slate-50 border border-slate-200 rounded-lg text-slate-800 select-all"
              />
              <button
                onClick={() =>
                  copyText(
                    whatsappStatus?.verifyToken || 'whatsapp_webhook_secret_token_123',
                    'v_token'
                  )
                }
                className="px-3 py-2 border border-slate-200 rounded-lg hover:bg-slate-100 flex items-center gap-1.5 font-semibold shrink-0"
              >
                {copiedField === 'v_token' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>Copy Token</span>
              </button>
            </div>
          </div>

          {/* Subscribed Webhook Fields */}
          <div className="pt-2">
            <label className="font-semibold text-slate-700 block mb-2">
              Required Meta Webhook Field Subscriptions
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <div className="font-mono font-bold text-slate-900">messages</div>
                  <div className="text-[11px] text-slate-500">
                    Captures inbound text, quick replies, and delivery receipts
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <div className="font-mono font-bold text-slate-900">
                    message_template_status_update
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Syncs template approval and quality metrics
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
