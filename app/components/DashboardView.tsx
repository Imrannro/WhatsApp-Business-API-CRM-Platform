'use client';

import React, { useEffect, useState } from 'react';
import {
  Users,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  Mail,
  Phone,
  Radio,
  ExternalLink,
} from 'lucide-react';
import { DashboardStats, Conversation, AuditLog } from './types';
import { apiClient } from './apiClient';

interface DashboardViewProps {
  onSelectConversation: (id: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onSelectConversation }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentConversations, setRecentConversations] = useState<Conversation[]>([]);
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadDashboardData = async () => {
    try {
      const [statsRes, convsRes, logsRes] = await Promise.all([
        apiClient.getStats(),
        apiClient.getConversations({ all: true }),
        apiClient.getAuditLogs(),
      ]);

      if (statsRes.data) setStats(statsRes.data);
      if (convsRes.data) setRecentConversations(convsRes.data.slice(0, 5));
      if (logsRes.data) setRecentLogs(logsRes.data.slice(0, 6));
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (isLoading || !stats) {
    return (
      <div className="p-8 text-center text-slate-400 text-xs">
        Loading analytics dashboard...
      </div>
    );
  }

  const kpis = [
    {
      label: 'Total Contacts',
      value: stats.totalContacts,
      icon: Users,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      label: 'Open Conversations',
      value: stats.openConversations,
      icon: MessageSquare,
      color: 'text-emerald-600 bg-emerald-50',
    },
    {
      label: 'Pending Response',
      value: stats.pendingConversations,
      icon: Clock,
      color: 'text-amber-600 bg-amber-50',
    },
    {
      label: 'Resolved Tickets',
      value: stats.resolvedConversations,
      icon: CheckCircle2,
      color: 'text-indigo-600 bg-indigo-50',
    },
    {
      label: 'WhatsApp Inbound',
      value: stats.totalMessagesReceived,
      icon: ArrowDownLeft,
      color: 'text-teal-600 bg-teal-50',
    },
    {
      label: 'WhatsApp Outbound',
      value: stats.totalMessagesSent,
      icon: ArrowUpRight,
      color: 'text-purple-600 bg-purple-50',
    },
    {
      label: 'Unread Messages',
      value: stats.unreadConversations,
      icon: AlertCircle,
      color: 'text-red-600 bg-red-50',
    },
    {
      label: 'Resolution Rate',
      value: `${Math.round(
        (stats.resolvedConversations / (stats.totalConversations || 1)) * 100
      )}%`,
      icon: TrendingUp,
      color: 'text-emerald-600 bg-emerald-50',
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Operational Analytics & Telemetry
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Real-time metrics from Meta WhatsApp Business Cloud API v21.0 & CRM Gateway
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between"
            >
              <div>
                <div className="text-xs text-slate-500 font-medium">{kpi.label}</div>
                <div className="text-2xl font-bold text-slate-900 mt-1">{kpi.value}</div>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${kpi.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Two Column Layout: Message Distribution + Live Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Conversations & Channel Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          {/* Conversation Queue */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Active Conversation Queue</h3>
                <p className="text-xs text-slate-500">Latest active WhatsApp customer tickets</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                    <th className="pb-2.5">Customer</th>
                    <th className="pb-2.5">Subject</th>
                    <th className="pb-2.5">Status</th>
                    <th className="pb-2.5">Priority</th>
                    <th className="pb-2.5">Assignee</th>
                    <th className="pb-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentConversations.map((conv) => (
                    <tr key={conv.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3">
                        <div className="font-semibold text-slate-900">{conv.contact?.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {conv.contact?.phoneNumber}
                        </div>
                      </td>
                      <td className="py-3 max-w-[180px] truncate text-slate-600">
                        {conv.subject || 'Support Ticket'}
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            conv.status === 'OPEN'
                              ? 'bg-emerald-100 text-emerald-800'
                              : conv.status === 'PENDING'
                              ? 'bg-amber-100 text-amber-800'
                              : conv.status === 'RESOLVED'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {conv.status}
                        </span>
                      </td>
                      <td className="py-3 font-semibold text-[10px] text-slate-700">
                        {conv.priority}
                      </td>
                      <td className="py-3 text-slate-600">
                        {conv.assignedAgent?.name || 'Unassigned'}
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => onSelectConversation(conv.id)}
                          className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-100 text-slate-700 hover:bg-emerald-600 hover:text-white transition-colors"
                        >
                          Open Chat
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Architecture & Reliability Spec Card */}
          <div className="bg-slate-900 text-white rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Cloud Infrastructure Health & Idempotency
                </h4>
              </div>
              <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800 font-mono">
                100% Operational
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                <span className="text-[10px] text-slate-400 block mb-1">Webhook Latency</span>
                <span className="text-base font-bold text-white font-mono">&lt; 25 ms</span>
                <p className="text-[10px] text-slate-400 mt-1">
                  Sub-second 200 OK webhook response SLA
                </p>
              </div>
              <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                <span className="text-[10px] text-slate-400 block mb-1">Signature Auth</span>
                <span className="text-base font-bold text-white font-mono">HMAC SHA-256</span>
                <p className="text-[10px] text-slate-400 mt-1">
                  Validated against X-Hub-Signature-256
                </p>
              </div>
              <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                <span className="text-[10px] text-slate-400 block mb-1">Duplicate Protection</span>
                <span className="text-base font-bold text-white font-mono">WAMID Guard</span>
                <p className="text-[10px] text-slate-400 mt-1">
                  Prevents duplicated Meta webhook retries
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Live Audit Trail Feed */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Audit Trail & System Events</h3>
            <p className="text-xs text-slate-500">Immutable record of agent and gateway actions</p>
          </div>

          <div className="space-y-3">
            {recentLogs.map((log) => (
              <div key={log.id} className="text-xs border-l-2 border-emerald-500 pl-3 py-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">{log.action}</span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(log.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div className="text-slate-500 text-[11px] mt-0.5">
                  Resource: {log.resource}
                </div>
                {log.details && (
                  <div className="text-[10px] text-slate-400 font-mono mt-1 bg-slate-50 p-1 rounded overflow-x-auto">
                    {JSON.stringify(log.details)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
