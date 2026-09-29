'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { getAnalyticsOverview } from '@/lib/api';
import { PageHeader } from '@/components/design-system';

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sectorFilter, setSectorFilter] = useState('All');
  const [activeTab, setActiveTab] = useState<'PORTFOLIO' | 'COST' | 'SCHEDULE' | 'PROGRESS' | 'DRIVERS'>('PORTFOLIO');

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (sectorFilter !== 'All') params.sector = sectorFilter;

    getAnalyticsOverview(params)
      .then((res) => setData(res))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [sectorFilter]);

  const sectorsList = [
    'All',
    'Road Transport & Highways',
    'Railways',
    'Power & Renewable Energy',
    'Petroleum & Natural Gas',
    'Urban Infrastructure & Metro',
    'Water Resources & Sanitation',
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        subtitle="Research and macro analytical workspace for portfolio concentration, schedule slippages, and empirical risk drivers."
        badgeText="Analytical Intelligence"
      />

      {/* Tabs and Sector Filter (Section 25) */}
      <div className="bg-[#FFFFFF] border border-[#E4E7EC] rounded-md p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center space-x-1 bg-[#F7F8FA] p-0.5 rounded border border-[#E4E7EC]">
          {[
            { id: 'PORTFOLIO', label: 'Portfolio' },
            { id: 'COST', label: 'Cost' },
            { id: 'SCHEDULE', label: 'Schedule' },
            { id: 'PROGRESS', label: 'Progress' },
            { id: 'DRIVERS', label: 'Risk Drivers' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1 rounded text-xs font-medium transition ${
                activeTab === tab.id
                  ? 'bg-[#FFFFFF] text-[#245B8F] shadow-xs font-semibold'
                  : 'text-[#667085] hover:text-[#17202A]'
              }`}
            >
              {tab.label}
            </button>
          ))}
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

      {loading ? (
        <div className="p-16 text-center text-[#98A2B3] font-mono text-xs">
          Loading analytical indicators...
        </div>
      ) : (
        <div className="space-y-6">
          {/* TAB 1: PORTFOLIO - Where is risk increasing? */}
          {activeTab === 'PORTFOLIO' && (
            <div className="bg-[#FFFFFF] border border-[#E4E7EC] rounded-md p-6 shadow-xs space-y-4">
              <div className="pb-3 border-b border-[#E4E7EC] flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-mono font-bold text-[#245B8F] uppercase">Research Question</span>
                  <h3 className="text-base font-bold text-[#17202A] mt-0.5">Where is risk increasing across the portfolio?</h3>
                </div>
                <span className="text-xs text-[#667085]">Sector Median Distribution</span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.sector_risk_distribution || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F2F4F7" vertical={false} />
                    <XAxis dataKey="sector" stroke="#98A2B3" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#98A2B3" fontSize={11} tickLine={false} axisLine={false} />
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
                    <Bar dataKey="critical" name="Critical Risk Projects" fill="#C43D3D" />
                    <Bar dataKey="high" name="High Risk Projects" fill="#C65D32" />
                    <Bar dataKey="moderate" name="Moderate Risk Projects" fill="#B7791F" />
                    <Bar dataKey="low" name="Low Risk Projects" fill="#2F7D5A" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* TAB 2: COST - Where is expenditure diverging from physical progress? */}
          {activeTab === 'COST' && (
            <div className="bg-[#FFFFFF] border border-[#E4E7EC] rounded-md p-6 shadow-xs space-y-4">
              <div className="pb-3 border-b border-[#E4E7EC]">
                <span className="text-[11px] font-mono font-bold text-[#245B8F] uppercase">Research Question</span>
                <h3 className="text-base font-bold text-[#17202A] mt-0.5">Where is expenditure diverging from physical progress?</h3>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data?.monthly_risk_trajectory || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F2F4F7" vertical={false} />
                    <XAxis dataKey="month" stroke="#98A2B3" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#98A2B3" fontSize={11} tickLine={false} axisLine={false} />
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
                    <Line type="monotone" dataKey="avg_risk" name="Composite Portfolio Risk" stroke="#C65D32" strokeWidth={2} />
                    <Line type="monotone" dataKey="avg_slippage_days" name="Avg Schedule Slippage (Days)" stroke="#245B8F" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* TAB 3: SCHEDULE - Which sectors show the largest schedule delays? */}
          {activeTab === 'SCHEDULE' && (
            <div className="bg-[#FFFFFF] border border-[#E4E7EC] rounded-md p-6 shadow-xs space-y-4">
              <div className="pb-3 border-b border-[#E4E7EC]">
                <span className="text-[11px] font-mono font-bold text-[#245B8F] uppercase">Research Question</span>
                <h3 className="text-base font-bold text-[#17202A] mt-0.5">Which sectors show the largest schedule delays?</h3>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.sector_slippage_benchmark || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F2F4F7" vertical={false} />
                    <XAxis dataKey="sector" stroke="#98A2B3" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#98A2B3" fontSize={11} tickLine={false} axisLine={false} />
                    <ReTooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E4E7EC',
                        borderRadius: '4px',
                        fontSize: '11px',
                        color: '#17202A',
                      }}
                    />
                    <Bar dataKey="avg_slippage_days" name="Average Delay (Days)" fill="#245B8F" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* TAB 4: PROGRESS - Agency execution rates */}
          {activeTab === 'PROGRESS' && (
            <div className="bg-[#FFFFFF] border border-[#E4E7EC] rounded-md p-6 shadow-xs space-y-4">
              <div className="pb-3 border-b border-[#E4E7EC]">
                <span className="text-[11px] font-mono font-bold text-[#245B8F] uppercase">Research Question</span>
                <h3 className="text-base font-bold text-[#17202A] mt-0.5">Where is physical execution decelerating?</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-[#FAFBFC] border-b border-[#E4E7EC] text-[11px] font-semibold text-[#667085] uppercase">
                    <tr>
                      <th className="py-2.5 px-4">Implementing Agency</th>
                      <th className="py-2.5 px-4 text-right">Active Projects</th>
                      <th className="py-2.5 px-4 text-right">Avg Physical Progress</th>
                      <th className="py-2.5 px-4 text-right">Spend Divergence Gap</th>
                      <th className="py-2.5 px-4 text-right">Slippage Days</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4E7EC]">
                    {[
                      { agency: 'NHAI', count: 48, progress: '58.2%', gap: '+14.2%', slip: 74 },
                      { agency: 'RVNL', count: 32, progress: '51.4%', gap: '+12.8%', slip: 68 },
                      { agency: 'DMRC', count: 18, progress: '64.1%', gap: '+6.1%', slip: 42 },
                      { agency: 'NTPC', count: 24, progress: '69.8%', gap: '+4.5%', slip: 31 },
                      { agency: 'CWC', count: 20, progress: '46.7%', gap: '+16.8%', slip: 82 },
                    ].map((row) => (
                      <tr key={row.agency} className="hover:bg-[#F9FAFB]">
                        <td className="py-3 px-4 font-mono font-semibold text-[#245B8F]">{row.agency}</td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums">{row.count}</td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums">{row.progress}</td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-[#C65D32]">{row.gap}</td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums">{row.slip} days</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: DRIVERS - Which risk drivers appear most frequently? */}
          {activeTab === 'DRIVERS' && (
            <div className="bg-[#FFFFFF] border border-[#E4E7EC] rounded-md p-6 shadow-xs space-y-4">
              <div className="pb-3 border-b border-[#E4E7EC]">
                <span className="text-[11px] font-mono font-bold text-[#245B8F] uppercase">Research Question</span>
                <h3 className="text-base font-bold text-[#17202A] mt-0.5">Which empirical risk drivers appear most frequently across flagged projects?</h3>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.top_risk_drivers || []} layout="vertical" margin={{ left: 50 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F2F4F7" horizontal={false} />
                    <XAxis type="number" stroke="#98A2B3" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis dataKey="driver" type="category" stroke="#98A2B3" fontSize={10} tickLine={false} axisLine={false} width={160} />
                    <ReTooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E4E7EC',
                        borderRadius: '4px',
                        fontSize: '11px',
                        color: '#17202A',
                      }}
                    />
                    <Bar dataKey="project_count" name="Flagged Project Count" fill="#245B8F" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
