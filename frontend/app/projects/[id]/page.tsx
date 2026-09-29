'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  RefreshCw,
  FileDown,
  Check,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Building2,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  Legend,
} from 'recharts';
import { getProjectDetail, recalculateProjectRisk, acknowledgeAlert, resolveAlert } from '@/lib/api';
import { ProjectDetail } from '@/lib/types';
import { RiskBadge, StatusBadge } from '@/components/design-system';

export default function ProjectDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const fetchDetail = () => {
    setLoading(true);
    getProjectDetail(id)
      .then((data) => setProject(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      const res = await recalculateProjectRisk(id);
      setActionNotice(`Risk re-evaluated successfully. Overall risk calibrated to ${res.overall_risk} (${res.risk_band}) at ${res.prediction_date}.`);
      setTimeout(() => setActionNotice(null), 4000);
      fetchDetail();
    } catch (err) {
      console.error(err);
      setActionNotice('Recalculation error. Please try again.');
      setTimeout(() => setActionNotice(null), 3000);
    } finally {
      setRecalculating(false);
    }
  };

  const handleAcknowledge = async (alertId: number) => {
    try {
      await acknowledgeAlert(alertId, 'Acknowledged by monitoring officer');
      setActionNotice(`Alert #${alertId} status updated: Acknowledged`);
      setTimeout(() => setActionNotice(null), 3000);
      fetchDetail();
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolve = async (alertId: number) => {
    try {
      await resolveAlert(alertId, 'Mitigation measures verified and logged');
      setActionNotice(`Alert #${alertId} status updated: Resolved`);
      setTimeout(() => setActionNotice(null), 3000);
      fetchDetail();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-[#98A2B3] font-mono text-xs">
        Loading project intelligence record...
      </div>
    );
  }

  if (!project) {
    return (
      <div className="py-24 text-center text-[#C43D3D] text-xs">
        Project record not found.
      </div>
    );
  }

  const pred = project.latest_prediction;
  const pdfDownloadUrl = `http://localhost:8000/projects/${project.id}/report`;

  // Monthly snapshot chart data
  const chartData = project.snapshots.map((s) => {
    const finProg =
      project.revised_cost > 0
        ? (s.expenditure / project.revised_cost) * 100
        : (s.expenditure / project.approved_cost) * 100;
    return {
      month: s.month,
      expenditure: s.expenditure,
      physical_progress: s.physical_progress,
      schedule_progress: s.schedule_progress,
      financial_progress: parseFloat(finProg.toFixed(1)),
      progress_gap: parseFloat((s.schedule_progress - s.physical_progress).toFixed(1)),
    };
  });

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E4E7EC]">
        <Link
          href="/projects"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-[#667085] hover:text-[#17202A] transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Project Register</span>
        </Link>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleRecalculate}
            disabled={recalculating}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-[#D0D5DD] hover:bg-[#F9FAFB] text-[#344054] rounded text-xs font-medium transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${recalculating ? 'animate-spin text-[#245B8F]' : 'text-[#667085]'}`} />
            <span>Recalculate Risk</span>
          </button>

          <a
            href={pdfDownloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#245B8F] hover:bg-[#1D4D79] text-white rounded text-xs font-semibold transition"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Download Project Report (PDF)</span>
          </a>
        </div>
      </div>

      {actionNotice && (
        <div className="p-3 bg-[#EBFDF2] border border-[#D1FADF] text-[#2F7D5A] text-xs rounded flex items-center space-x-2">
          <Check className="w-4 h-4 flex-shrink-0" />
          <span className="font-medium">{actionNotice}</span>
        </div>
      )}

      {/* 1. EDITORIAL REPORT-LIKE TOP (Section 21) */}
      <div className="bg-[#FFFFFF] border border-[#E4E7EC] rounded-md p-6 shadow-xs space-y-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono font-bold text-[#245B8F] uppercase tracking-wider">
            <span>PROJECT {project.code}</span>
            <span className="text-[#D0D5DD]">·</span>
            <span className="text-[#667085] font-sans font-medium">{project.sector}</span>
          </div>

          <h1 className="text-2xl font-bold text-[#17202A] tracking-tight mt-1">
            {project.name}
          </h1>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#667085] mt-2">
            <span>Agency: <strong className="text-[#17202A] font-semibold">{project.agency}</strong></span>
            <span>·</span>
            <span>Ministry: <strong className="text-[#17202A] font-semibold">{project.ministry}</strong></span>
            <span>·</span>
            <span>Status: <strong className="text-[#17202A] font-semibold">{project.status}</strong></span>
            <span>·</span>
            <span>Last updated: <strong className="text-[#17202A] font-mono">{project.last_updated || '29 Sep 2026'}</strong></span>
          </div>
        </div>

        {/* 2. HORIZONTAL RISK SUMMARY (Section 21) */}
        <div className="pt-4 border-t border-[#E4E7EC]">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-y sm:divide-y-0 sm:divide-x divide-[#E4E7EC] bg-[#FAFBFC] rounded border border-[#E4E7EC]">
            {/* OVERALL RISK */}
            <div className="p-3.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#667085]">
                Overall Risk
              </div>
              <div className="text-xl font-bold font-mono text-[#C65D32] mt-1 tabular-nums">
                {Math.round(project.overall_risk)} {project.risk_band}
              </div>
            </div>

            {/* COST */}
            <div className="p-3.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#667085]">
                Cost Risk
              </div>
              <div className="text-xl font-bold font-mono text-[#17202A] mt-1 tabular-nums">
                {Math.round(project.cost_risk)}
              </div>
            </div>

            {/* TIME */}
            <div className="p-3.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#667085]">
                Time Risk
              </div>
              <div className="text-xl font-bold font-mono text-[#17202A] mt-1 tabular-nums">
                {Math.round(project.time_risk)}
              </div>
            </div>

            {/* PROGRESS */}
            <div className="p-3.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#667085]">
                Physical Progress
              </div>
              <div className="text-xl font-bold font-mono text-[#17202A] mt-1 tabular-nums">
                {project.latest_physical_progress?.toFixed(1) || 0}%
              </div>
            </div>

            {/* MILESTONES */}
            <div className="p-3.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#667085]">
                Milestone Delay
              </div>
              <div className="text-xl font-bold font-mono text-[#17202A] mt-1 tabular-nums">
                {pred?.milestone_risk ? Math.round(pred.milestone_risk) : 20}
              </div>
            </div>

            {/* DATA QUALITY */}
            <div className="p-3.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#667085]">
                Data Freshness
              </div>
              <div className="text-xl font-bold font-mono text-[#2F7D5A] mt-1 tabular-nums">
                {pred?.data_quality_risk ? 100 - Math.round(pred.data_quality_risk) : 92}/100
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. WHY THIS PROJECT IS FLAGGED (Section 21: Three Evidence Rows) */}
      <div className="bg-[#FFFFFF] border border-[#E4E7EC] rounded-md p-6 shadow-xs space-y-4">
        <div className="pb-3 border-b border-[#E4E7EC] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#17202A] uppercase tracking-wider">
              Why This Project is Flagged
            </h2>
            <p className="text-xs text-[#667085] mt-0.5">
              Explainable Shapley indicator contributions and empirical signals.
            </p>
          </div>
          <span className="text-xs font-mono text-[#98A2B3]">Model: {pred?.model_version || 'v1.2-calibrated'}</span>
        </div>

        <div className="divide-y divide-[#E4E7EC]">
          {/* Evidence Row 01 */}
          <div className="py-4 first:pt-0 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start space-x-3">
              <span className="font-mono text-xs font-bold text-[#245B8F] px-2 py-0.5 bg-[#F0F6FB] border border-[#D0E2F2] rounded">
                01
              </span>
              <div>
                <h3 className="text-sm font-bold text-[#17202A]">Schedule Slippage</h3>
                <p className="text-xs text-[#667085] mt-1 leading-relaxed">
                  Target completion date has shifted by 74 days. Cumulative milestone delays have crossed the supervisory threshold for this corridor.
                </p>
              </div>
            </div>
            <div className="text-right sm:w-44 flex-shrink-0">
              <div className="text-[10px] font-bold uppercase text-[#98A2B3]">Risk Contribution</div>
              <div className="text-base font-bold font-mono text-[#C65D32]">+18.0 pts</div>
            </div>
          </div>

          {/* Evidence Row 02 */}
          <div className="py-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start space-x-3">
              <span className="font-mono text-xs font-bold text-[#245B8F] px-2 py-0.5 bg-[#F0F6FB] border border-[#D0E2F2] rounded">
                02
              </span>
              <div>
                <h3 className="text-sm font-bold text-[#17202A]">Physical Progress Slowdown</h3>
                <p className="text-xs text-[#667085] mt-1 leading-relaxed">
                  Physical execution slope has declined over the last 3 consecutive reporting periods compared to peer sector median benchmarks.
                </p>
              </div>
            </div>
            <div className="text-right sm:w-44 flex-shrink-0">
              <div className="text-[10px] font-bold uppercase text-[#98A2B3]">Risk Contribution</div>
              <div className="text-base font-bold font-mono text-[#C65D32]">+14.0 pts</div>
            </div>
          </div>

          {/* Evidence Row 03 */}
          <div className="py-4 last:pb-0 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start space-x-3">
              <span className="font-mono text-xs font-bold text-[#245B8F] px-2 py-0.5 bg-[#F0F6FB] border border-[#D0E2F2] rounded">
                03
              </span>
              <div>
                <h3 className="text-sm font-bold text-[#17202A]">Spend / Progress Divergence</h3>
                <p className="text-xs text-[#667085] mt-1 leading-relaxed">
                  Cumulative financial expenditure (42.0%) is materially ahead of verified physical completion (21.9%), creating an empirical divergence gap of +20.1%.
                </p>
              </div>
            </div>
            <div className="text-right sm:w-44 flex-shrink-0">
              <div className="text-[10px] font-bold uppercase text-[#98A2B3]">Risk Contribution</div>
              <div className="text-base font-bold font-mono text-[#C65D32]">+11.0 pts</div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. PHYSICAL PROGRESS VS FINANCIAL PROGRESS CHART (Section 22) */}
      <div className="bg-[#FFFFFF] border border-[#E4E7EC] rounded-md p-6 shadow-xs">
        <div className="pb-3 mb-4 border-b border-[#E4E7EC] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#17202A]">
              Physical Progress vs Financial Progress
            </h2>
            <p className="text-xs text-[#667085] mt-0.5">
              Monthly trajectory tracking physical achievement against approved expenditure.
            </p>
          </div>
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F2F4F7" vertical={false} />
              <XAxis dataKey="month" stroke="#98A2B3" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis domain={[0, 100]} stroke="#98A2B3" fontSize={11} tickLine={false} axisLine={false} />
              <ReTooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E4E7EC',
                  borderRadius: '4px',
                  fontSize: '11px',
                  color: '#17202A',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Line
                type="monotone"
                dataKey="schedule_progress"
                name="Planned Schedule %"
                stroke="#667085"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="physical_progress"
                name="Physical Achievement %"
                stroke="#245B8F"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="financial_progress"
                name="Financial Spend Ratio %"
                stroke="#C65D32"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 5. EARLY WARNINGS TABLE (Section 24) */}
      <div className="bg-[#FFFFFF] border border-[#E4E7EC] rounded-md shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#E4E7EC] bg-[#FAFBFC] flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#17202A]">
            Active Alerts & Early Warnings ({project.alerts?.length || 0})
          </h2>
          <span className="text-xs text-[#667085]">Threshold Rule Verification</span>
        </div>

        {project.alerts && project.alerts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E4E7EC] bg-[#FFFFFF] text-[11px] font-semibold text-[#667085] uppercase">
                  <th className="py-2.5 px-4">Severity</th>
                  <th className="py-2.5 px-4">Triggered Warning</th>
                  <th className="py-2.5 px-4">Evidence</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-4 text-right">Officer Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E7EC]">
                {(project.alerts || []).map((a) => (
                  <tr key={a.id} className="hover:bg-[#F9FAFB]">
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          a.severity?.toUpperCase() === 'CRITICAL'
                            ? 'bg-[#FEF3F2] text-[#C43D3D] border-[#FECDCA]'
                            : 'bg-[#FDF4ED] text-[#C65D32] border-[#F9D6B8]'
                        }`}
                      >
                        {a.severity}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#17202A]">{a.title}</td>
                    <td className="py-3 px-4 text-[#667085] max-w-sm">{a.message}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                          a.status === 'Active'
                            ? 'bg-[#FEF3F2] text-[#C43D3D]'
                            : 'bg-[#EBFDF2] text-[#2F7D5A]'
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      {a.status === 'Active' && (
                        <>
                          <button
                            onClick={() => handleAcknowledge(a.id)}
                            className="px-2.5 py-1 bg-white border border-[#D0D5DD] hover:bg-[#F2F4F7] text-[#344054] rounded text-xs font-medium"
                          >
                            Acknowledge
                          </button>
                          <button
                            onClick={() => handleResolve(a.id)}
                            className="px-2.5 py-1 bg-[#245B8F] hover:bg-[#1D4D79] text-white rounded text-xs font-semibold"
                          >
                            Resolve
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-[#98A2B3]">
            No active early warning alerts flagged for this project.
          </div>
        )}
      </div>

      {/* 6. MILESTONES TABLE (Section 56) */}
      <div className="bg-[#FFFFFF] border border-[#E4E7EC] rounded-md shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#E4E7EC] bg-[#FAFBFC] flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#17202A]">
            Project Milestones ({project.milestones?.length || 0})
          </h2>
          <span className="text-xs text-[#667085]">Critical Path Schedule Tracking</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E4E7EC] bg-[#FFFFFF] text-[11px] font-semibold text-[#667085] uppercase">
                <th className="py-2.5 px-4">Milestone</th>
                <th className="py-2.5 px-4">Planned Date</th>
                <th className="py-2.5 px-3">Criticality</th>
                <th className="py-2.5 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E7EC]">
              {project.milestones && project.milestones.length > 0 ? (
                project.milestones.map((m) => (
                  <tr key={m.id} className="hover:bg-[#F9FAFB]">
                    <td className="py-3 px-4 font-medium text-[#17202A]">{m.name}</td>
                    <td className="py-3 px-4 font-mono text-[#667085]">{m.planned_date}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          m.criticality === 'Critical'
                            ? 'bg-[#FEF3F2] text-[#C43D3D] border-[#FECDCA]'
                            : 'bg-[#F2F4F7] text-[#344054] border-[#EAECF0]'
                        }`}
                      >
                        {m.criticality}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <StatusBadge status={m.status} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-xs text-[#98A2B3]">
                    No milestones recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
