'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Lock, Mail, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';
import { loginUser } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@drishti.local');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const demoAccounts = [
    { role: 'Administrator', email: 'admin@drishti.local', pass: 'admin123', desc: 'Full policy weights & governance access' },
    { role: 'Monitoring Officer', email: 'officer@drishti.local', pass: 'officer123', desc: 'Alert queue triage & project sign-offs' },
    { role: 'Data Analyst', email: 'analyst@drishti.local', pass: 'analyst123', desc: 'ML models, trends & benchmarking' },
    { role: 'Executive Officer', email: 'executive@drishti.local', pass: 'executive123', desc: 'Portfolio-level overview & briefings' },
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await loginUser(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const selectDemoAccount = (acc: typeof demoAccounts[0]) => {
    setEmail(acc.email);
    setPassword(acc.pass);
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Institutional Branding */}
        <div className="flex items-center justify-center space-x-3 mb-2">
          <div className="w-10 h-10 rounded bg-[#1E40AF] flex items-center justify-center text-white border border-blue-400/30">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide">PROJECT DRISHTI</h1>
            <p className="text-[11px] text-slate-400 font-mono">Infrastructure Intelligence & Early Warning System</p>
          </div>
        </div>

        <div className="text-center mt-2 mb-6">
          <p className="text-xs text-slate-400">
            Smart Automation • SIH26103 • MoSPI / DIID
          </p>
          <div className="inline-block mt-2 px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-mono">
            DEMO MODE — SYNTHETIC DEMONSTRATION DATASET
          </div>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-6 px-6 rounded-md border border-slate-200 shadow-sm sm:px-8">
          <div className="border-b border-slate-200 pb-3 mb-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Sign in to Monitoring Workspace
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Role-Based Access Control Protected</p>
          </div>

          {error && (
            <div className="mb-4 p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Official Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-blue-600 font-mono"
                  placeholder="name@drishti.local"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-blue-600 font-mono"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 inline-flex items-center justify-center space-x-1.5 py-2 px-4 bg-[#1E40AF] hover:bg-blue-800 disabled:opacity-50 text-white font-semibold text-xs rounded transition shadow-2xs"
            >
              <span>{loading ? 'Authenticating...' : 'Sign in to Platform'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Quick Demo Role Selector */}
          <div className="mt-5 pt-4 border-t border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
              Select Demo Profile for Evaluation:
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => selectDemoAccount(acc)}
                  className={`text-left p-2 rounded border transition ${
                    email === acc.email
                      ? 'border-blue-600 bg-blue-50/50 text-blue-900 font-semibold'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold">{acc.role}</span>
                    <UserCheck className="w-3 h-3 text-slate-400" />
                  </div>
                  <span className="text-[10px] text-slate-500 block truncate mt-0.5">{acc.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-500 mt-4 font-mono">
          Project Drishti • Autonomous Edge Engine • Zero External Cloud Dependency
        </p>
      </div>
    </div>
  );
}
