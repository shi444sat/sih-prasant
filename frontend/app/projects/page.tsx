'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, Download, Filter } from 'lucide-react';
import { getProjects } from '@/lib/api';
import { ProjectListItem } from '@/lib/types';
import { PageHeader, RiskBadge, StatusBadge } from '@/components/design-system';

function ProjectsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRisk = searchParams.get('risk') || 'All';
  const initialSearch = searchParams.get('search') || '';

  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [sectorFilter, setSectorFilter] = useState('All');
  const [agencyFilter, setAgencyFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [riskFilter, setRiskFilter] = useState(initialRisk);
  const [sortBy, setSortBy] = useState('overall_risk');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const fetchProjectsList = () => {
    setLoading(true);
    const params: Record<string, string> = {
      sort_by: sortBy,
      sort_order: sortOrder,
    };
    if (searchTerm.trim()) params.search = searchTerm.trim();
    if (sectorFilter !== 'All') params.sector = sectorFilter;
    if (statusFilter !== 'All') params.status = statusFilter;
    if (riskFilter !== 'All') params.risk_level = riskFilter;

    getProjects(params)
      .then((data) => {
        setProjects(data);
        setCurrentPage(1);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProjectsList();
  }, [sectorFilter, statusFilter, riskFilter, sortBy, sortOrder]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProjectsList();
  };

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // Distinct sectors
  const sectors = ['All', 'Road Transport & Highways', 'Railways', 'Power & Renewable Energy', 'Urban Infrastructure & Metro', 'Water Resources & Sanitation'];
  const agencies = ['All', 'NHAI', 'MoRTH', 'RVNL', 'NTPC', 'DMRC', 'CWC'];

  // Filtered by agency in memory if selected
  const filtered = agencyFilter === 'All' ? projects : projects.filter((p) => p.agency === agencyFilter);

  // Pagination calculation
  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginatedProjects = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Projects"
        subtitle="Operational project register, cost metrics, physical completion, and risk indices."
        badgeText={`${filtered.length} Projects`}
        actions={
          <button
            onClick={() => window.print()}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-[#D0D5DD] hover:bg-[#F9FAFB] text-[#344054] rounded text-xs font-medium transition"
          >
            <Download className="w-3.5 h-3.5 text-[#667085]" />
            <span>Export Register</span>
          </button>
        }
      />

      {/* Filter & Search Bar (Section 20) */}
      <div className="bg-[#FFFFFF] border border-[#E4E7EC] rounded-md p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#98A2B3]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by code, project name, or agency..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-[#F7F8FA] border border-[#E4E7EC] rounded text-[#17202A] placeholder-[#98A2B3] focus:outline-none focus:border-[#245B8F]"
          />
        </form>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Sector */}
          <select
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value)}
            className="text-xs bg-[#FFFFFF] border border-[#D0D5DD] text-[#344054] px-2.5 py-1.5 rounded focus:outline-none"
          >
            {sectors.map((s) => (
              <option key={s} value={s}>
                Sector: {s}
              </option>
            ))}
          </select>

          {/* Agency */}
          <select
            value={agencyFilter}
            onChange={(e) => setAgencyFilter(e.target.value)}
            className="text-xs bg-[#FFFFFF] border border-[#D0D5DD] text-[#344054] px-2.5 py-1.5 rounded focus:outline-none"
          >
            {agencies.map((a) => (
              <option key={a} value={a}>
                Agency: {a}
              </option>
            ))}
          </select>

          {/* Risk Level */}
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="text-xs bg-[#FFFFFF] border border-[#D0D5DD] text-[#344054] px-2.5 py-1.5 rounded focus:outline-none"
          >
            <option value="All">Risk: All Levels</option>
            <option value="LOW">Risk: Low</option>
            <option value="MODERATE">Risk: Moderate</option>
            <option value="HIGH">Risk: High</option>
            <option value="CRITICAL">Risk: Critical</option>
          </select>
        </div>
      </div>

      {/* Dense Data Table (Section 20: No Cards, Clean Dense Table) */}
      <div className="bg-[#FFFFFF] border border-[#E4E7EC] rounded-md shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-[#FAFBFC] border-b border-[#E4E7EC] text-[11px] font-semibold text-[#667085] uppercase tracking-wider sticky top-0">
              <tr>
                <th
                  onClick={() => toggleSort('code')}
                  className="py-3 px-4 cursor-pointer hover:text-[#17202A] select-none"
                >
                  <div className="flex items-center space-x-1">
                    <span>Project Code</span>
                    <ArrowUpDown className="w-3 h-3 text-[#98A2B3]" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('name')}
                  className="py-3 px-4 cursor-pointer hover:text-[#17202A] select-none"
                >
                  Project Name
                </th>
                <th className="py-3 px-3">Sector</th>
                <th className="py-3 px-3">Agency</th>
                <th
                  onClick={() => toggleSort('revised_cost')}
                  className="py-3 px-4 text-right cursor-pointer hover:text-[#17202A] select-none"
                >
                  Cost (Cr)
                </th>
                <th
                  onClick={() => toggleSort('latest_physical_progress')}
                  className="py-3 px-4 text-right cursor-pointer hover:text-[#17202A] select-none"
                >
                  Progress
                </th>
                <th
                  onClick={() => toggleSort('overall_risk')}
                  className="py-3 px-4 cursor-pointer hover:text-[#17202A] select-none"
                >
                  <div className="flex items-center space-x-1">
                    <span>Overall Risk</span>
                    <ArrowUpDown className="w-3 h-3 text-[#98A2B3]" />
                  </div>
                </th>
                <th className="py-3 px-4">Primary Signal</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E7EC]">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#98A2B3] font-mono text-xs">
                    Loading project records...
                  </td>
                </tr>
              ) : paginatedProjects.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#98A2B3] text-xs">
                    No projects found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedProjects.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => router.push(`/projects/${p.id}`)}
                    className="hover:bg-[#F9FAFB] cursor-pointer transition"
                  >
                    <td className="py-3 px-4 font-mono font-semibold text-[#245B8F]">
                      {p.code}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-[#17202A] line-clamp-1 max-w-sm">
                        {p.name}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-[#667085]">{p.sector}</td>
                    <td className="py-3 px-3 text-[#667085] font-mono">{p.agency}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-[#17202A]">
                      ₹{Math.round(p.revised_cost || p.approved_cost).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-[#17202A]">
                      {(p.latest_physical_progress || 0).toFixed(1)}%
                    </td>
                    <td className="py-3 px-4">
                      <RiskBadge band={p.risk_band} score={p.overall_risk} />
                    </td>
                    <td className="py-3 px-4 text-[#344054] line-clamp-1">
                      {p.top_driver || 'Routine schedule monitoring'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-xs font-semibold text-[#245B8F] hover:underline">
                        Open →
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-3.5 border-t border-[#E4E7EC] bg-[#FAFBFC] flex items-center justify-between text-xs text-[#667085]">
          <div>
            Showing <span className="font-semibold text-[#17202A]">{(currentPage - 1) * pageSize + 1}</span> to{' '}
            <span className="font-semibold text-[#17202A]">
              {Math.min(currentPage * pageSize, filtered.length)}
            </span>{' '}
            of <span className="font-semibold text-[#17202A]">{filtered.length}</span> projects
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded border border-[#D0D5DD] bg-white hover:bg-[#F9FAFB] disabled:opacity-40 disabled:hover:bg-white text-[#344054]"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-mono text-xs font-medium text-[#17202A]">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded border border-[#D0D5DD] bg-white hover:bg-[#F9FAFB] disabled:opacity-40 disabled:hover:bg-white text-[#344054]"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-[#98A2B3] text-xs">Loading Projects Register...</div>}>
      <ProjectsContent />
    </Suspense>
  );
}
