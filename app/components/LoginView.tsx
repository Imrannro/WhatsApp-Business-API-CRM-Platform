'use client';

import React, { useState } from 'react';
import {
  MessageSquare,
  Shield,
  Sparkles,
  ArrowRight,
  UserCheck,
  Lock,
  Mail,
  User,
  Radio,
} from 'lucide-react';
import { apiClient } from './apiClient';
import { User as UserType } from './types';

interface LoginViewProps {
  onLoginSuccess: (user: UserType) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [isRegister, setIsRegister] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('admin@enterprise-whatsapp.io');
  const [password, setPassword] = useState<string>('AdminPassword123!');
  const [name, setName] = useState<string>('');
  const [role, setRole] = useState<'ADMIN' | 'AGENT'>('AGENT');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      if (isRegister) {
        const data = await apiClient.register(name, email, password, role);
        onLoginSuccess(data.user);
      } else {
        const data = await apiClient.login(email, password);
        onLoginSuccess(data.user);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoLogin = async (demoEmail: string, demoPass: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await apiClient.login(demoEmail, demoPass);
      onLoginSuccess(data.user);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Quick login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6">
      {/* Container */}
      <div className="max-w-md w-full space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
            <MessageSquare className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">WhatsApp Business CRM</h1>
          <p className="text-xs text-slate-400">
            Meta Cloud API v21.0 · Omnichannel Helpdesk & Webhook Gateway
          </p>
        </div>

        {/* Quick Demo Credentials Panel */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 space-y-2.5 shadow-md">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              One-Click Demo Credentials
            </span>
            <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded font-mono">
              Ready
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() =>
                handleQuickDemoLogin('admin@enterprise-whatsapp.io', 'AdminPassword123!')
              }
              disabled={isLoading}
              className="p-2.5 bg-slate-700/80 hover:bg-slate-700 border border-slate-600 rounded-xl text-left transition-all group"
            >
              <div className="text-xs font-bold text-white group-hover:text-emerald-400">
                Alexander Wright
              </div>
              <div className="text-[10px] text-purple-300 font-semibold uppercase">Admin Role</div>
              <div className="text-[10px] text-slate-400 mt-1 font-mono truncate">
                admin@enterprise-whatsapp.io
              </div>
            </button>

            <button
              type="button"
              onClick={() =>
                handleQuickDemoLogin('agent.sarah@enterprise-whatsapp.io', 'AgentPassword123!')
              }
              disabled={isLoading}
              className="p-2.5 bg-slate-700/80 hover:bg-slate-700 border border-slate-600 rounded-xl text-left transition-all group"
            >
              <div className="text-xs font-bold text-white group-hover:text-emerald-400">
                Sarah Connor
              </div>
              <div className="text-[10px] text-blue-300 font-semibold uppercase">Agent Role</div>
              <div className="text-[10px] text-slate-400 mt-1 font-mono truncate">
                agent.sarah@enterprise-whatsapp.io
              </div>
            </button>
          </div>
        </div>

        {/* Auth Card */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-4">
          {/* Tabs */}
          <div className="flex border-b border-slate-700 pb-2 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setIsRegister(false)}
              className={`flex-1 text-center pb-2 transition-colors ${
                !isRegister
                  ? 'border-b-2 border-emerald-500 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setIsRegister(true)}
              className={`flex-1 text-center pb-2 transition-colors ${
                isRegister
                  ? 'border-b-2 border-emerald-500 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Register Agent
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 rounded-xl text-xs">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            {isRegister && (
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rachel Adams"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="font-semibold text-slate-300 block mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  placeholder="agent@enterprise-whatsapp.io"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-300 block mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {isRegister && (
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Account Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'ADMIN' | 'AGENT')}
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500 font-semibold"
                >
                  <option value="AGENT">Support Agent (Triage & Messaging)</option>
                  <option value="ADMIN">Administrator (Full Access)</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/20"
            >
              <span>{isLoading ? 'Authenticating...' : isRegister ? 'Create Account' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Security badges */}
        <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            Bcrypt + JWT Security
          </span>
          <span>·</span>
          <span>Role-Based Access Control</span>
        </div>
      </div>
    </div>
  );
};
