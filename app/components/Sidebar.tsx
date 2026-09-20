'use client';

import React from 'react';
import {
  Inbox,
  LayoutDashboard,
  Users,
  UserCheck,
  Cpu,
  Settings,
  ShieldAlert,
  BookOpen,
  Cloud,
} from 'lucide-react';
import { ActiveTab, User } from './types';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  user: User;
  unreadCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  user,
  unreadCount,
}) => {
  const navItems = [
    {
      id: 'inbox' as ActiveTab,
      label: 'Inbox & Live Chat',
      icon: Inbox,
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    {
      id: 'dashboard' as ActiveTab,
      label: 'Analytics Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'contacts' as ActiveTab,
      label: 'Contacts CRM',
      icon: Users,
    },
    {
      id: 'salesforce' as ActiveTab,
      label: 'Salesforce CRM',
      icon: Cloud,
      badge: undefined,
    },
    {
      id: 'agents' as ActiveTab,
      label: 'Team & Agents',
      icon: UserCheck,
      adminOnly: true,
    },
    {
      id: 'simulator' as ActiveTab,
      label: 'WhatsApp Simulator',
      icon: Cpu,
    },
    {
      id: 'settings' as ActiveTab,
      label: 'Cloud API Settings',
      icon: Settings,
    },
    {
      id: 'audit-logs' as ActiveTab,
      label: 'Audit Trail',
      icon: ShieldAlert,
    },
    {
      id: 'docs' as ActiveTab,
      label: 'Architecture & API',
      icon: BookOpen,
    },
  ];

  const visibleItems = navItems.filter((item) => !item.adminOnly || user.role === 'ADMIN');

  return (
    <aside className="w-16 md:w-64 bg-slate-900 text-slate-300 flex flex-col justify-between shrink-0 select-none border-r border-slate-800">
      <div className="py-4">
        <div className="px-4 mb-4 hidden md:block">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Navigation
          </span>
        </div>

        <nav className="space-y-1 px-2">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
                title={item.label}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="hidden md:inline truncate">{item.label}</span>
                {item.badge !== undefined && (
                  <span className="ml-auto hidden md:inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-emerald-500 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* System Status Footer */}
      <div className="p-3 border-t border-slate-800 hidden md:block">
        <div className="bg-slate-800/80 rounded-lg p-3 text-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span>Webhook Gateway</span>
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
          <div className="text-[11px] text-slate-300 font-mono truncate">
            /api/webhooks/whatsapp
          </div>
          <div className="mt-2 text-[10px] text-slate-400">
            Meta Graph API v21.0 · Idempotency On
          </div>
        </div>
      </div>
    </aside>
  );
};
