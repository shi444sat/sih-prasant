'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Search, X, FolderKanban, Bell } from 'lucide-react';

export default function GlobalSearchModal() {
  const router = useRouter();
  const { isSearchOpen, setSearchOpen, projects, alerts } = useApp();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setSearchOpen]);

  if (!isSearchOpen) return null;

  const trimmed = query.trim().toLowerCase();

  const matchedProjects = trimmed
    ? projects.filter(
        (p) =>
          p.code.toLowerCase().includes(trimmed) ||
          p.name.toLowerCase().includes(trimmed) ||
          p.agency.toLowerCase().includes(trimmed) ||
          p.sector.toLowerCase().includes(trimmed)
      ).slice(0, 8)
    : projects.slice(0, 5);

  const matchedAlerts = trimmed
    ? alerts.filter(
        (a) =>
          a.alert_code?.toLowerCase().includes(trimmed) ||
          a.title?.toLowerCase().includes(trimmed) ||
          a.project_code?.toLowerCase().includes(trimmed) ||
          a.message?.toLowerCase().includes(trimmed)
      ).slice(0, 4)
    : [];

  const handleSelectProject = (id: number) => {
    setSearchOpen(false);
    setQuery('');
    router.push(`/projects/${id}`);
  };

  const handleSelectAlert = () => {
    setSearchOpen(false);
    setQuery('');
    router.push(`/alerts`);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-20 flex justify-center items-start select-none">
      {/* Backdrop */}
      <div
        onClick={() => setSearchOpen(false)}
        className="fixed inset-0 bg-black/25 transition-opacity"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl bg-[#FFFFFF] rounded-md border border-[#E4E7EC] shadow-2xl overflow-hidden font-sans z-10">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-[#E4E7EC] bg-[#FAFBFC]">
          <Search className="w-4 h-4 text-[#98A2B3] mr-3 flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects by code, name, agency, or alerts..."
            autoFocus
            className="w-full bg-transparent text-sm text-[#17202A] placeholder-[#98A2B3] focus:outline-none"
          />
          {query ? (
            <button onClick={() => setQuery('')} className="p-1 text-[#98A2B3] hover:text-[#17202A]">
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white border border-[#E4E7EC] rounded text-[#667085]">
              ESC
            </kbd>
          )}
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 divide-y divide-[#F2F4F7]">
          {/* Projects Results */}
          <div className="py-1">
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#98A2B3]">
              Projects ({matchedProjects.length})
            </div>
            {matchedProjects.length === 0 ? (
              <div className="px-3 py-2 text-xs text-[#98A2B3]">No projects found</div>
            ) : (
              matchedProjects.map((p) => (
                <div
                  key={p.id}
                  onClick={() => handleSelectProject(p.id)}
                  className="px-3 py-2 hover:bg-[#F0F6FB] rounded cursor-pointer transition flex items-center justify-between group"
                >
                  <div className="flex items-center space-x-2.5">
                    <FolderKanban className="w-4 h-4 text-[#98A2B3] group-hover:text-[#245B8F]" />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-semibold text-xs text-[#245B8F]">{p.code}</span>
                        <span className="text-xs text-[#17202A] font-medium line-clamp-1">{p.name}</span>
                      </div>
                      <div className="text-[11px] text-[#667085] mt-0.5">
                        {p.agency} · {p.sector}
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded border border-[#E4E7EC] bg-[#FFFFFF]">
                    {p.risk_band} ({Math.round(p.overall_risk)})
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Alerts Results */}
          {matchedAlerts.length > 0 && (
            <div className="py-1">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#98A2B3]">
                Early Warnings
              </div>
              {matchedAlerts.map((a) => (
                <div
                  key={a.id}
                  onClick={handleSelectAlert}
                  className="px-3 py-2 hover:bg-[#F0F6FB] rounded cursor-pointer transition flex items-center justify-between group"
                >
                  <div className="flex items-center space-x-2.5">
                    <Bell className="w-4 h-4 text-[#C43D3D]" />
                    <div>
                      <div className="text-xs font-medium text-[#17202A]">{a.title}</div>
                      <div className="text-[11px] text-[#667085]">{a.project_code} · {a.message}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
