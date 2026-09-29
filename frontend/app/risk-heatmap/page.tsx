'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { ArrowRight, Download, Filter } from 'lucide-react';
import { getProjects } from '@/lib/api';
import { ProjectListItem } from '@/lib/types';
import { PageHeader, RiskBadge } from '@/components/design-system';

export default function RiskHeatmapPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sectorFilter, setSectorFilter] = useState('All');
  const [riskFilter, setRiskFilter] = useState('All');
  const [selectedProject, setSelectedProject] = useState<ProjectListItem | null>(null);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = { limit: '150' };
    if (sectorFilter !== 'All') params.sector = sectorFilter;
    if (riskFilter !== 'All') params.risk_level = riskFilter;

    getProjects(params)
      .then((data) => {
        setProjects(data);
        if (data.length > 0 && !selectedProject) {
          setSelectedProject(data[0]);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [sectorFilter, riskFilter]);

  const colorMap: Record<string, string> = {
    LOW: '#2F7D5A',
    MODERATE: '#B7791F',
    HIGH: '#C65D32',
    CRITICAL: '#C43D3D',
  };

  const chartData = projects.map((p) => ({
    id: p.id,
    name: p.name,
    code: p.code,
    sector: p.sector,
    agency: p.agency,
    x: Number((p.time_risk || 0).toFixed(1)),
    y: Number((p.cost_risk || 0).toFixed(1)),
    overall_risk: p.overall_risk,
    risk_band: p.risk_band,
    fill: colorMap[p.risk_band?.toUpperCase()] || '#2F7D5A',
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#FFFFFF] p-3 border border-[#E4E7EC] rounded shadow-md text-xs font-sans space-y-1">
          <div className="flex items-center space-x-2">
            <span className="font-mono font-bold text-[#245B8F]">{data.code}</span>
            <RiskBadge band={data.risk_band} score={data.overall_risk} />
          </div>
          <div className="font-medium text-[#17202A] line-clamp-1">{data.name}</div>
          <div className="text-[11px] text-[#667085] flex items-center space-x-3 pt-1 border-t border-[#F2F4F7]">
            <span>Time Risk: <strong className="text-[#17202A]">{data.x}</strong></span>
            <span>Cost Risk: <strong className="text-[#17202A]">{data.y}</strong></span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Risk Monitor"
        subtitle="Two-dimensional risk quadrant mapping time slippage against cost escalation."
        badgeText={`${projects.length} Monitored Assets`}
      />

      {/* Filter Row */}
      <div className="bg-[#FFFFFF] border border-[#E4E7EC] rounded-md p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value)}
            className="text-xs bg-[#FFFFFF] border border-[#D0D5DD] text-[#344054] px-2.5 py-1.5 rounded focus:outline-none"
          >
            <option value="All">Sector: All</option>
            <option value="Road Transport & Highways">Road Transport</option>
            <option value="Railways">Railways</option>
            <option value="Power & Renewable Energy">Power & Energy</option>
            <option value="Urban Infrastructure & Metro">Urban Metro</option>
            <option value="Water Resources & Sanitation">Water Resources</option>
          </select>

          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="text-xs bg-[#FFFFFF] border border-[#D0D5DD] text-[#344054] px-2.5 py-1.5 rounded focus:outline-none"
          >
            <option value="All">Risk: All Bands</option>
            <option value="LOW">Low</option>
            <option value="MODERATE">Moderate</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>

        <div className="flex items-center space-x-4 text-xs">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2F7D5A]" />
            <span className="text-[#667085]">Low</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#B7791F]" />
            <span className="text-[#667085]">Moderate</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C65D32]" />
            <span className="text-[#667085]">High</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C43D3D]" />
            <span className="text-[#667085]">Critical</span>
          </div>
        </div>
      </div>

      {/* Main 2D Scatter Chart Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-[#FFFFFF] border border-[#E4E7EC] rounded-md p-6 shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-[#E4E7EC]">
            <div>
              <h2 className="text-sm font-bold text-[#17202A]">Cost Risk vs Time Risk Matrix</h2>
              <p className="text-xs text-[#667085] mt-0.5">Click any circle to inspect project dossier.</p>
            </div>
            <span className="text-xs font-mono text-[#98A2B3]">X: Time · Y: Cost</span>
          </div>

          <div className="h-[440px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F2F4F7" />
                <XAxis
                  type="number"
                  dataKey="x"
                  name="Time Risk"
                  domain={[0, 100]}
                  stroke="#98A2B3"
                  fontSize={11}
                  label={{ value: 'Time / Schedule Risk (0-100)', position: 'insideBottom', offset: -10, fontSize: 11, fill: '#667085' }}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  name="Cost Risk"
                  domain={[0, 100]}
                  stroke="#98A2B3"
                  fontSize={11}
                  label={{ value: 'Cost Overrun Risk (0-100)', angle: -90, position: 'insideLeft', offset: 10, fontSize: 11, fill: '#667085' }}
                />
                <ZAxis range={[50, 50]} />
                <ReTooltip content={<CustomTooltip />} />
                <ReferenceLine x={50} stroke="#E4E7EC" strokeDasharray="3 3" />
                <ReferenceLine y={50} stroke="#E4E7EC" strokeDasharray="3 3" />
                <Scatter
                  data={chartData}
                  onClick={(node: any) => {
                    if (node && node.id) {
                      const matched = projects.find((p) => p.id === node.id);
                      if (matched) setSelectedProject(matched);
                    }
                  }}
                  cursor="pointer"
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Selected Project Dossier Panel */}
        <div className="lg:col-span-4 bg-[#FFFFFF] border border-[#E4E7EC] rounded-md p-5 shadow-xs flex flex-col justify-between">
          {selectedProject ? (
            <div className="space-y-4">
              <div className="pb-3 border-b border-[#E4E7EC]">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono font-bold text-xs text-[#245B8F]">{selectedProject.code}</span>
                  <RiskBadge band={selectedProject.risk_band} score={selectedProject.overall_risk} />
                </div>
                <h3 className="text-sm font-bold text-[#17202A] line-clamp-2">{selectedProject.name}</h3>
                <div className="text-xs text-[#667085] mt-1">
                  {selectedProject.agency} · {selectedProject.sector}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 bg-[#F9FAFB] rounded border border-[#E4E7EC]">
                  <div className="text-[10px] uppercase font-bold text-[#667085]">Time Risk</div>
                  <div className="text-xl font-bold font-mono text-[#17202A] mt-0.5">{selectedProject.time_risk}</div>
                </div>
                <div className="p-3 bg-[#F9FAFB] rounded border border-[#E4E7EC]">
                  <div className="text-[10px] uppercase font-bold text-[#667085]">Cost Risk</div>
                  <div className="text-xl font-bold font-mono text-[#17202A] mt-0.5">{selectedProject.cost_risk}</div>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-[#F2F4F7]">
                  <span className="text-[#667085]">Physical Progress</span>
                  <span className="font-mono font-semibold text-[#17202A]">{(selectedProject.latest_physical_progress || 0).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#F2F4F7]">
                  <span className="text-[#667085]">Approved Budget</span>
                  <span className="font-mono font-semibold text-[#17202A]">₹{selectedProject.approved_cost?.toLocaleString()} Cr</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#F2F4F7]">
                  <span className="text-[#667085]">Primary Signal</span>
                  <span className="font-semibold text-[#C65D32] line-clamp-1">{selectedProject.top_driver || 'Schedule slippage'}</span>
                </div>
              </div>

              <Link
                href={`/projects/${selectedProject.id}`}
                className="w-full py-2 bg-[#245B8F] hover:bg-[#1D4D79] text-white rounded text-xs font-semibold flex items-center justify-center space-x-1.5 transition mt-4"
              >
                <span>Open Project Intelligence File</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="py-24 text-center text-xs text-[#98A2B3]">
              Select a project circle on the matrix to inspect telemetry.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
