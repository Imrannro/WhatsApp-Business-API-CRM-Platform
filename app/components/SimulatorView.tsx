'use client';

import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Sparkles,
  Send,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Terminal,
  RefreshCw,
  Copy,
  Check,
} from 'lucide-react';
import { apiClient } from './apiClient';

interface SimulatorViewProps {
  onEventProcessed?: () => void;
}

export const SimulatorView: React.FC<SimulatorViewProps> = ({ onEventProcessed }) => {
  // Handshake test state
  const [verifyTokenInput, setVerifyTokenInput] = useState<string>(
    'whatsapp_webhook_secret_token_123'
  );
  const [verifyResult, setVerifyResult] = useState<any | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  // Inbound message simulator state
  const [simName, setSimName] = useState<string>('Carlos Mendez');
  const [simPhone, setSimPhone] = useState<string>('+15558889900');
  const [simText, setSimText] = useState<string>(
    'Hello, I would like to check the shipping status of my order #ORD-4492.'
  );
  const [isSimulatingMessage, setIsSimulatingMessage] = useState<boolean>(false);
  const [simMessageResult, setSimMessageResult] = useState<any | null>(null);

  // Status update simulator state
  const [targetWamid, setTargetWamid] = useState<string>('');
  const [targetStatus, setTargetStatus] = useState<string>('READ');
  const [isSimulatingStatus, setIsSimulatingStatus] = useState<boolean>(false);
  const [simStatusResult, setSimStatusResult] = useState<any | null>(null);

  // Webhook events log
  const [events, setEvents] = useState<any[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadEvents = async () => {
    try {
      const res = await apiClient.getWebhookEvents();
      if (res.data) setEvents(res.data);
    } catch (err) {
      console.error('Failed to load webhook events:', err);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  // Run Meta Webhook Verification Handshake
  const handleVerifyHandshake = async () => {
    setIsVerifying(true);
    setVerifyResult(null);
    try {
      const res = await apiClient.verifyWebhook(verifyTokenInput);
      setVerifyResult(res);
    } catch (err: unknown) {
      setVerifyResult({ status: 500, ok: false, body: String(err) });
    } finally {
      setIsVerifying(false);
    }
  };

  // Run Inbound Message Simulation
  const handleSimulateInboundMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSimulatingMessage(true);
    setSimMessageResult(null);
    try {
      const res = await apiClient.simulateWebhook({
        phoneNumber: simPhone,
        name: simName,
        text: simText,
      });
      setSimMessageResult(res);
      if (res.wamid) setTargetWamid(res.wamid);
      loadEvents();
      if (onEventProcessed) onEventProcessed();
    } catch (err: unknown) {
      setSimMessageResult({ success: false, error: String(err) });
    } finally {
      setIsSimulatingMessage(false);
    }
  };

  // Run Status Receipt Simulation
  const handleSimulateStatusReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetWamid) {
      alert('Please specify a valid message wamid');
      return;
    }
    setIsSimulatingStatus(true);
    setSimStatusResult(null);
    try {
      const res = await apiClient.simulateWebhook({
        type: 'STATUS_UPDATE',
        messageId: targetWamid,
        status: targetStatus,
      });
      setSimStatusResult(res);
      loadEvents();
      if (onEventProcessed) onEventProcessed();
    } catch (err: unknown) {
      setSimStatusResult({ success: false, error: String(err) });
    } finally {
      setIsSimulatingStatus(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
            <Cpu className="w-5 h-5" />
          </span>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            WhatsApp Gateway & Webhook Simulator
          </h1>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Simulate real-world Meta WhatsApp Cloud API webhooks, verify handshakes, and test
          idempotent event pipelines
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Card 1: Handshake Verification (GET) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                1. Meta Webhook Verification Handshake
              </h3>
              <p className="text-xs text-slate-500">
                Tests GET /api/webhooks/whatsapp verification with hub.verify_token
              </p>
            </div>
            <span className="text-[10px] bg-slate-100 text-slate-700 font-mono font-bold px-2 py-0.5 rounded">
              GET Handshake
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Verify Token (hub.verify_token)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={verifyTokenInput}
                  onChange={(e) => setVerifyTokenInput(e.target.value)}
                  className="flex-1 p-2 font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  onClick={handleVerifyHandshake}
                  disabled={isVerifying}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shrink-0 transition-colors"
                >
                  {isVerifying ? 'Verifying...' : 'Test Verification'}
                </button>
              </div>
            </div>

            {verifyResult && (
              <div
                className={`p-3 rounded-lg border text-xs font-mono ${
                  verifyResult.ok
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-red-50 border-red-200 text-red-900'
                }`}
              >
                <div className="flex items-center gap-2 font-bold mb-1">
                  {verifyResult.ok ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600" />
                  )}
                  <span>
                    HTTP {verifyResult.status} — {verifyResult.ok ? 'Verified' : 'Rejected'}
                  </span>
                </div>
                <div className="text-[11px]">
                  Response body returned to Meta: <strong>{verifyResult.body}</strong>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Test Card 2: Status Receipt Simulator */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                2. WhatsApp Delivery Status Telemetry
              </h3>
              <p className="text-xs text-slate-500">
                Simulates asynchronous status callbacks (SENT ➔ DELIVERED ➔ READ)
              </p>
            </div>
            <span className="text-[10px] bg-slate-100 text-slate-700 font-mono font-bold px-2 py-0.5 rounded">
              Delivery Receipt
            </span>
          </div>

          <form onSubmit={handleSimulateStatusReceipt} className="space-y-3 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Target WhatsApp Message ID (wamid)
              </label>
              <input
                type="text"
                required
                placeholder="e.g. wamid.sim.172677900..."
                value={targetWamid}
                onChange={(e) => setTargetWamid(e.target.value)}
                className="w-full p-2 font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={targetStatus}
                onChange={(e) => setTargetStatus(e.target.value)}
                className="p-2 border border-slate-200 rounded-lg font-semibold text-slate-800 focus:outline-none"
              >
                <option value="DELIVERED">Status: DELIVERED</option>
                <option value="READ">Status: READ</option>
                <option value="FAILED">Status: FAILED</option>
              </select>

              <button
                type="submit"
                disabled={isSimulatingStatus}
                className="flex-1 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors"
              >
                {isSimulatingStatus ? 'Applying...' : 'Apply Status Update'}
              </button>
            </div>

            {simStatusResult && (
              <div className="p-3 bg-slate-100 rounded-lg text-[11px] font-mono text-slate-700">
                {JSON.stringify(simStatusResult)}
              </div>
            )}
          </form>
        </div>

        {/* Test Card 3: Inbound Message Simulation (Full Meta Webhook Payload) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                3. Dispatch Simulated Customer Inbound WhatsApp Message
              </h3>
              <p className="text-xs text-slate-500">
                Constructs official Meta Graph API v21.0 payload, passes through webhook signature
                verification and idempotency pipeline
              </p>
            </div>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-mono font-bold px-2 py-0.5 rounded">
              Inbound POST Webhook
            </span>
          </div>

          <form onSubmit={handleSimulateInboundMessage} className="space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Customer Name</label>
                <input
                  type="text"
                  required
                  value={simName}
                  onChange={(e) => setSimName(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Customer WhatsApp Phone Number
                </label>
                <input
                  type="text"
                  required
                  value={simPhone}
                  onChange={(e) => setSimPhone(e.target.value)}
                  className="w-full p-2 font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                WhatsApp Message Text
              </label>
              <textarea
                rows={2}
                required
                value={simText}
                onChange={(e) => setSimText(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="text-[11px] text-slate-400">
                Will auto-provision contact profile and open conversation ticket in Inbox
              </div>
              <button
                type="submit"
                disabled={isSimulatingMessage}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-xs transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  {isSimulatingMessage ? 'Dispatching Webhook...' : 'Dispatch Inbound Message'}
                </span>
              </button>
            </div>

            {simMessageResult && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] font-mono text-emerald-900 space-y-1">
                <div className="font-bold flex items-center gap-1 text-emerald-800">
                  <CheckCircle className="w-4 h-4" />
                  <span>Webhook Dispatched & Processed Successfully!</span>
                </div>
                <div>Generated WAMID: {simMessageResult.wamid}</div>
                <div>Summary: {JSON.stringify(simMessageResult.result)}</div>
              </div>
            )}
          </form>
        </div>

        {/* Test Card 4: Webhook Ingestion Events Log */}
        <div className="lg:col-span-2 bg-slate-900 text-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">
                Live Webhook Ingestion Feed & Idempotency Store
              </h3>
            </div>
            <button
              onClick={loadEvents}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-white"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Events</span>
            </button>
          </div>

          <div className="overflow-x-auto max-h-80">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                  <th className="pb-2">Timestamp</th>
                  <th className="pb-2">WAMID / Event ID</th>
                  <th className="pb-2">Type</th>
                  <th className="pb-2">Idempotency</th>
                  <th className="pb-2 text-right">Raw Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-[11px]">
                {events.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-500">
                      No webhook events logged yet. Dispatch an inbound message above to see real
                      telemetry.
                    </td>
                  </tr>
                ) : (
                  events.map((evt) => (
                    <tr key={evt.id} className="hover:bg-slate-800/50">
                      <td className="py-2 text-slate-400">
                        {new Date(evt.createdAt).toLocaleTimeString()}
                      </td>
                      <td className="py-2 text-white truncate max-w-[150px]">
                        {evt.whatsappMessageId || evt.id}
                      </td>
                      <td className="py-2 text-emerald-400">{evt.eventType}</td>
                      <td className="py-2">
                        <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-1.5 py-0.5 rounded">
                          RECORDED
                        </span>
                      </td>
                      <td className="py-2 text-right">
                        <button
                          onClick={() =>
                            copyToClipboard(JSON.stringify(evt.payload, null, 2), evt.id)
                          }
                          className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 ml-auto"
                        >
                          {copiedId === evt.id ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>Copy JSON</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
