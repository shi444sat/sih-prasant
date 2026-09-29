'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Search,
  Check,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { getAlerts, acknowledgeAlert, resolveAlert } from '@/lib/api';
import { AlertItem } from '@/lib/types';
import { PageHeader } from '@/components/design-system';

export default function AlertsPage() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MODERATE' | 'ACKNOWLEDGED' | 'RESOLVED'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchAlertsList = () => {
    setLoading(true);
    const params: Record<string, string> = {};

    if (filterTab === 'CRITICAL') params.severity = 'Critical';
    else if (filterTab === 'HIGH') params.severity = 'High';
    else if (filterTab === 'MODERATE') params.severity = 'Moderate';
    else if (filterTab === 'ACKNOWLEDGED') params.status = 'Acknowledged';
    else if (filterTab === 'RESOLVED') params.status = 'Resolved';

    if (searchTerm.trim()) params.search = searchTerm.trim();

    getAlerts(params)
      .then((data) => setAlerts(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAlertsList();
  }, [filterTab, searchTerm]);

  const handleAcknowledge = async (id: number) => {
    try {
      await acknowledgeAlert(id, 'Logged receipt and verified by monitoring officer');
      setActionSuccess(`Alert #${id} status updated: Acknowledged`);
      setTimeout(() => setActionSuccess(null), 3000);
      fetchAlertsList();
    } catch (err: any) {
      alert(err.message || 'Action failed');
    }
  };

  const handleResolve = async (id: number) => {
    try {
      await resolveAlert(id, 'Mitigation measures verified on site');
      setActionSuccess(`Alert #${id} status updated: Resolved`);
      setTimeout(() => setActionSuccess(null), 3000);
      fetchAlertsList();
    } catch (err: any) {
      alert(err.message || 'Action failed');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Early Warnings"
        subtitle="Automated threshold-based alert queue for emerging schedule and cost risks."
        badgeText={`${alerts.length} Early Warnings`}
      />

      {actionSuccess && (
        <div className="p-3 bg-[#EBFDF2] border border-[#D1FADF] text-[#2F7D5A] text-xs rounded flex items-center space-x-2">
          <Check className="w-4 h-4 flex-shrink-0" />
          <span className="font-medium">{actionSuccess}</span>
        </div>
      )}

      {/* Filter Tabs & Search Bar (Section 24) */}
      <div className="bg-[#FFFFFF] border border-[#E4E7EC] rounded-md p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Filter Tabs */}
        <div className="flex items-center space-x-1 bg-[#F7F8FA] p-0.5 rounded border border-[#E4E7EC] text-xs">
          {(['ALL', 'CRITICAL', 'HIGH', 'MODERATE', 'ACKNOWLEDGED', 'RESOLVED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterTab(tab)}
              className={`px-3 py-1 rounded text-xs font-medium capitalize transition ${
                filterTab === tab
                  ? 'bg-[#FFFFFF] text-[#245B8F] shadow-xs font-semibold'
                  : 'text-[#667085] hover:text-[#17202A]'
              }`}
            >
              {tab.toLowerCase()}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#98A2B3]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search alerts by code or text..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#F7F8FA] border border-[#E4E7EC] rounded text-[#17202A] placeholder-[#98A2B3] focus:outline-none focus:border-[#245B8F]"
          />
        </div>
      </div>

      {/* Operational Alerts Table (Section 24) */}
      <div className="bg-[#FFFFFF] border border-[#E4E7EC] rounded-md shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-[#FAFBFC] border-b border-[#E4E7EC] text-[11px] font-semibold text-[#667085] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4">Signal</th>
                <th className="py-3 px-4">Evidence</th>
                <th className="py-3 px-3">Detected</th>
                <th className="py-3 px-3">Owner</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E7EC]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#98A2B3] font-mono text-xs">
                    Loading early warnings...
                  </td>
                </tr>
              ) : alerts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#98A2B3] text-xs">
                    No alerts found matching current filters.
                  </td>
                </tr>
              ) : (
                alerts.map((a) => (
                  <tr key={a.id} className="hover:bg-[#F9FAFB] transition">
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          a.severity?.toUpperCase() === 'CRITICAL'
                            ? 'bg-[#FEF3F2] text-[#C43D3D] border-[#FECDCA]'
                            : a.severity?.toUpperCase() === 'HIGH'
                            ? 'bg-[#FDF4ED] text-[#C65D32] border-[#F9D6B8]'
                            : 'bg-[#FEF9EE] text-[#B7791F] border-[#FCE4A6]'
                        }`}
                      >
                        {a.severity}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        href={`/projects/${a.project_id}`}
                        className="font-mono font-semibold text-[#245B8F] hover:underline"
                      >
                        {a.project_code || 'P-1042'}
                      </Link>
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#17202A] max-w-xs">
                      {a.title}
                    </td>
                    <td className="py-3 px-4 text-[#667085] max-w-sm line-clamp-2">
                      {a.message}
                    </td>
                    <td className="py-3 px-3 text-[#98A2B3] font-mono text-[11px]">
                      {a.created_at?.split('T')[0] || '2026-09-29'}
                    </td>
                    <td className="py-3 px-3 text-[#667085]">{a.owner || 'DIID Desk'}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                          a.status === 'Active'
                            ? 'bg-[#FEF3F2] text-[#C43D3D]'
                            : a.status === 'Acknowledged'
                            ? 'bg-[#FEF9EE] text-[#B7791F]'
                            : 'bg-[#EBFDF2] text-[#2F7D5A]'
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5">
                      {a.status === 'Active' ? (
                        <>
                          <button
                            onClick={() => handleAcknowledge(a.id)}
                            className="px-2 py-1 bg-white border border-[#D0D5DD] hover:bg-[#F2F4F7] text-[#344054] rounded text-xs font-medium"
                          >
                            Acknowledge
                          </button>
                          <button
                            onClick={() => handleResolve(a.id)}
                            className="px-2 py-1 bg-[#245B8F] hover:bg-[#1D4D79] text-white rounded text-xs font-semibold"
                          >
                            Resolve
                          </button>
                        </>
                      ) : a.status === 'Acknowledged' ? (
                        <button
                          onClick={() => handleResolve(a.id)}
                          className="px-2 py-1 bg-[#245B8F] hover:bg-[#1D4D79] text-white rounded text-xs font-semibold"
                        >
                          Resolve
                        </button>
                      ) : (
                        <span className="text-[#98A2B3] text-xs">Logged</span>
                      )}
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
