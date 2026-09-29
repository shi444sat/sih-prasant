'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderKanban,
  Activity,
  Bell,
  BarChart3,
  GitCompare,
  Cpu,
  Database,
  FileText,
  Users,
  Settings,
  FileClock,
  ShieldCheck,
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'OVERVIEW',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'MONITORING',
    items: [
      { name: 'Projects', href: '/projects', icon: FolderKanban },
      { name: 'Risk Monitor', href: '/risk-heatmap', icon: Activity },
      { name: 'Alerts', href: '/alerts', icon: Bell },
    ],
  },
  {
    title: 'ANALYSIS',
    items: [
      { name: 'Analytics', href: '/analytics', icon: BarChart3 },
      { name: 'Benchmarking', href: '/benchmarking', icon: GitCompare },
      { name: 'Model Evaluation', href: '/model-evaluation', icon: Cpu },
    ],
  },
  {
    title: 'DATA',
    items: [
      { name: 'Data Import', href: '/data-import', icon: Database },
      { name: 'Reports', href: '/reports', icon: FileText },
    ],
  },
  {
    title: 'ADMIN',
    items: [
      { name: 'Users', href: '/admin', icon: Users },
      { name: 'Models', href: '/model-evaluation', icon: Cpu },
      { name: 'Configuration', href: '/admin', icon: Settings },
      { name: 'Audit Log', href: '/admin', icon: FileClock },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[232px] min-w-[232px] h-screen bg-[#FFFFFF] border-r border-[#E4E7EC] flex flex-col justify-between select-none z-30 flex-shrink-0">
      {/* Top Header */}
      <div>
        <div className="h-16 px-5 border-b border-[#E4E7EC] flex flex-col justify-center">
          <Link href="/dashboard" className="block group">
            <div className="text-[14px] font-bold text-[#17202A] tracking-tight flex items-center space-x-2">
              <span className="w-2 h-2 rounded-xs bg-[#245B8F]"></span>
              <span>PROJECT DRISHTI</span>
            </div>
            <div className="text-[11px] text-[#667085] font-normal tracking-normal mt-0.5">
              Infrastructure Intelligence
            </div>
          </Link>
        </div>

        {/* Navigation Sections */}
        <nav className="py-4 px-3 space-y-5 overflow-y-auto max-h-[calc(100vh-140px)]">
          {navSections.map((section) => (
            <div key={section.title}>
              <div className="px-2 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#98A2B3]">
                {section.title}
              </div>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center space-x-2.5 px-2.5 py-1.5 rounded-sm text-[13px] font-medium transition ${
                        isActive
                          ? 'bg-[#F0F6FB] text-[#245B8F] border-l-2 border-[#245B8F] font-semibold'
                          : 'text-[#667085] hover:text-[#17202A] hover:bg-[#F9FAFB] border-l-2 border-transparent'
                      }`}
                    >
                      <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? 'text-[#245B8F]' : 'text-[#98A2B3]'}`} />
                      <span className="truncate">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Bottom Quiet Footer */}
      <div className="p-3.5 border-t border-[#E4E7EC] bg-[#FAFBFC]">
        <div className="flex items-center space-x-2 text-[10px] font-semibold text-[#667085] uppercase tracking-wide">
          <ShieldCheck className="w-3.5 h-3.5 text-[#245B8F]" />
          <span>DEMO ENVIRONMENT</span>
        </div>
        <div className="text-[11px] text-[#98A2B3] mt-0.5">
          Synthetic Demonstration Data
        </div>
      </div>
    </aside>
  );
}
