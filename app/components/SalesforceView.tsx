'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Cloud,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Link,
  Unlink,
  Settings,
  Database,
  ArrowRightLeft,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Zap,
  Activity,
  UserCheck,
  FileText,
  Clock,
  Sliders,
  Check,
  Copy,
} from 'lucide-react';
import { apiClient } from './apiClient';
import { SalesforceIntegration, SalesforceSyncLog, SalesforceFieldMapping } from './types';

export function SalesforceView() {
  const [integration, setIntegration] = useState<SalesforceIntegration | null>(null);
  const [logs, setLogs] = useState<SalesforceSyncLog[]>([]);
  const [mappings, setMappings] = useState<SalesforceFieldMapping[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'mappings' | 'logs' | 'direct-connect'>('overview');

  // Direct connect modal state
  const [directForm, setDirectForm] = useState({
    instanceUrl: 'https://login.salesforce.com',
    accessToken: '',
    refreshToken: '',
    environment: 'production' as 'production' | 'sandbox',
    targetObject: 'Contact' as 'Contact' | 'Lead' | 'Both',
    autoSyncMessages: true,
    autoSyncContacts: true,
  });

  // OAuth config state
  const [oauthForm, setOauthForm] = useState({
    clientId: '',
    clientSecret: '',
    redirectUri: typeof window !== 'undefined' ? `${window.location.origin}/api/salesforce/oauth/callback` : '',
    environment: 'production' as 'production' | 'sandbox',
  });

  // Field mapping state
  const [newMapping, setNewMapping] = useState({
    entityType: 'Contact' as 'Contact' | 'Lead',
    localField: 'email',
    salesforceField: 'Email',
    direction: 'BIDIRECTIONAL' as 'INBOUND' | 'OUTBOUND' | 'BIDIRECTIONAL',
    isActive: true,
  });
  const [showAddMapping, setShowAddMapping] = useState<boolean>(false);

  // Schema describe state
  const [describeObject, setDescribeObject] = useState<'Contact' | 'Lead' | 'Task' | 'Case'>('Contact');
  const [schemaFields, setSchemaFields] = useState<any[]>([]);
  const [isLoadingSchema, setIsLoadingSchema] = useState<boolean>(false);

  const [copiedWebhook, setCopiedWebhook] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [statusRes, mappingsRes, logsRes] = await Promise.all([
        apiClient.getSalesforceStatus().catch(() => null),
        apiClient.getSalesforceMappings().catch(() => null),
        apiClient.getSalesforceLogs(50).catch(() => null),
      ]);

      if (statusRes?.data?.integration) {
        setIntegration(statusRes.data.integration);
      } else {
        setIntegration(null);
      }

      if (mappingsRes?.data) {
        setMappings(mappingsRes.data);
      }

      if (logsRes?.data) {
        setLogs(logsRes.data);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOAuthConnect = async () => {
    try {
      const res = await apiClient.getSalesforceAuthUrl(
        oauthForm.clientId || undefined,
        oauthForm.redirectUri || undefined,
        oauthForm.environment
      );
      if (res?.authUrl) {
        window.open(res.authUrl, '_blank', 'width=800,height=650');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to get OAuth URL';
      alert(`OAuth Error: ${msg}`);
    }
  };

  const handleDirectConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directForm.instanceUrl || !directForm.accessToken) {
      alert('Instance URL and Access Token are required.');
      return;
    }

    try {
      setIsSyncing(true);
      setSyncStatusMsg('Verifying Salesforce credentials and instance connection...');
      await apiClient.connectSalesforceDirect(directForm);
      await loadData();
      setActiveSubTab('overview');
      setSyncStatusMsg('Connected and verified with Salesforce successfully!');
      setTimeout(() => setSyncStatusMsg(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Connection failed';
      alert(`Connection failed: ${msg}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect Salesforce? Active syncing will be stopped.')) return;
    try {
      setIsLoading(true);
      await apiClient.disconnectSalesforce();
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Disconnect failed';
      alert(`Error: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTriggerSync = async (entityType: 'CONTACT' | 'LEAD' | 'ALL' = 'ALL') => {
    try {
      setIsSyncing(true);
      setSyncStatusMsg(`Executing ${entityType} synchronization with Salesforce CRM...`);
      const res = await apiClient.triggerSalesforceSync(entityType);
      await loadData();
      if (res?.data) {
        setSyncStatusMsg(
          `Sync completed! Processed: ${res.data.recordsProcessed}, Synced: ${res.data.recordsSynced}, Failed: ${res.data.recordsFailed} in ${res.data.durationMs}ms`
        );
      }
      setTimeout(() => setSyncStatusMsg(null), 5000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sync failed';
      alert(`Sync failed: ${msg}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleToggleAutoSync = async (field: 'autoSyncMessages' | 'autoSyncContacts', value: boolean) => {
    if (!integration) return;
    try {
      const updated = {
        autoSyncMessages: field === 'autoSyncMessages' ? value : integration.autoSyncMessages,
        autoSyncContacts: field === 'autoSyncContacts' ? value : integration.autoSyncContacts,
        targetObject: integration.targetObject,
      };
      await apiClient.updateSalesforceSettings(updated);
      setIntegration({
        ...integration,
        [field]: value,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update setting';
      alert(msg);
    }
  };

  const handleTargetObjectChange = async (targetObject: 'Contact' | 'Lead' | 'Both') => {
    if (!integration) return;
    try {
      await apiClient.updateSalesforceSettings({ targetObject });
      setIntegration({
        ...integration,
        targetObject,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update target object';
      alert(msg);
    }
  };

  const handleCreateMapping = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.createSalesforceMapping(newMapping);
      setShowAddMapping(false);
      const res = await apiClient.getSalesforceMappings();
      if (res?.data) setMappings(res.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add mapping';
      alert(msg);
    }
  };

  const handleToggleMappingActive = async (id: string, currentActive: boolean) => {
    try {
      await apiClient.updateSalesforceMapping(id, { isActive: !currentActive });
      setMappings((prev) => prev.map((m) => (m.id === id ? { ...m, isActive: !currentActive } : m)));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update mapping';
      alert(msg);
    }
  };

  const handleDeleteMapping = async (id: string) => {
    if (!confirm('Delete this field mapping?')) return;
    try {
      await apiClient.deleteSalesforceMapping(id);
      setMappings((prev) => prev.filter((m) => m.id !== id));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete mapping';
      alert(msg);
    }
  };

  const handleResetMappings = async () => {
    if (!confirm('Reset all field mappings to Salesforce defaults?')) return;
    try {
      const res = await apiClient.resetSalesforceMappings();
      if (res?.data) setMappings(res.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to reset mappings';
      alert(msg);
    }
  };

  const handleClearLogs = async () => {
    if (!confirm('Clear all Salesforce sync audit logs?')) return;
    try {
      await apiClient.clearSalesforceLogs();
      setLogs([]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to clear logs';
      alert(msg);
    }
  };

  const handleFetchSchema = async (sobject: 'Contact' | 'Lead' | 'Task' | 'Case') => {
    setDescribeObject(sobject);
    setIsLoadingSchema(true);
    try {
      const res = await apiClient.describeSalesforceSObject(sobject);
      if (res?.data?.fields) {
        setSchemaFields(res.data.fields);
      }
    } catch (err: unknown) {
      console.warn('Could not describe schema:', err);
      // Populate standard schema fields as fallback
      const standardFields: Record<string, string[]> = {
        Contact: ['Id', 'FirstName', 'LastName', 'Name', 'Email', 'Phone', 'MobilePhone', 'Department', 'Title', 'Description', 'AccountId'],
        Lead: ['Id', 'FirstName', 'LastName', 'Name', 'Email', 'Phone', 'MobilePhone', 'Company', 'Status', 'Title', 'Description'],
        Task: ['Id', 'WhoId', 'WhatId', 'Subject', 'Description', 'Status', 'Priority', 'ActivityDate', 'TaskSubtype'],
        Case: ['Id', 'ContactId', 'Subject', 'Description', 'Status', 'Priority', 'Origin'],
      };
      setSchemaFields(
        (standardFields[sobject] || []).map((name) => ({
          name,
          label: name,
          type: 'string',
          updateable: true,
          createable: true,
        }))
      );
    } finally {
      setIsLoadingSchema(false);
    }
  };

  const copyWebhookUrl = () => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/api/salesforce/webhook` : '/api/salesforce/webhook';
    navigator.clipboard.writeText(url);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  const isConnected = integration?.status === 'CONNECTED';

  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-y-auto">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">Salesforce CRM Integration</h1>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  isConnected
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                {isConnected ? 'CONNECTED' : 'NOT CONNECTED'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Bidirectional synchronization between WhatsApp Business conversations and Salesforce Contacts, Leads & Tasks
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isConnected && (
            <button
              onClick={() => handleTriggerSync('ALL')}
              disabled={isSyncing}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync All Now'}
            </button>
          )}

          <button
            onClick={loadData}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Sync Status Banner */}
      {syncStatusMsg && (
        <div className="mx-6 mt-4 p-3.5 rounded-xl bg-blue-50 border border-blue-200 flex items-center gap-3 text-xs text-blue-800 font-medium">
          <Activity className="w-4 h-4 text-blue-600 animate-pulse shrink-0" />
          <span>{syncStatusMsg}</span>
        </div>
      )}

      {/* Sub-Navigation Tabs */}
      <div className="px-6 pt-4 border-b border-slate-200 bg-white flex gap-6 text-xs font-medium">
        <button
          onClick={() => setActiveSubTab('overview')}
          className={`pb-3 border-b-2 transition flex items-center gap-1.5 ${
            activeSubTab === 'overview'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Cloud className="w-4 h-4" />
          Overview & Sync Controls
        </button>

        <button
          onClick={() => setActiveSubTab('mappings')}
          className={`pb-3 border-b-2 transition flex items-center gap-1.5 ${
            activeSubTab === 'mappings'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Field Mappings ({mappings.length})
        </button>

        <button
          onClick={() => setActiveSubTab('logs')}
          className={`pb-3 border-b-2 transition flex items-center gap-1.5 ${
            activeSubTab === 'logs'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          Sync Logs ({logs.length})
        </button>

        <button
          onClick={() => setActiveSubTab('direct-connect')}
          className={`pb-3 border-b-2 transition flex items-center gap-1.5 ${
            activeSubTab === 'direct-connect'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Link className="w-4 h-4" />
          {isConnected ? 'Connection Settings' : 'Connect Salesforce'}
        </button>
      </div>

      {/* Content Area */}
      <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* TAB 1: OVERVIEW & CONTROLS */}
        {activeSubTab === 'overview' && (
          <div className="space-y-6">
            {/* Connection Info Banner */}
            {isConnected ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-bold">
                      SF
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-slate-900">
                          {integration?.userName || 'Connected Salesforce Org'}
                        </h2>
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[11px] font-semibold">
                          {integration?.environment.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                        <span>Instance: <code className="text-slate-700 font-mono">{integration?.instanceUrl}</code></span>
                        {integration?.orgId && <span>• Org ID: <code className="text-slate-700 font-mono">{integration.orgId}</code></span>}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleDisconnect}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold transition"
                    >
                      <Unlink className="w-3.5 h-3.5" />
                      Disconnect
                    </button>
                  </div>
                </div>

                {/* Quick Status Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Sync Target</div>
                    <div className="text-sm font-bold text-slate-900 mt-1 flex items-center gap-1.5">
                      <Database className="w-4 h-4 text-blue-600" />
                      {integration?.targetObject}s
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Message Sync</div>
                    <div className="text-sm font-bold text-slate-900 mt-1 flex items-center gap-1.5">
                      <Zap className={`w-4 h-4 ${integration?.autoSyncMessages ? 'text-emerald-500' : 'text-slate-400'}`} />
                      {integration?.autoSyncMessages ? 'Automatic (Tasks)' : 'Disabled'}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Contact Sync</div>
                    <div className="text-sm font-bold text-slate-900 mt-1 flex items-center gap-1.5">
                      <UserCheck className={`w-4 h-4 ${integration?.autoSyncContacts ? 'text-emerald-500' : 'text-slate-400'}`} />
                      {integration?.autoSyncContacts ? 'Automatic (Bi-dir)' : 'Disabled'}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Last Sync</div>
                    <div className="text-sm font-bold text-slate-900 mt-1 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-indigo-500" />
                      {integration?.lastSyncAt ? new Date(integration.lastSyncAt).toLocaleTimeString() : 'Never'}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-8 text-white shadow-xl">
                <div className="max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-medium mb-4">
                    <Cloud className="w-3.5 h-3.5" />
                    Enterprise CRM Sync Gateway
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight text-white">
                    Connect Salesforce CRM with WhatsApp Business
                  </h2>
                  <p className="text-slate-300 text-sm mt-2 leading-relaxed">
                    Seamlessly bidirectional sync your WhatsApp customers, chats, and leads to Salesforce. Automatically record customer support conversations as Salesforce Tasks & Cases without manual data entry.
                  </p>

                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => setActiveSubTab('direct-connect')}
                      className="px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-slate-900 font-semibold text-xs transition shadow-lg shadow-blue-500/30 flex items-center gap-2"
                    >
                      <Link className="w-4 h-4" />
                      Connect Salesforce Org
                    </button>
                    <button
                      onClick={() => setActiveSubTab('mappings')}
                      className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-xs border border-white/10 transition flex items-center gap-2"
                    >
                      <Sliders className="w-4 h-4" />
                      View Field Mappings
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Sync Trigger Grid */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-1">Manual & On-Demand Synchronization</h3>
              <p className="text-xs text-slate-500 mb-6">
                Trigger targeted synchronization jobs to match records or populate new leads from Salesforce.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 hover:border-blue-300 transition bg-slate-50/50 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-slate-900 font-semibold text-xs">
                      <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                      Salesforce Contacts → Local CRM
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Fetches Salesforce Contacts and matches with WhatsApp phone numbers or emails using duplicate detection.
                    </p>
                  </div>
                  <button
                    onClick={() => handleTriggerSync('CONTACT')}
                    disabled={isSyncing || !isConnected}
                    className="mt-4 w-full py-2 px-3 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition disabled:opacity-50"
                  >
                    Sync Contacts Inbound
                  </button>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 hover:border-blue-300 transition bg-slate-50/50 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-slate-900 font-semibold text-xs">
                      <ArrowDownLeft className="w-4 h-4 text-blue-600" />
                      Salesforce Leads → Local CRM
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Imports open Salesforce Leads and automatically tags them as <code className="text-slate-700">Salesforce-Lead</code> in WhatsApp CRM.
                    </p>
                  </div>
                  <button
                    onClick={() => handleTriggerSync('LEAD')}
                    disabled={isSyncing || !isConnected}
                    className="mt-4 w-full py-2 px-3 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition disabled:opacity-50"
                  >
                    Sync Leads Inbound
                  </button>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 hover:border-blue-300 transition bg-slate-50/50 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-slate-900 font-semibold text-xs">
                      <ArrowRightLeft className="w-4 h-4 text-purple-600" />
                      Full Bidirectional Sync
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Executes full bidirectional sync: downloads SF records, pushes unsynced WhatsApp contacts, and updates timestamps.
                    </p>
                  </div>
                  <button
                    onClick={() => handleTriggerSync('ALL')}
                    disabled={isSyncing || !isConnected}
                    className="mt-4 w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
                  >
                    Run Full Sync
                  </button>
                </div>
              </div>
            </div>

            {/* Sync Configuration & Toggles */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-1">Automation & Integration Rules</h3>
              <p className="text-xs text-slate-500 mb-6">
                Configure background event triggers and automated activity logging rules.
              </p>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-slate-900">Auto-Sync WhatsApp Messages to Salesforce Tasks</div>
                    <div className="text-[11px] text-slate-500">
                      When active, every incoming and outgoing WhatsApp message automatically creates a completed Activity Task under the matched Contact.
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(integration?.autoSyncMessages)}
                      onChange={(e) => handleToggleAutoSync('autoSyncMessages', e.target.checked)}
                      disabled={!isConnected}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-slate-900">Auto-Sync Inbound Contacts</div>
                    <div className="text-[11px] text-slate-500">
                      Automatically create or link Salesforce records when a new customer sends their first WhatsApp message.
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(integration?.autoSyncContacts)}
                      onChange={(e) => handleToggleAutoSync('autoSyncContacts', e.target.checked)}
                      disabled={!isConnected}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-slate-900">Target Salesforce Record Entity</div>
                    <div className="text-[11px] text-slate-500">
                      Choose whether new WhatsApp users should be created as Contacts, Leads, or synchronized to Both.
                    </div>
                  </div>
                  <select
                    value={integration?.targetObject || 'Contact'}
                    onChange={(e) => handleTargetObjectChange(e.target.value as 'Contact' | 'Lead' | 'Both')}
                    disabled={!isConnected}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="Contact">Contacts (Standard)</option>
                    <option value="Lead">Leads (Prospective)</option>
                    <option value="Both">Both (Full Matrix)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Inbound Webhook Details */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-1">Salesforce Change Data Capture / Outbound Webhook</h3>
              <p className="text-xs text-slate-500 mb-4">
                Provide this webhook endpoint to Salesforce Apex Callouts, Flow HTTP Callouts, or Workflow Outbound Messages for instant real-time updates.
              </p>

              <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs">
                <code className="flex-1 truncate">
                  {typeof window !== 'undefined' ? `${window.location.origin}/api/salesforce/webhook` : '/api/salesforce/webhook'}
                </code>
                <button
                  onClick={copyWebhookUrl}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-sans font-medium flex items-center gap-1.5 transition"
                >
                  {copiedWebhook ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedWebhook ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: FIELD MAPPINGS */}
        {activeSubTab === 'mappings' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Configured Field Mappings</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Map custom fields between local WhatsApp CRM and Salesforce standard/custom objects
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAddMapping(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Mapping
                  </button>
                  <button
                    onClick={handleResetMappings}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition"
                  >
                    Reset Defaults
                  </button>
                </div>
              </div>

              {/* Add Mapping Form Modal */}
              {showAddMapping && (
                <form onSubmit={handleCreateMapping} className="p-4 mb-6 rounded-xl bg-blue-50/70 border border-blue-200 space-y-4">
                  <div className="text-xs font-bold text-blue-900">Add New Field Mapping</div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Entity</label>
                      <select
                        value={newMapping.entityType}
                        onChange={(e) => setNewMapping({ ...newMapping, entityType: e.target.value as 'Contact' | 'Lead' })}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 outline-none"
                      >
                        <option value="Contact">Contact</option>
                        <option value="Lead">Lead</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Local CRM Field</label>
                      <input
                        type="text"
                        placeholder="e.g. email, company, notes"
                        value={newMapping.localField}
                        onChange={(e) => setNewMapping({ ...newMapping, localField: e.target.value })}
                        required
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Salesforce Field API Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Email, Department, Custom_Field__c"
                        value={newMapping.salesforceField}
                        onChange={(e) => setNewMapping({ ...newMapping, salesforceField: e.target.value })}
                        required
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Sync Direction</label>
                      <select
                        value={newMapping.direction}
                        onChange={(e) =>
                          setNewMapping({
                            ...newMapping,
                            direction: e.target.value as 'INBOUND' | 'OUTBOUND' | 'BIDIRECTIONAL',
                          })
                        }
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 outline-none"
                      >
                        <option value="BIDIRECTIONAL">Bidirectional</option>
                        <option value="INBOUND">Inbound (SF → Local)</option>
                        <option value="OUTBOUND">Outbound (Local → SF)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddMapping(false)}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
                    >
                      Save Mapping
                    </button>
                  </div>
                </form>
              )}

              {/* Mappings Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Entity</th>
                      <th className="py-3 px-4">Local CRM Field</th>
                      <th className="py-3 px-4">Salesforce Field</th>
                      <th className="py-3 px-4">Direction</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {mappings.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50/80 transition font-sans">
                        <td className="py-3 px-4 font-semibold text-slate-900">{m.entityType}</td>
                        <td className="py-3 px-4 font-mono text-slate-700">{m.localField}</td>
                        <td className="py-3 px-4 font-mono text-blue-600 font-semibold">{m.salesforceField}</td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold">
                            {m.direction}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleToggleMappingActive(m.id, m.isActive)}
                            className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition ${
                              m.isActive
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                            }`}
                          >
                            {m.isActive ? 'Active' : 'Disabled'}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleDeleteMapping(m.id)}
                            className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                            title="Delete mapping"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Schema Inspector Tool */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Salesforce Schema Field Inspector</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Inspect standard and custom fields available on your connected Salesforce SObjects
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {(['Contact', 'Lead', 'Task', 'Case'] as const).map((sobj) => (
                    <button
                      key={sobj}
                      onClick={() => handleFetchSchema(sobj)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        describeObject === sobj
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {sobj}
                    </button>
                  ))}
                </div>
              </div>

              {isLoadingSchema ? (
                <div className="p-8 text-center text-xs text-slate-400 font-mono">
                  Loading {describeObject} schema from Salesforce...
                </div>
              ) : schemaFields.length > 0 ? (
                <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200 p-3 bg-slate-50/50">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {schemaFields.map((f, i) => (
                      <div key={i} className="p-2 rounded-lg bg-white border border-slate-200 text-xs">
                        <div className="font-mono font-semibold text-slate-900 truncate">{f.name}</div>
                        <div className="text-[10px] text-slate-500 truncate">{f.label} ({f.type})</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-400">
                  Click an entity above to inspect available Salesforce fields.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: SYNC LOGS */}
        {activeSubTab === 'logs' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Salesforce Sync Audit Logs</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Chronological history of synchronization runs, record counts, timings, and error traces
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleClearLogs}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition"
                >
                  Clear Logs
                </button>
              </div>
            </div>

            {logs.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs font-mono">
                No sync logs recorded yet. Trigger a sync to generate audit trails.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">Direction</th>
                      <th className="py-3 px-4">Entity</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Processed / Synced</th>
                      <th className="py-3 px-4">Duration</th>
                      <th className="py-3 px-4">Error Detail</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold">
                            {log.direction}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900">{log.entityType}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                              log.status === 'SUCCESS'
                                ? 'bg-emerald-50 text-emerald-700'
                                : log.status === 'PARTIAL'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-red-50 text-red-700'
                            }`}
                          >
                            {log.status === 'SUCCESS' && <CheckCircle className="w-3 h-3" />}
                            {log.status !== 'SUCCESS' && <AlertCircle className="w-3 h-3" />}
                            {log.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono">
                          <span className="text-slate-900 font-semibold">{log.recordsSynced}</span>
                          <span className="text-slate-400"> / {log.recordsProcessed}</span>
                          {log.recordsFailed > 0 && (
                            <span className="text-red-500 font-semibold ml-1">({log.recordsFailed} failed)</span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500">{log.durationMs}ms</td>
                        <td className="py-3 px-4 max-w-xs truncate text-[11px] text-red-600 font-mono">
                          {log.error || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: DIRECT CONNECT / OAUTH CONFIG */}
        {activeSubTab === 'direct-connect' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Direct Token / Sandbox Connect Form */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Direct REST / Connected App Connect</h3>
              </div>
              <p className="text-xs text-slate-500">
                Connect directly using an OAuth access token, Connected App session token, or Developer Edition credentials.
              </p>

              <form onSubmit={handleDirectConnect} className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Salesforce Instance URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://yourdomain.my.salesforce.com"
                    value={directForm.instanceUrl}
                    onChange={(e) => setDirectForm({ ...directForm, instanceUrl: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    e.g. <code className="text-slate-600">https://na123.salesforce.com</code> or My Domain URL
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Access / Session Token <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="00D8c000008... or OAuth Bearer Token"
                    value={directForm.accessToken}
                    onChange={(e) => setDirectForm({ ...directForm, accessToken: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Refresh Token (Optional)</label>
                  <input
                    type="password"
                    placeholder="5Aep861... for automatic background refresh"
                    value={directForm.refreshToken}
                    onChange={(e) => setDirectForm({ ...directForm, refreshToken: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Environment</label>
                    <select
                      value={directForm.environment}
                      onChange={(e) =>
                        setDirectForm({ ...directForm, environment: e.target.value as 'production' | 'sandbox' })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 outline-none"
                    >
                      <option value="production">Production / Dev Edition</option>
                      <option value="sandbox">Sandbox (test.salesforce.com)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Target Object</label>
                    <select
                      value={directForm.targetObject}
                      onChange={(e) =>
                        setDirectForm({ ...directForm, targetObject: e.target.value as 'Contact' | 'Lead' | 'Both' })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 outline-none"
                    >
                      <option value="Contact">Contacts</option>
                      <option value="Lead">Leads</option>
                      <option value="Both">Both (Contacts & Leads)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSyncing}
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition shadow-sm disabled:opacity-50"
                  >
                    {isSyncing ? 'Connecting & Verifying...' : 'Save & Verify Connection'}
                  </button>
                </div>
              </form>
            </div>

            {/* Salesforce OAuth 2.0 Web Flow Info */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">OAuth 2.0 Web Server Flow</h3>
              </div>
              <p className="text-xs text-slate-500">
                Initiate a browser popup OAuth 2.0 handshake with Salesforce to obtain tokens with automatic refresh support.
              </p>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Consumer Key (Client ID)</label>
                  <input
                    type="text"
                    placeholder="3MVG9... from Salesforce App Manager"
                    value={oauthForm.clientId}
                    onChange={(e) => setOauthForm({ ...oauthForm, clientId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Consumer Secret (Client Secret)</label>
                  <input
                    type="password"
                    placeholder="••••••••••••••••"
                    value={oauthForm.clientSecret}
                    onChange={(e) => setOauthForm({ ...oauthForm, clientSecret: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Callback / Redirect URI</label>
                  <input
                    type="text"
                    readOnly
                    value={oauthForm.redirectUri}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-mono text-[11px] text-slate-600 outline-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleOAuthConnect}
                    className="w-full py-2.5 rounded-xl border border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold text-xs transition flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Launch Salesforce OAuth Window
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
