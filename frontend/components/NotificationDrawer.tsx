'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { X, Bell, AlertTriangle, ArrowRight } from 'lucide-react';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationDrawer({ isOpen, onClose }: NotificationDrawerProps) {
  const { notifications, markNotificationAsRead, clearNotifications } = useApp();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* Backdrop */}
      <div onClick={onClose} className="absolute inset-0 bg-black/20 transition-opacity" />

      {/* Slide-out Drawer */}
      <div className="fixed inset-y-0 right-0 max-w-sm w-full bg-[#FFFFFF] border-l border-[#E4E7EC] shadow-xl flex flex-col text-[#17202A] font-sans z-10">
        {/* Header */}
        <div className="p-4 border-b border-[#E4E7EC] flex items-center justify-between bg-[#FAFBFC]">
          <div className="flex items-center space-x-2">
            <Bell className="w-4 h-4 text-[#245B8F]" />
            <span className="font-semibold text-sm text-[#17202A]">
              Notifications & Signals
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {notifications.length > 0 && (
              <button
                onClick={clearNotifications}
                className="text-xs text-[#667085] hover:text-[#17202A] underline"
              >
                Clear all
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 text-[#667085] hover:text-[#17202A] rounded hover:bg-[#F2F4F7]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 text-xs">
          {notifications.length === 0 ? (
            <div className="py-24 text-center text-[#98A2B3]">
              <Bell className="w-7 h-7 mx-auto mb-2 text-[#D0D5DD]" />
              <span className="text-xs">No active notifications</span>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => markNotificationAsRead(n.id)}
                className={`p-3 rounded-md border transition cursor-pointer ${
                  n.read
                    ? 'bg-[#FFFFFF] border-[#E4E7EC] text-[#667085]'
                    : 'bg-[#F0F6FB] border-[#D0E2F2] text-[#17202A]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-1.5 font-semibold text-xs">
                    {n.type === 'ALERT' && (
                      <AlertTriangle className="w-3.5 h-3.5 text-[#C43D3D] flex-shrink-0" />
                    )}
                    <span>{n.title}</span>
                  </div>
                  <span className="text-[10px] text-[#98A2B3] flex-shrink-0 font-mono">
                    {n.timestamp}
                  </span>
                </div>

                <p className="text-xs text-[#667085] mt-1 leading-relaxed">
                  {n.message}
                </p>

                {n.projectId && (
                  <div className="mt-2 pt-2 border-t border-[#E4E7EC] flex justify-end">
                    <Link
                      href={`/projects/${n.projectId}`}
                      onClick={onClose}
                      className="inline-flex items-center space-x-1 text-xs font-medium text-[#245B8F] hover:underline"
                    >
                      <span>View project</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
