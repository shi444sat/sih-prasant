'use client';

import React, { useState, useEffect } from 'react';
import { getBenchmarks, getProjects } from '@/lib/api';
import { ProjectListItem } from '@/lib/types';
import { PageHeader, RiskBadge } from '@/components/design-system';

export default function BenchmarkingPage() {
  const [benchmarks, setBenchmarks] = useState<any>(null);
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProjects({ limit: '100' })
      .then((data) => {
        setProjects(data);
        if (data.length > 0) {
          const p1042 = data.find((p) => p.code === 'P-1042') || data[0];
          setSelectedProjectId(p1042.id.toString());
        }
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    if (!selectedProjectId) return;
    setLoading(true);
    getBenchmarks({ selected_project_id: selectedProjectId })
      .then((data) => setBenchmarks(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [selectedProjectId]);

  const selectedProj = projects.find((p) => p.id.toString() === selectedProjectId);

  // Comparison Metrics: Project, Sector Median, Agency Average, Peer Median
  const metricsComparison = [
    {
      title: 'Physical Progress (%)',
      projectVal: selectedProj?.latest_physical_progress || 21.9,
      sectorVal: 48.5,
      agencyVal: 52.0,
      peerVal: 44.0,
      max: 100,
      unit: '%',
    },
    {
      title: 'Overall Risk Score (0-100)',
      projectVal: selectedProj?.overall_risk || 76.0,
      sectorVal: 54.0,
      agencyVal: 49.5,
      peerVal: 52.0,
      max: 100,
      unit: ' pts',
    },
    {
      title: 'Cost Overrun Risk (0-100)',
      projectVal: selectedProj?.cost_risk || 71.0,
      sectorVal: 42.0,
      agencyVal: 45.0,
      peerVal: 40.0,
      max: 100,
      unit: ' pts',
    },
    {
      title: 'Schedule Slippage (Days)',
      projectVal: 74,
      sectorVal: 38,
      agencyVal: 42,
      peerVal: 45,
      max: 120,
      unit: ' days',
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Benchmarking"
        subtitle="Empirical comparison of project execution rates against sector medians, agency averages, and statistical peer cohorts."
        badgeText="Cohort Analysis"
      />

      {/* Project Selector Bar (Section 26) */}
      <div className="bg-[#FFFFFF] border border-[#E4E7EC] rounded-md p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <label className="text-xs font-semibold text-[#17202A] uppercase tracking-wider">
            Selected Project:
          </label>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="text-xs font-mono font-medium bg-[#F7F8FA] border border-[#E4E7EC] text-[#17202A] px-3 py-1.5 rounded focus:outline-none focus:border-[#245B8F]"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id.toString()}>
                {p.code} — {p.name} ({p.sector})
              </option>
            ))}
          </select>
        </div>

        {selectedProj && (
          <div className="flex items-center space-x-3 text-xs">
            <span className="text-[#667085]">{selectedProj.agency} · {selectedProj.sector}</span>
            <RiskBadge band={selectedProj.risk_band} score={selectedProj.overall_risk} />
          </div>
        )}
      </div>

      {/* Horizontal Bar Comparison Cards (Section 26) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {metricsComparison.map((m) => (
          <div key={m.title} className="bg-[#FFFFFF] border border-[#E4E7EC] rounded-md p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E4E7EC]">
              <h3 className="text-sm font-bold text-[#17202A]">{m.title}</h3>
              <span className="text-xs font-mono font-semibold text-[#245B8F]">
                Project: {m.projectVal}{m.unit}
              </span>
            </div>

            {/* Horizontal Bar Stack */}
            <div className="space-y-3 text-xs">
              {/* Selected Project */}
              <div className="space-y-1">
                <div className="flex justify-between font-medium">
                  <span className="font-semibold text-[#17202A]">Selected Project ({selectedProj?.code || 'Target'})</span>
                  <span className="font-mono text-[#C65D32] font-bold tabular-nums">{m.projectVal}{m.unit}</span>
                </div>
                <div className="w-full h-2.5 bg-[#F2F4F7] rounded-xs overflow-hidden">
                  <div className="h-full bg-[#C65D32]" style={{ width: `${Math.min(100, (m.projectVal / m.max) * 100)}%` }} />
                </div>
              </div>

              {/* Sector Median */}
              <div className="space-y-1">
                <div className="flex justify-between text-[#667085]">
                  <span>Sector Median ({selectedProj?.sector || 'Transport'})</span>
                  <span className="font-mono tabular-nums">{m.sectorVal}{m.unit}</span>
                </div>
                <div className="w-full h-2.5 bg-[#F2F4F7] rounded-xs overflow-hidden">
                  <div className="h-full bg-[#245B8F]" style={{ width: `${Math.min(100, (m.sectorVal / m.max) * 100)}%` }} />
                </div>
              </div>

              {/* Agency Average */}
              <div className="space-y-1">
                <div className="flex justify-between text-[#667085]">
                  <span>Agency Average ({selectedProj?.agency || 'NHAI'})</span>
                  <span className="font-mono tabular-nums">{m.agencyVal}{m.unit}</span>
                </div>
                <div className="w-full h-2.5 bg-[#F2F4F7] rounded-xs overflow-hidden">
                  <div className="h-full bg-[#667085]" style={{ width: `${Math.min(100, (m.agencyVal / m.max) * 100)}%` }} />
                </div>
              </div>

              {/* Peer Cohort Median */}
              <div className="space-y-1">
                <div className="flex justify-between text-[#667085]">
                  <span>Statistical Peer Cohort Median</span>
                  <span className="font-mono tabular-nums">{m.peerVal}{m.unit}</span>
                </div>
                <div className="w-full h-2.5 bg-[#F2F4F7] rounded-xs overflow-hidden">
                  <div className="h-full bg-[#98A2B3]" style={{ width: `${Math.min(100, (m.peerVal / m.max) * 100)}%` }} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
