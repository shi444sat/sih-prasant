'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileDown, Search, ArrowRight } from 'lucide-react';
import { getProjects } from '@/lib/api';
import { ProjectListItem } from '@/lib/types';
import { PageHeader, RiskBadge } from '@/components/design-system';

export default function ReportsPage() {
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sectorFilter, setSectorFilter] = useState('All');

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = { limit: '150' };
    if (sectorFilter !== 'All') params.sector = sectorFilter;
    if (search.trim()) params.search = search.trim();

    getProjects(params)
      .then((data) => setProjects(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [sectorFilter, search]);

  const sectorsList = [
    'All',
    'Road Transport & Highways',
    'Railways',
    'Power & Renewable Energy',
    'Urban Infrastructure & Metro',
    'Water Resources & Sanitation',
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        subtitle="Executive audit dossiers compiled directly from live database indicators. Generated as formatted PDF reports."
        badgeText={`${projects.length} Available Dossiers`}
      />

      {/* Filter and Search Bar */}
      <div className="bg-[#FFFFFF] border border-[#E4E7EC] rounded-md p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-3.5 h-3.5 text-[#98A2B3] absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search dossiers by project code or title..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#F7F8FA] border border-[#E4E7EC] rounded text-[#17202A] placeholder-[#98A2B3] focus:outline-none focus:border-[#245B8F]"
          />
        </div>

        <select
          value={sectorFilter}
          onChange={(e) => setSectorFilter(e.target.value)}
          className="text-xs bg-[#FFFFFF] border border-[#D0D5DD] text-[#344054] px-2.5 py-1.5 rounded focus:outline-none"
        >
          {sectorsList.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Dossiers Table */}
      <div className="bg-[#FFFFFF] border border-[#E4E7EC] rounded-md shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-[#FAFBFC] border-b border-[#E4E7EC] text-[11px] font-semibold text-[#667085] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4">Sector</th>
                <th className="py-3 px-3">Agency</th>
                <th className="py-3 px-3">Risk Level</th>
                <th className="py-3 px-4 text-right">Physical / Cost</th>
                <th className="py-3 px-4 text-right">Generate & Download</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E7EC]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#98A2B3] font-mono text-xs">
                    Loading project dossiers...
                  </td>
                </tr>
              ) : projects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#98A2B3] text-xs">
                    No dossiers found matching filter criteria.
                  </td>
                </tr>
              ) : (
                projects.map((p) => (
                  <tr key={p.id} className="hover:bg-[#F9FAFB] transition">
                    <td className="py-3 px-4">
                      <div className="font-mono font-semibold text-[#245B8F]">{p.code}</div>
                      <div className="font-medium text-[#17202A] line-clamp-1 max-w-sm">{p.name}</div>
                    </td>
                    <td className="py-3 px-4 text-[#667085]">{p.sector}</td>
                    <td className="py-3 px-3 text-[#667085] font-mono">{p.agency}</td>
                    <td className="py-3 px-3">
                      <RiskBadge band={p.risk_band} score={p.overall_risk} />
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-[#17202A] tabular-nums">
                      {(p.latest_physical_progress || 0).toFixed(1)}% · ₹{Math.round(p.revised_cost || p.approved_cost).toLocaleString()} Cr
                    </td>
                    <td className="py-3 px-4 text-right">
                      <a
                        href={`http://localhost:8000/projects/${p.id}/report`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1 px-3 py-1.5 bg-[#245B8F] hover:bg-[#1D4D79] text-white rounded text-xs font-semibold transition"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                        <span>Download PDF</span>
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
