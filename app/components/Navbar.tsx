'use client';

import React from 'react';
import {
  MessageSquare,
  ShieldCheck,
  Radio,
  LogOut,
  Sparkles,
  RefreshCw,
  Bell,
  Cpu,
} from 'lucide-react';
import { User } from './types';

interface NavbarProps {
  user: User;
  onLogout: () => void;
  providerStatus: { name: string; isMock: boolean; configured: boolean } | null;
  onOpenSimulator: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onLogout,
  providerStatus,
  onOpenSimulator,
  onRefresh,
  isRefreshing,
}) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between z-30 sticky top-0">
      {/* Brand & Platform Identity */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm shadow-emerald-200">
          <MessageSquare className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 tracking-tight text-base sm:text-lg">
              WhatsApp Cloud CRM
            </span>
            <span className="text-[11px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              v21.0
            </span>
          </div>
          <p className="text-xs text-slate-500 hidden sm:block">
            Omnichannel Helpdesk & Automated Webhook Gateway
          </p>
        </div>
      </div>

      {/* Center / Right controls */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Active Provider Indicator */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-700">
          <Radio
            className={`w-3.5 h-3.5 ${
              providerStatus?.isMock ? 'text-amber-500 animate-pulse' : 'text-emerald-500'
            }`}
          />
          <span className="font-medium">Provider:</span>
          <span className="font-semibold text-slate-900">
            {providerStatus?.name || 'Mock WhatsApp Sandbox'}
          </span>
          {providerStatus?.isMock ? (
            <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-medium">
              Demo Mode
            </span>
          ) : (
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-medium">
              Live Meta API
            </span>
          )}
        </div>

        {/* Demo Simulator Quick Trigger Button */}
        <button
          onClick={onOpenSimulator}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
          title="Simulate Inbound WhatsApp Customer Message"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span className="hidden sm:inline">WhatsApp Simulator</span>
        </button>

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors"
          title="Refresh Data"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
        </button>

        {/* User profile & logout */}
        <div className="flex items-center gap-3 pl-2 sm:pl-3 border-l border-slate-200">
          <div className="flex items-center gap-2 text-left">
            <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs uppercase">
              {user.name.slice(0, 2)}
            </div>
            <div className="hidden md:block">
              <div className="text-xs font-semibold text-slate-900 leading-tight">{user.name}</div>
              <div className="flex items-center gap-1">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-1.5 rounded ${
                    user.role === 'ADMIN'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {user.role}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
