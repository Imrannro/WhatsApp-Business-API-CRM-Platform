'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { InboxView } from './components/InboxView';
import { DashboardView } from './components/DashboardView';
import { ContactsView } from './components/ContactsView';
import { AgentsView } from './components/AgentsView';
import { SimulatorView } from './components/SimulatorView';
import { SettingsView } from './components/SettingsView';
import { AuditLogsView } from './components/AuditLogsView';
import { DocsView } from './components/DocsView';
import { LoginView } from './components/LoginView';
import { ActiveTab, User } from './components/types';
import { apiClient } from './components/apiClient';

export default function Home() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('inbox');
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);
  const [providerStatus, setProviderStatus] = useState<any | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Check auth session
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (savedUser && token) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (_e) {}
    }

    // Verify token with backend
    if (token) {
      apiClient
        .me()
        .then((res) => {
          if (res.data?.user) {
            setCurrentUser(res.data.user);
            localStorage.setItem('user', JSON.stringify(res.data.user));
          } else {
            setCurrentUser(null);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        })
        .catch(() => {
          // Token invalid or expired
          setCurrentUser(null);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        })
        .finally(() => setIsCheckingAuth(false));
    } else {
      setIsCheckingAuth(false);
    }
  }, []);

  // Fetch provider status and unread count
  const refreshGlobalMetrics = async () => {
    if (!currentUser) return;
    setIsRefreshing(true);
    try {
      const [settingsRes, statsRes] = await Promise.all([
        apiClient.getWhatsAppSettings().catch(() => null),
        apiClient.getStats().catch(() => null),
      ]);

      if (settingsRes?.whatsapp) {
        setProviderStatus(settingsRes.whatsapp);
      }
      if (statsRes?.data?.unreadConversations !== undefined) {
        setUnreadCount(statsRes.data.unreadConversations);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      refreshGlobalMetrics();
    }
  }, [currentUser]);

  const handleLogout = async () => {
    await apiClient.logout();
    setCurrentUser(null);
    setActiveTab('inbox');
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400 text-xs font-mono">
        Connecting to WhatsApp Cloud Gateway...
      </div>
    );
  }

  if (!currentUser) {
    return <LoginView onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Navbar */}
      <Navbar
        user={currentUser}
        onLogout={handleLogout}
        providerStatus={providerStatus}
        onOpenSimulator={() => setActiveTab('simulator')}
        onRefresh={refreshGlobalMetrics}
        isRefreshing={isRefreshing}
      />

      {/* Main Workspace: Sidebar + View Content */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          user={currentUser}
          unreadCount={unreadCount}
        />

        <main className="flex-1 flex flex-col overflow-hidden">
          {activeTab === 'inbox' && (
            <InboxView currentUser={currentUser} onRefreshStats={refreshGlobalMetrics} />
          )}

          {activeTab === 'dashboard' && (
            <DashboardView
              onSelectConversation={(id) => {
                setActiveTab('inbox');
              }}
            />
          )}

          {activeTab === 'contacts' && (
            <ContactsView
              onStartChatWithContact={(contactId) => {
                setActiveTab('inbox');
              }}
            />
          )}

          {activeTab === 'agents' && <AgentsView currentUser={currentUser} />}

          {activeTab === 'simulator' && (
            <SimulatorView onEventProcessed={refreshGlobalMetrics} />
          )}

          {activeTab === 'settings' && <SettingsView />}

          {activeTab === 'audit-logs' && <AuditLogsView />}

          {activeTab === 'docs' && <DocsView />}
        </main>
      </div>
    </div>
  );
}
