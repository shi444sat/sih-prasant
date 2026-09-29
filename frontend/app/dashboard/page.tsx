'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Download,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Clock,
  Play,
  Pause,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  BarChart,
  Bar,
} from 'recharts';
import { useAppContext, SimulationScenario } from '@/context/AppContext';
import { PageHeader, MetricStrip, MetricItem, RiskBadge } from '@/components/design-system';

export default function DashboardPage() {
  const router = useRouter();
  const {
    projects,
    dashboardSummary,
    alerts,
    loading,
    simulation,
    startSimulation,
    pauseSimulation,
    resumeSimulation,
    stepSimulationForward,
    resetSimulation,
    setSimulationMonth,
  } = useAppContext();

  // Active Portfolio Trend Tab: 'risk' | 'progress' | 'cost'
  const [trendMetric, setTrendMetric] = useState<'risk' | 'progress' | 'cost'>('risk');
  const [timeRange, setTimeRange] = useState<'6M' | '12M' | '24M'>('6M');

  // Simulation drawer toggle
  const [showSimMode, setShowSimMode] = useState(false);

  // Distribution calculation
  const totalCount = projects.length || 63;
  const lowCount = projects.filter((p) => p.overall_risk < 40).length;
  const modCount = projects.filter((p) => p.overall_risk >= 40 && p.overall_risk < 65).length;
  const highCount = projects.filter((p) => p.overall_risk >= 65 && p.overall_risk < 80).length;
  const critCount = projects.filter((p) => p.overall_risk >= 80).length;

  const lowPct = Math.round((lowCount / totalCount) * 100);
  const modPct = Math.round((modCount / totalCount) * 100);
  const highPct = Math.round((highCount / totalCount) * 100);
  const critPct = Math.round((critCount / totalCount) * 100);

  // Projects Requiring Attention (Section 18)
  const attentionProjects = useMemo(() => {
    return [...projects]
      .sort((a, b) => b.overall_risk - a.overall_risk)
      .slice(0, 7)
      .map((p, idx) => ({
        ...p,
        change: idx === 0 ? '+15' : idx === 1 ? '+12' : idx === 2 ? '+9' : idx === 3 ? '+7' : '+4',
        signal: p.top_driver || (idx % 2 === 0 ? 'Schedule slippage' : 'Spend/progress divergence'),
        updated: '29 Sep',
      }));
  }, [projects]);

  // Clean Trend Data
  const trendHistory = [
    { month: 'Apr', risk: 54, progress: 41, cost: 38 },
    { month: 'May', risk: 57, progress: 45, cost: 43 },
    { month: 'Jun', risk: 61, progress: 48, cost: 49 },
    { month: 'Jul', risk: 66, progress: 51, cost: 55 },
    { month: 'Aug', risk: 70, progress: 54, cost: 62 },
    { month: 'Sep', risk: simulation.isActive ? simulation.currentRisk : 74, progress: 56, cost: 68 },
  ];

  // Sector benchmark data (Section 15, Section 3)
  const sectorBenchmark = [
    { sector: 'Road Transport', delayDays: 78, riskScore: 71 },
    { sector: 'Railways', delayDays: 64, riskScore: 68 },
    { sector: 'Urban Metro', delayDays: 48, riskScore: 59 },
    { sector: 'Power & Energy', delayDays: 32, riskScore: 51 },
    { sector: 'Water Resources', delayDays: 28, riskScore: 46 },
  ];

  // Frequent risk drivers
  const frequentDrivers = [
    { driver: 'Land Acquisition & ROW Delay', frequency: '42% of flagged projects', impact: '+16.4 pts avg' },
    { driver: 'Spend Outpacing Physical Delivery', frequency: '31% of flagged projects', impact: '+14.1 pts avg' },
    { driver: 'Critical Milestone Schedule Lag', frequency: '28% of flagged projects', impact: '+12.8 pts avg' },
    { driver: 'Contractor Physical Execution Slowdown', frequency: '22% of flagged projects', impact: '+10.2 pts avg' },
  ];

  const handleExportSummary = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* 1. Header (Section 14) */}
      <PageHeader
        title="Infrastructure Project Overview"
        subtitle="Portfolio monitoring, emerging risk and early-warning signals."
        badgeText="Operational Intelligence"
        actions={
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowSimMode(!showSimMode)}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-medium border transition ${
                showSimMode
                  ? 'bg-[#245B8F] text-white border-[#245B8F]'
                  : 'bg-white text-[#344054] border-[#D0D5DD] hover:bg-[#F9FAFB]'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Simulation Mode</span>
            </button>

            <button
              onClick={handleExportSummary}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-[#D0D5DD] hover:bg-[#F9FAFB] text-[#344054] rounded text-xs font-medium transition"
            >
              <Download className="w-3.5 h-3.5 text-[#667085]" />
              <span>Export Report</span>
            </button>
          </div>
        }
      />

      {/* Simulation Controls Banner (Section 42 & 43 - Normal Clean UI, No 3D) */}
      {showSimMode && (
        <div className="p-4 bg-[#FFFFFF] border border-[#D0E2F2] rounded-md shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <span className="text-[11px] font-bold text-[#245B8F] uppercase tracking-wider">
              SIMULATION MODE
            </span>
            <select
              value={simulation.scenario}
              onChange={(e) => startSimulation(e.target.value as SimulationScenario)}
              className="bg-[#F7F8FA] border border-[#E4E7EC] text-xs text-[#17202A] px-2.5 py-1.5 rounded focus:outline-none focus:border-[#245B8F]"
            >
              <option value="SCHEDULE_DELAY">Scenario: Schedule Delay (P-1042)</option>
              <option value="COST_ESCALATION">Scenario: Cost Escalation (P-1057)</option>
              <option value="MILESTONE_FAILURE">Scenario: Milestone Failure (P-1071)</option>
              <option value="PROGRESS_STAGNATION">Scenario: Progress Stagnation</option>
              <option value="MULTI_RISK">Scenario: Multi-Risk Compound Delay</option>
              <option value="HEALTHY">Scenario: Healthy Operational Baseline</option>
            </select>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <button
                onClick={resetSimulation}
                className="p-1.5 text-[#667085] hover:text-[#17202A] hover:bg-[#F2F4F7] rounded"
                title="Reset"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              {simulation.isPlaying ? (
                <button
                  onClick={pauseSimulation}
                  className="px-3 py-1 bg-[#B7791F] text-white rounded text-xs font-medium flex items-center space-x-1"
                >
                  <Pause className="w-3 h-3 fill-current" />
                  <span>Pause</span>
                </button>
              ) : (
                <button
                  onClick={resumeSimulation}
                  className="px-3 py-1 bg-[#245B8F] text-white rounded text-xs font-medium flex items-center space-x-1"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Play</span>
                </button>
              )}

              <button
                onClick={stepSimulationForward}
                className="p-1.5 text-[#667085] hover:text-[#17202A] hover:bg-[#F2F4F7] rounded"
                title="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center space-x-2 text-xs font-mono text-[#344054]">
              <span>Month {simulation.month.toString().padStart(2, '0')} / 12</span>
              <input
                type="range"
                min="1"
                max="12"
                value={simulation.month}
                onChange={(e) => setSimulationMonth(parseInt(e.target.value, 10))}
                className="w-28 h-1.5 bg-[#E4E7EC] rounded appearance-none cursor-pointer accent-[#245B8F]"
              />
            </div>

            {simulation.riskDelta !== 0 && (
              <span className={`text-xs font-mono font-bold ${simulation.riskDelta > 0 ? 'text-[#C65D32]' : 'text-[#2F7D5A]'}`}>
                {simulation.riskDelta > 0 ? `↑ +${simulation.riskDelta}` : `↓ ${simulation.riskDelta}`} pts
              </span>
            )}
          </div>
        </div>
      )}

      {/* 2. KPI ROW (Section 14: Single horizontal metric section with subtle vertical dividers) */}
      <MetricStrip>
        <MetricItem
          label="Total Projects"
          value={totalCount}
          secondary="Central sector portfolio"
          href="/projects"
        />
        <MetricItem
          label="High / Critical"
          value={highCount + critCount}
          secondary="Demand executive review"
          tone="critical"
          href="/risk-heatmap?filter=high"
        />
        <MetricItem
          label="Cost Risk"
          value={63}
          secondary="Average index across active"
          tone="highRisk"
          href="/analytics?tab=cost"
        />
        <MetricItem
          label="Time Risk"
          value={58}
          secondary="Average schedule slippage"
          tone="default"
          href="/analytics?tab=schedule"
        />
        <MetricItem
          label="Active Alerts"
          value={alerts.length || 7}
          secondary="Awaiting officer response"
          tone="critical"
          href="/alerts"
        />
      </MetricStrip>

      {/* 3. SECTION 1: 12-Column Grid — Risk Distribution (6 cols) & Portfolio Trend (6 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Risk Distribution (6 Columns - Section 16) */}
        <div className="lg:col-span-6 bg-[#FFFFFF] border border-[#E4E7EC] rounded-md p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E4E7EC]">
              <div>
                <h2 className="text-sm font-bold text-[#17202A] tracking-tight">
                  Risk Distribution
                </h2>
                <p className="text-xs text-[#667085] mt-0.5">
                  Portfolio breakdown across operational risk envelopes. Click to filter.
                </p>
              </div>
              <span className="text-xs font-mono text-[#98A2B3]">{totalCount} Assets</span>
            </div>

            {/* Horizontal Distribution Bars (Section 16) */}
            <div className="space-y-4">
              {/* LOW */}
              <div
                onClick={() => router.push('/projects?risk=LOW')}
                className="group cursor-pointer p-2 rounded hover:bg-[#F9FAFB] transition"
              >
                <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                  <span className="text-[#2F7D5A] font-semibold flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#2F7D5A]" />
                    <span>LOW</span>
                  </span>
                  <span className="text-[#667085] font-mono tabular-nums">
                    {lowCount} projects ({lowPct}%)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-[#F2F4F7] rounded-sm overflow-hidden">
                  <div
                    className="h-full bg-[#2F7D5A] transition-all duration-300"
                    style={{ width: `${lowPct}%` }}
                  />
                </div>
              </div>

              {/* MODERATE */}
              <div
                onClick={() => router.push('/projects?risk=MODERATE')}
                className="group cursor-pointer p-2 rounded hover:bg-[#F9FAFB] transition"
              >
                <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                  <span className="text-[#B7791F] font-semibold flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#B7791F]" />
                    <span>MODERATE</span>
                  </span>
                  <span className="text-[#667085] font-mono tabular-nums">
                    {modCount} projects ({modPct}%)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-[#F2F4F7] rounded-sm overflow-hidden">
                  <div
                    className="h-full bg-[#B7791F] transition-all duration-300"
                    style={{ width: `${modPct}%` }}
                  />
                </div>
              </div>

              {/* HIGH */}
              <div
                onClick={() => router.push('/projects?risk=HIGH')}
                className="group cursor-pointer p-2 rounded hover:bg-[#F9FAFB] transition"
              >
                <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                  <span className="text-[#C65D32] font-semibold flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#C65D32]" />
                    <span>HIGH</span>
                  </span>
                  <span className="text-[#667085] font-mono tabular-nums">
                    {highCount} projects ({highPct}%)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-[#F2F4F7] rounded-sm overflow-hidden">
                  <div
                    className="h-full bg-[#C65D32] transition-all duration-300"
                    style={{ width: `${highPct}%` }}
                  />
                </div>
              </div>

              {/* CRITICAL */}
              <div
                onClick={() => router.push('/projects?risk=CRITICAL')}
                className="group cursor-pointer p-2 rounded hover:bg-[#F9FAFB] transition"
              >
                <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                  <span className="text-[#C43D3D] font-semibold flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#C43D3D]" />
                    <span>CRITICAL</span>
                  </span>
                  <span className="text-[#667085] font-mono tabular-nums">
                    {critCount} projects ({critPct}%)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-[#F2F4F7] rounded-sm overflow-hidden">
                  <div
                    className="h-full bg-[#C43D3D] transition-all duration-300"
                    style={{ width: `${critPct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#E4E7EC] mt-4 flex items-center justify-between text-xs text-[#667085]">
            <span>Click any risk band to inspect in Project Register</span>
            <Link href="/risk-heatmap" className="font-semibold text-[#245B8F] hover:underline flex items-center space-x-1">
              <span>Quadrant Matrix</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Portfolio Trend (6 Columns - Section 17) */}
        <div className="lg:col-span-6 bg-[#FFFFFF] border border-[#E4E7EC] rounded-md p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-[#E4E7EC] gap-2">
              <div>
                <h2 className="text-sm font-bold text-[#17202A] tracking-tight">
                  Portfolio Trend
                </h2>
                <p className="text-xs text-[#667085] mt-0.5">
                  Historical progression of key project indicators.
                </p>
              </div>

              {/* Tabs: Risk, Progress, Cost (Section 17) */}
              <div className="flex items-center space-x-1 bg-[#F7F8FA] p-0.5 rounded border border-[#E4E7EC] text-xs">
                {(['risk', 'progress', 'cost'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setTrendMetric(tab)}
                    className={`px-2.5 py-1 rounded font-medium capitalize transition ${
                      trendMetric === tab
                        ? 'bg-[#FFFFFF] text-[#245B8F] shadow-xs font-semibold'
                        : 'text-[#667085] hover:text-[#17202A]'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Time range selection */}
            <div className="flex items-center justify-end space-x-1 mb-2">
              {(['6M', '12M', '24M'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={`px-2 py-0.5 text-[10px] font-mono rounded ${
                    timeRange === r ? 'bg-[#E4E7EC] text-[#17202A] font-bold' : 'text-[#667085] hover:text-[#17202A]'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {/* Clean Line Chart */}
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F2F4F7" vertical={false} />
                  <XAxis dataKey="month" stroke="#98A2B3" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis domain={[30, 90]} stroke="#98A2B3" fontSize={11} tickLine={false} axisLine={false} />
                  <ReTooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E4E7EC',
                      borderRadius: '4px',
                      fontSize: '11px',
                      color: '#17202A',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey={trendMetric}
                    stroke={
                      trendMetric === 'risk'
                        ? '#C65D32'
                        : trendMetric === 'progress'
                        ? '#245B8F'
                        : '#B7791F'
                    }
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#FFFFFF', strokeWidth: 2 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-3 border-t border-[#E4E7EC] mt-3 flex items-center justify-between text-xs text-[#667085]">
            <span className="font-mono text-[11px]">
              {trendMetric === 'risk' && 'Average portfolio risk increased +20.0 pts over 6 months'}
              {trendMetric === 'progress' && 'Physical milestone delivery pace plateaued at 56%'}
              {trendMetric === 'cost' && 'Expenditure burn rate outpaced physical progress by 12%'}
            </span>
            <Link href="/analytics" className="font-semibold text-[#245B8F] hover:underline flex items-center space-x-1">
              <span>Deep Dive</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* 4. SECTION 2: 12-Column Grid — Projects Requiring Attention (8 cols) & Recent Alerts (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Projects Requiring Attention (8 Columns - Section 18: Visual Centerpiece) */}
        <div className="lg:col-span-8 bg-[#FFFFFF] border border-[#E4E7EC] rounded-md shadow-xs overflow-hidden">
          <div className="p-4 border-b border-[#E4E7EC] flex items-center justify-between bg-[#FAFBFC]">
            <div>
              <h2 className="text-sm font-bold text-[#17202A] tracking-tight">
                Projects Requiring Attention
              </h2>
              <p className="text-xs text-[#667085] mt-0.5">
                Projects with emerging cost, schedule or implementation risk.
              </p>
            </div>
            <Link
              href="/projects"
              className="text-xs font-semibold text-[#245B8F] hover:underline flex items-center space-x-1"
            >
              <span>View all projects</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E4E7EC] bg-[#FFFFFF] text-[11px] font-semibold text-[#667085] uppercase tracking-wider">
                  <th className="py-2.5 px-4">Project</th>
                  <th className="py-2.5 px-3">Sector</th>
                  <th className="py-2.5 px-3">Agency</th>
                  <th className="py-2.5 px-3">Risk</th>
                  <th className="py-2.5 px-3">Change</th>
                  <th className="py-2.5 px-3">Primary Signal</th>
                  <th className="py-2.5 px-4 text-right">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E7EC]">
                {attentionProjects.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => router.push(`/projects/${p.id}`)}
                    className="hover:bg-[#F9FAFB] cursor-pointer transition"
                  >
                    <td className="py-3 px-4">
                      <div className="font-mono font-semibold text-[#245B8F]">{p.code}</div>
                      <div className="text-[#17202A] font-medium line-clamp-1 max-w-xs">{p.name}</div>
                    </td>
                    <td className="py-3 px-3 text-[#667085]">{p.sector}</td>
                    <td className="py-3 px-3 text-[#667085] font-mono">{p.agency}</td>
                    <td className="py-3 px-3">
                      <RiskBadge band={p.risk_band} score={p.overall_risk} />
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-[#C65D32] tabular-nums">
                      ↑ {p.change}
                    </td>
                    <td className="py-3 px-3 text-[#344054] line-clamp-1">{p.signal}</td>
                    <td className="py-3 px-4 text-right font-mono text-[#98A2B3]">{p.updated}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Alerts (4 Columns - Section 19: Clean List, Not Giant Cards) */}
        <div className="lg:col-span-4 bg-[#FFFFFF] border border-[#E4E7EC] rounded-md shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E4E7EC]">
              <div>
                <h2 className="text-sm font-bold text-[#17202A] tracking-tight">
                  Recent Alerts
                </h2>
                <p className="text-xs text-[#667085] mt-0.5">
                  Early-warning signals requiring verification.
                </p>
              </div>
              <Link href="/alerts" className="text-xs font-semibold text-[#245B8F] hover:underline">
                All Alerts
              </Link>
            </div>

            <div className="divide-y divide-[#F2F4F7]">
              {alerts.slice(0, 5).map((a, i) => (
                <div
                  key={a.id || i}
                  onClick={() => router.push('/alerts')}
                  className="py-3 hover:bg-[#F9FAFB] cursor-pointer transition first:pt-0"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                        a.severity?.toUpperCase() === 'CRITICAL'
                          ? 'bg-[#FEF3F2] text-[#C43D3D] border-[#FECDCA]'
                          : a.severity?.toUpperCase() === 'HIGH'
                          ? 'bg-[#FDF4ED] text-[#C65D32] border-[#F9D6B8]'
                          : 'bg-[#FEF9EE] text-[#B7791F] border-[#FCE4A6]'
                      }`}
                    >
                      {a.severity}
                    </span>
                    <span className="text-[10px] text-[#98A2B3] font-mono">
                      {i === 0 ? '10 min ago' : i === 1 ? '32 min ago' : i === 2 ? '1 hr ago' : '3 hr ago'}
                    </span>
                  </div>

                  <div className="text-xs font-semibold text-[#17202A] line-clamp-1">
                    {a.title}
                  </div>
                  <div className="text-[11px] text-[#667085] mt-0.5 flex items-center space-x-1.5">
                    <span className="font-mono text-[#245B8F] font-semibold">{a.project_code || 'P-1042'}</span>
                    <span className="text-[#D0D5DD]">·</span>
                    <span className="truncate">{a.message}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-[#E4E7EC] mt-3">
            <Link
              href="/alerts"
              className="text-xs font-semibold text-[#245B8F] hover:underline flex items-center justify-between"
            >
              <span>Manage Alert Queue ({alerts.length} active)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* 5. SECTION 3: 12-Column Grid — Sector Benchmark (6 cols) & Risk Drivers (6 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sector Benchmark (6 Columns - Section 15 & Section 26) */}
        <div className="lg:col-span-6 bg-[#FFFFFF] border border-[#E4E7EC] rounded-md p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E4E7EC]">
            <div>
              <h2 className="text-sm font-bold text-[#17202A] tracking-tight">
                Sector Benchmark (Average Delay Days)
              </h2>
              <p className="text-xs text-[#667085] mt-0.5">
                Comparison of schedule slippage across infrastructure sectors.
              </p>
            </div>
            <Link href="/benchmarking" className="text-xs font-semibold text-[#245B8F] hover:underline">
              Compare
            </Link>
          </div>

          <div className="space-y-3">
            {sectorBenchmark.map((s) => (
              <div key={s.sector} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-[#17202A]">{s.sector}</span>
                  <span className="font-mono text-[#667085] tabular-nums">
                    {s.delayDays} days slippage · Risk index {s.riskScore}
                  </span>
                </div>
                <div className="w-full h-2 bg-[#F2F4F7] rounded-sm overflow-hidden">
                  <div
                    className="h-full bg-[#245B8F]"
                    style={{ width: `${(s.delayDays / 90) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Drivers (6 Columns - Section 15 & Section 21) */}
        <div className="lg:col-span-6 bg-[#FFFFFF] border border-[#E4E7EC] rounded-md p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E4E7EC]">
            <div>
              <h2 className="text-sm font-bold text-[#17202A] tracking-tight">
                Primary Risk Drivers
              </h2>
              <p className="text-xs text-[#667085] mt-0.5">
                Root causes contributing to risk escalation across the portfolio.
              </p>
            </div>
            <Link href="/analytics" className="text-xs font-semibold text-[#245B8F] hover:underline">
              Analytics
            </Link>
          </div>

          <div className="divide-y divide-[#F2F4F7]">
            {frequentDrivers.map((d, i) => (
              <div key={i} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-[#17202A]">{d.driver}</div>
                  <div className="text-[11px] text-[#667085] mt-0.5">{d.frequency}</div>
                </div>
                <div className="text-right font-mono font-bold text-[#C65D32] tabular-nums">
                  {d.impact}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
