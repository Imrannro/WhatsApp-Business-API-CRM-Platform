'use client';

import React, { useState } from 'react';
import { BookOpen, Code, Server, Shield, CheckCircle, ExternalLink } from 'lucide-react';

export const DocsView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'architecture' | 'endpoints' | 'security'>(
    'architecture'
  );

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          System Architecture & OpenAPI Documentation
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Engineering specification, component topology, and REST API contracts
        </p>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveSubTab('architecture')}
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            activeSubTab === 'architecture'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-200'
          }`}
        >
          Topology & Message Flow
        </button>
        <button
          onClick={() => setActiveSubTab('endpoints')}
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            activeSubTab === 'endpoints'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-200'
          }`}
        >
          REST API Reference
        </button>
        <button
          onClick={() => setActiveSubTab('security')}
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            activeSubTab === 'security'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-200'
          }`}
        >
          Security & Idempotency
        </button>
      </div>

      {activeSubTab === 'architecture' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Message Pipeline & Webhook Ingestion</h3>
            <div className="bg-slate-900 text-emerald-400 p-4 rounded-xl font-mono text-xs overflow-x-auto leading-relaxed">
              {`1. Meta Graph API ──(Webhook POST)──> Webhook Gateway (/api/webhooks/whatsapp)
   │
   ├── Verify HMAC-SHA256(rawBody, appSecret) == X-Hub-Signature-256
   ├── Check WebhookEvent table for existing WAMID (Idempotency Guard)
   │     └── If duplicate: Return 200 OK + ignore processing
   │
   ├── Resolve Contact (Find or Auto-Provision from E.164 phone number)
   ├── Resolve Active Conversation (Find open ticket or create new)
   ├── Insert Inbound Message (Status: READ / RECEIVED)
   └── Return HTTP 200 OK (< 25ms SLA)

2. Agent Console ──(Outbound POST)──> /api/conversations/:id/messages
   │
   ├── Authenticate Bearer JWT & Check Role (AGENT / ADMIN)
   ├── Validate Payload with Zod (Sanitize text & template name)
   ├── Invoke active WhatsAppProvider (Meta Cloud API or Mock Provider)
   ├── Persist Outbound Message (Status: SENT)
   └── Record Immutable AuditLog entry`}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                WhatsAppProvider Abstraction
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                The core messaging service implements an inversion-of-control pattern. Controllers
                interact exclusively with the <code className="text-slate-800 font-mono">WhatsAppProvider</code> interface,
                allowing zero-downtime hot switching between the live Meta Graph API and the local
                mock development provider.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Relational Model (PostgreSQL + Prisma)
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Relational schema covering Users, Contacts, Conversations, Messages, Assignments,
                InternalNotes, WebhookEvents, and AuditLogs with complete foreign key integrity,
                indexes on phone numbers and WAMIDs, and cascading cleanup rules.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'endpoints' && (
        <div className="space-y-3">
          {[
            {
              method: 'POST',
              path: '/api/auth/login',
              desc: 'Authenticate user with email & password, returns JWT token',
              badge: 'Public',
            },
            {
              method: 'GET',
              path: '/api/conversations',
              desc: 'List conversations with status, assignee, and search filters',
              badge: 'Auth Required',
            },
            {
              method: 'POST',
              path: '/api/conversations/:id/messages',
              desc: 'Dispatch outbound WhatsApp text or template message',
              badge: 'Agent / Admin',
            },
            {
              method: 'POST',
              path: '/api/conversations/:id/assign',
              desc: 'Assign conversation ticket to support agent',
              badge: 'Admin Only',
            },
            {
              method: 'GET',
              path: '/api/webhooks/whatsapp',
              desc: 'Meta developer webhook handshake challenge verification',
              badge: 'Meta Gateway',
            },
            {
              method: 'POST',
              path: '/api/webhooks/whatsapp',
              desc: 'Ingest inbound messages, delivery receipts, and template events',
              badge: 'Meta Gateway',
            },
            {
              method: 'GET',
              path: '/api/contacts',
              desc: 'Query CRM contact directory with search and tag filters',
              badge: 'Auth Required',
            },
            {
              method: 'GET',
              path: '/api/dashboard/stats',
              desc: 'Fetch aggregated SLA metrics, message counts, and active tickets',
              badge: 'Auth Required',
            },
          ].map((ep, idx) => (
            <div
              key={idx}
              className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`px-2 py-1 rounded font-bold font-mono text-[10px] ${
                    ep.method === 'GET'
                      ? 'bg-blue-100 text-blue-700'
                      : ep.method === 'POST'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {ep.method}
                </span>
                <span className="font-mono font-bold text-slate-900">{ep.path}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-slate-500">{ep.desc}</span>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-semibold whitespace-nowrap">
                  {ep.badge}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeSubTab === 'security' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span>Cryptographic Verification</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every incoming Meta POST webhook is validated using HMAC SHA-256 against the raw
              request body buffer and the configured <code className="font-mono text-slate-800">META_APP_SECRET</code>.
              Payloads with missing or mismatching signatures are rejected with HTTP 401.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Idempotent Delivery Receipts</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Meta sends delivery callbacks asynchronously. The system updates existing message
              records from <span className="font-semibold text-slate-800">SENT</span> to{' '}
              <span className="font-semibold text-slate-800">DELIVERED</span> and{' '}
              <span className="font-semibold text-slate-800">READ</span> without creating
              duplicate entries.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
