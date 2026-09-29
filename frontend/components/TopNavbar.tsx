'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Search, Bell, Clock, RotateCcw, User } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import NotificationDrawer from './NotificationDrawer';

const routeTitles: Record<string, string> = {
  '/dashboard': 'Infrastructure Project Overview',
  '/projects': 'Projects',
  '/risk-heatmap': 'Risk Monitor',
  '/alerts': 'Early Warnings',
  '/analytics': 'Portfolio Analytics',
  '/benchmarking': 'Benchmarking',
  '/model-evaluation': 'Model Evaluation',
  '/data-import': 'Data Import',
  '/reports': 'Reports',
  '/admin': 'Administration',
};

export default function TopNavbar() {
  const pathname = usePathname();
  const {
    alerts,
    notifications,
    setSearchOpen,
    resetDemo,
  } = useApp();

  const [isNotifOpen, setNotifOpen] = useState(false);
  const [isResetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  const unreadNotifCount = notifications.filter((n) => !n.read).length;

  const currentTitle =
    pathname?.startsWith('/projects/') && pathname !== '/projects'
      ? 'Project Detail'
      : routeTitles[pathname] || 'Infrastructure Intelligence';

  const handleResetConfirm = async () => {
    setResetting(true);
    try {
      await resetDemo();
      setResetConfirmOpen(false);
    } finally {
      setResetting(false);
    }
  };

  return (
    <>
      <header className="h-16 bg-[#FFFFFF] border-b border-[#E4E7EC] sticky top-0 z-20 flex items-center justify-between px-6 font-sans select-none">
        {/* Left: Current Page Title */}
        <div className="flex items-center space-x-3">
          <h1 className="text-base font-semibold text-[#17202A] tracking-tight">
            {currentTitle}
          </h1>
        </div>

        {/* Center / Right: Search & Actions */}
        <div className="flex items-center space-x-5">
          {/* Global Search Button */}
          <button
            onClick={() => setSearchOpen(true)}
            className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-[#F7F8FA] hover:bg-[#F2F4F7] text-[#667085] border border-[#E4E7EC] rounded-md text-xs transition w-56 justify-between"
          >
            <span className="flex items-center space-x-2">
              <Search className="w-3.5 h-3.5 text-[#98A2B3]" />
              <span>Search projects, alerts...</span>
            </span>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white border border-[#E4E7EC] rounded text-[#667085]">
              ⌘K
            </kbd>
          </button>

          {/* Data Freshness Indicator (Section 13) */}
          <div className="hidden md:flex items-center space-x-2 text-right">
            <Clock className="w-3.5 h-3.5 text-[#98A2B3]" />
            <div className="text-[11px] leading-tight">
              <span className="text-[#98A2B3] block">Last updated</span>
              <span className="font-medium text-[#17202A]">29 Sep 2026 · 18:40</span>
            </div>
          </div>

          <div className="h-4 w-px bg-[#E4E7EC] hidden sm:block" />

          {/* Reset Demo Environment Button (Section 49) */}
          <button
            onClick={() => setResetConfirmOpen(true)}
            className="hidden lg:inline-flex items-center space-x-1.5 px-2.5 py-1 text-xs text-[#667085] hover:text-[#17202A] hover:bg-[#F7F8FA] rounded border border-transparent hover:border-[#E4E7EC] transition"
            title="Reset Demo Environment"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#98A2B3]" />
            <span>Reset Demo</span>
          </button>

          {/* Notifications Drawer Trigger */}
          <button
            onClick={() => setNotifOpen(true)}
            className="relative p-2 text-[#667085] hover:text-[#17202A] hover:bg-[#F7F8FA] rounded-md transition"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#C43D3D] rounded-full" />
            )}
          </button>

          {/* User Profile */}
          <div className="flex items-center space-x-2 pl-1">
            <div className="w-7 h-7 rounded-full bg-[#F0F6FB] border border-[#D0E2F2] flex items-center justify-center text-[#245B8F] text-xs font-semibold">
              <User className="w-4 h-4" />
            </div>
            <div className="hidden xl:block text-left leading-tight">
              <div className="text-xs font-semibold text-[#17202A]">Monitoring Officer</div>
              <div className="text-[10px] text-[#667085]">MoSPI / DIID</div>
            </div>
          </div>
        </div>
      </header>

      {/* Reset Confirmation Dialog */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
          <div className="bg-white rounded-md border border-[#E4E7EC] max-w-sm w-full p-5 shadow-lg space-y-4">
            <div>
              <h3 className="text-sm font-bold text-[#17202A]">Reset Demo Environment?</h3>
              <p className="text-xs text-[#667085] mt-1">
                This will restore initial synthetic demonstration project data, clear simulated state, and reset acknowledged alerts.
              </p>
            </div>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setResetConfirmOpen(false)}
                disabled={resetting}
                className="px-3 py-1.5 text-xs font-medium text-[#344054] hover:bg-[#F9FAFB] rounded border border-[#D0D5DD]"
              >
                Cancel
              </button>
              <button
                onClick={handleResetConfirm}
                disabled={resetting}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-[#245B8F] hover:bg-[#1D4D79] rounded transition"
              >
                {resetting ? 'Resetting...' : 'Confirm Reset'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Drawer */}
      <NotificationDrawer isOpen={isNotifOpen} onClose={() => setNotifOpen(false)} />
    </>
  );
}
