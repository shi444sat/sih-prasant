'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Layers,
  BarChart3,
  Cpu,
  FileText,
  Activity,
  Check,
  ChevronRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
} from 'recharts';
import { RiskBadge } from '@/components/design-system';

export default function LandingPage() {
  const router = useRouter();

  // Interactive Product Walkthrough Stage (Section 31 & 32)
  const [activeStage, setActiveStage] = useState<number>(0);

  const stages = [
    {
      step: '01',
      title: 'DATA',
      heading: 'Raw Project Returns',
      subtitle: 'Monthly administrative expenditure & progress returns submitted by line agencies.',
      snippet: 'Monthly Expenditure: ₹42.0 Cr · Physical Progress: 21.9% · Elapsed Timeline: 40.5%',
    },
    {
      step: '02',
      title: 'INDICATORS',
      heading: 'Divergence & Slippage Indicators',
      subtitle: 'Feature pipeline extracts mathematical gaps, burn rate ratios, and milestone delays.',
      snippet: 'Progress Gap: +18.6% · Spend/Progress Divergence: +20.1% · Delay: 68 days',
    },
    {
      step: '03',
      title: 'PREDICTION',
      heading: 'Probabilistic Risk Modeling',
      subtitle: 'Chronologically validated machine-learning ensembles estimate probability of overrun.',
      snippet: 'Predicted Probability of >90d delay: 76.4% (Confidence Interval: 95%)',
    },
    {
      step: '04',
      title: 'EXPLANATION',
      heading: 'Explainable Driver Attribution',
      subtitle: 'Shapley decomposition decomposes the score into verifiable empirical factors.',
      snippet: 'Driver #1: Schedule Slippage (+18 pts) · Driver #2: Progress Slowdown (+14 pts)',
    },
    {
      step: '05',
      title: 'EARLY WARNING',
      heading: 'Multi-Criteria Threshold Alerts',
      subtitle: 'System generates targeted alerts before milestones fail irreversibly.',
      snippet: 'ALERT: Schedule risk threshold crossed on NH-48 Expressway Package 3.',
    },
    {
      step: '06',
      title: 'HUMAN ACTION',
      heading: 'Prioritized Supervisory Review',
      subtitle: 'Monitoring officers review evidence dossiers and verify remediation actions.',
      snippet: 'Action: Acknowledged by DIID Officer. Review meeting scheduled.',
    },
  ];

  // Sample hero trend data
  const sampleTrend = [
    { month: 'Apr', risk: 54 },
    { month: 'May', risk: 57 },
    { month: 'Jun', risk: 61 },
    { month: 'Jul', risk: 66 },
    { month: 'Aug', risk: 70 },
    { month: 'Sep', risk: 76 },
  ];

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#17202A] flex flex-col font-sans selection:bg-[#F0F6FB] selection:text-[#245B8F]">
      {/* 1. Navigation (Section 35) */}
      <header className="sticky top-0 z-50 bg-[#FFFFFF]/95 border-b border-[#E4E7EC] backdrop-blur-md">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#245B8F]" />
              <span className="font-bold text-base text-[#17202A] tracking-tight">
                PROJECT DRISHTI
              </span>
            </Link>

            <nav className="hidden md:flex items-center space-x-6 text-xs font-medium text-[#667085]">
              <a href="#how-it-works" className="hover:text-[#17202A] transition">
                How It Works
              </a>
              <a href="#preview" className="hover:text-[#17202A] transition">
                Platform Preview
              </a>
              <a href="#capabilities" className="hover:text-[#17202A] transition">
                Capabilities
              </a>
              <a href="#architecture" className="hover:text-[#17202A] transition">
                Architecture
              </a>
            </nav>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#245B8F] hover:bg-[#1D4D79] text-white rounded text-xs font-semibold transition"
            >
              <span>Enter Platform</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Landing Hero (Section 30) */}
      <section className="py-20 px-6 border-b border-[#E4E7EC] bg-[#FAFBFC]">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Text (6 Cols) */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center space-x-2 px-2.5 py-1 bg-[#F0F6FB] border border-[#D0E2F2] rounded text-[11px] font-semibold text-[#245B8F] uppercase tracking-wider">
              <span>SIH26103 · SMART AUTOMATION · MoSPI DIID</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-extrabold text-[#17202A] tracking-tight leading-[1.12]">
              Infrastructure intelligence for earlier intervention.
            </h1>

            <p className="text-base text-[#667085] leading-relaxed max-w-xl font-normal">
              Project Drishti transforms monthly project-monitoring data into empirical risk signals,
              evidence-backed early warnings, and prioritized supervisory review before cost and schedule overruns materialize.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/dashboard"
                className="inline-flex items-center space-x-2 px-5 py-2.5 bg-[#245B8F] hover:bg-[#1D4D79] text-white text-xs font-semibold rounded transition shadow-xs"
              >
                <span>ENTER MONITORING PLATFORM</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <a
                href="#how-it-works"
                className="inline-flex items-center space-x-2 px-4 py-2.5 bg-white border border-[#D0D5DD] hover:bg-[#F9FAFB] text-[#344054] text-xs font-semibold rounded transition"
              >
                <span>EXPLORE HOW IT WORKS</span>
              </a>
            </div>

            <div className="pt-6 border-t border-[#E4E7EC] flex items-center space-x-8 text-xs text-[#667085]">
              <div>
                <strong className="block text-lg font-bold text-[#17202A] font-mono">142</strong>
                <span>Monitored Projects</span>
              </div>
              <div>
                <strong className="block text-lg font-bold text-[#C65D32] font-mono">18</strong>
                <span>Early Warnings</span>
              </div>
              <div>
                <strong className="block text-lg font-bold text-[#2F7D5A] font-mono">90–180d</strong>
                <span>Lead Time</span>
              </div>
            </div>
          </div>

          {/* Right Real Product Preview (6 Cols - Section 30 & 34) */}
          <div id="preview" className="lg:col-span-6 bg-[#FFFFFF] border border-[#E4E7EC] rounded-md shadow-md p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E4E7EC] text-xs">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-[#2F7D5A]" />
                <span className="font-semibold text-[#17202A]">Operational Telemetry Preview</span>
              </div>
              <span className="text-[11px] font-mono text-[#98A2B3]">LIVE DEMO SNAPSHOT</span>
            </div>

            {/* Metric Strip in Hero */}
            <div className="grid grid-cols-3 divide-x divide-[#E4E7EC] border border-[#E4E7EC] rounded bg-[#FAFBFC] text-center p-2.5">
              <div>
                <div className="text-[10px] uppercase text-[#667085] font-semibold">Total Projects</div>
                <div className="text-lg font-bold text-[#17202A] font-mono mt-0.5">142</div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-[#667085] font-semibold">High Risk</div>
                <div className="text-lg font-bold text-[#C65D32] font-mono mt-0.5">18</div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-[#667085] font-semibold">Active Alerts</div>
                <div className="text-lg font-bold text-[#C43D3D] font-mono mt-0.5">7</div>
              </div>
            </div>

            {/* Highlighted Project Attention Row */}
            <div className="p-3 bg-[#F9FAFB] border border-[#E4E7EC] rounded">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-mono font-bold text-[#245B8F]">P-1042</span>
                <RiskBadge band="HIGH" score={76} />
              </div>
              <div className="text-xs font-semibold text-[#17202A]">National Highway Development</div>
              <div className="text-[11px] text-[#667085] mt-1 flex items-center justify-between">
                <span>Primary Signal: Schedule delay (+74d)</span>
                <span className="font-mono text-[#C65D32] font-bold">↑ +15.0</span>
              </div>
            </div>

            {/* Mini Trend Line Chart */}
            <div className="pt-2">
              <div className="flex items-center justify-between text-[11px] text-[#667085] mb-1">
                <span>6-Month Portfolio Risk Drift</span>
                <span className="font-mono text-[#C65D32] font-semibold">54 → 76 (+22.0)</span>
              </div>
              <div className="h-20 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sampleTrend}>
                    <Line type="monotone" dataKey="risk" stroke="#C65D32" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="pt-2 text-right">
              <Link href="/dashboard" className="text-xs font-semibold text-[#245B8F] hover:underline inline-flex items-center space-x-1">
                <span>Open full interactive workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Section 1 & 2: The Problem vs The Shift (Section 32) */}
      <section className="py-20 px-6 border-b border-[#E4E7EC]">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Section 1: The Problem */}
          <div className="space-y-4">
            <span className="text-[11px] font-mono font-bold text-[#C65D32] uppercase tracking-wider">
              01 · THE MONITORING PARADOX
            </span>
            <h2 className="text-2xl font-bold text-[#17202A] tracking-tight">
              Monitoring tells you what already happened.
            </h2>
            <p className="text-sm text-[#667085] leading-relaxed">
              Traditional infrastructure monitoring relies on quarterly administrative status reports.
              By the time expenditure slippage or milestone delays appear in official tables,
              the delay is already embedded and contract dispute costs have compounded.
            </p>
          </div>

          {/* Section 2: The Shift */}
          <div className="space-y-4">
            <span className="text-[11px] font-mono font-bold text-[#245B8F] uppercase tracking-wider">
              02 · THE ANALYTICAL SHIFT
            </span>
            <h2 className="text-2xl font-bold text-[#17202A] tracking-tight">
              Drishti helps identify what is likely to happen next.
            </h2>
            <p className="text-sm text-[#667085] leading-relaxed">
              By detecting subtle micro-divergences between financial spend ratios and physical delivery curves,
              Project Drishti identifies emerging failure modes 90 to 180 days before target milestone dates are breached.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Section 3: Interactive Walkthrough (Section 31 & 32) */}
      <section id="how-it-works" className="py-20 px-6 border-b border-[#E4E7EC] bg-[#FAFBFC]">
        <div className="max-w-[1200px] mx-auto space-y-12">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <span className="text-[11px] font-mono font-bold text-[#245B8F] uppercase tracking-wider">
              METHODOLOGY
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#17202A] tracking-tight">
              How Project Drishti Operates
            </h2>
            <p className="text-xs sm:text-sm text-[#667085]">
              Six interconnected stages connecting raw submissions to decisive supervisory intervention.
            </p>
          </div>

          {/* Stepper Tabs */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
            {stages.map((st, i) => (
              <button
                key={st.step}
                onClick={() => setActiveStage(i)}
                className={`p-3 rounded text-left border transition ${
                  activeStage === i
                    ? 'bg-[#FFFFFF] border-[#245B8F] shadow-xs'
                    : 'bg-[#FFFFFF]/60 border-[#E4E7EC] hover:bg-[#FFFFFF]'
                }`}
              >
                <div className={`text-[10px] font-mono font-bold ${activeStage === i ? 'text-[#245B8F]' : 'text-[#98A2B3]'}`}>
                  {st.step}
                </div>
                <div className="text-xs font-bold text-[#17202A] mt-1">{st.title}</div>
              </button>
            ))}
          </div>

          {/* Active Stage Display Panel */}
          <div className="bg-[#FFFFFF] border border-[#E4E7EC] rounded-md p-6 shadow-xs max-w-3xl mx-auto space-y-4">
            <div className="flex items-center justify-between border-b border-[#E4E7EC] pb-3">
              <div>
                <span className="text-[11px] font-mono font-bold text-[#245B8F]">STAGE {stages[activeStage].step}</span>
                <h3 className="text-lg font-bold text-[#17202A] mt-0.5">{stages[activeStage].heading}</h3>
              </div>
              <span className="text-xs font-mono text-[#98A2B3]">{stages[activeStage].title}</span>
            </div>

            <p className="text-sm text-[#667085] leading-relaxed">
              {stages[activeStage].subtitle}
            </p>

            <div className="p-3 bg-[#F7F8FA] border border-[#E4E7EC] rounded font-mono text-xs text-[#17202A]">
              <span className="text-[#98A2B3] block text-[10px] uppercase font-sans font-semibold mb-1">
                Empirical System Artifact
              </span>
              {stages[activeStage].snippet}
            </div>
          </div>
        </div>
      </section>

      {/* 5. Section 4: Capabilities (Section 25 & 27) */}
      <section id="capabilities" className="py-20 px-6 border-b border-[#E4E7EC]">
        <div className="max-w-[1200px] mx-auto space-y-12">
          <div className="max-w-xl space-y-2">
            <span className="text-[11px] font-mono font-bold text-[#245B8F] uppercase tracking-wider">
              CORE CAPABILITIES
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#17202A] tracking-tight">
              Rigorous Decision Support Architecture
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 border border-[#E4E7EC] rounded-md bg-[#FFFFFF] space-y-3">
              <h3 className="text-sm font-bold text-[#17202A]">Chronological Train/Test Validation</h3>
              <p className="text-xs text-[#667085] leading-relaxed">
                Strict chronological splitting ensures zero time-travel data leakage. Models are evaluated strictly on future 3-month outcome windows.
              </p>
            </div>

            <div className="p-5 border border-[#E4E7EC] rounded-md bg-[#FFFFFF] space-y-3">
              <h3 className="text-sm font-bold text-[#17202A]">Explainable Risk Decomposition</h3>
              <p className="text-xs text-[#667085] leading-relaxed">
                Every risk score is backed by granular driver contributions. Officers inspect explicit physical progress gaps rather than opaque probability scores.
              </p>
            </div>

            <div className="p-5 border border-[#E4E7EC] rounded-md bg-[#FFFFFF] space-y-3">
              <h3 className="text-sm font-bold text-[#17202A]">Dynamic Simulation Engine</h3>
              <p className="text-xs text-[#667085] leading-relaxed">
                Test schedule slippage or cost burn rate scenarios over a 12-month timeline to evaluate future threshold breaches in real-time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Section 7: Final CTA (Section 32) */}
      <section className="py-20 px-6 bg-[#FAFBFC] text-center">
        <div className="max-w-xl mx-auto space-y-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#17202A] tracking-tight">
            Move from passive reporting to earlier intervention.
          </h2>
          <p className="text-sm text-[#667085] leading-relaxed">
            Access the complete Project Drishti monitoring platform to review the project register, inspect risk drivers, and manage early-warning signals.
          </p>
          <div>
            <Link
              href="/dashboard"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-[#245B8F] hover:bg-[#1D4D79] text-white text-xs font-semibold rounded transition shadow-xs"
            >
              <span>ENTER MONITORING PLATFORM</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 7. Footer */}
      <footer className="py-6 px-6 border-t border-[#E4E7EC] bg-[#FFFFFF] text-center text-xs text-[#98A2B3]">
        <div>PROJECT DRISHTI · SIH26103 · SMART AUTOMATION · MoSPI / DIID</div>
        <div className="text-[11px] text-[#98A2B3] mt-1">
          Synthetic demonstration environment. For evaluation purposes only.
        </div>
      </footer>
    </div>
  );
}
