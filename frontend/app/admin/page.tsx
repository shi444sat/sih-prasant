'use client';

import React, { useState, useEffect } from 'react';
import { Save, Check, Users, Sliders, FileClock, ShieldCheck } from 'lucide-react';
import { getAdminConfig, updateAdminConfig, getAdminUsers, getAuditLogs } from '@/lib/api';
import { PageHeader } from '@/components/design-system';

export default function AdminPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [policy, setPolicy] = useState<any>({
    cost_weight: 0.30,
    time_weight: 0.30,
    progress_weight: 0.15,
    milestone_weight: 0.15,
    data_quality_weight: 0.10,
    low_threshold: 30.0,
    moderate_threshold: 60.0,
    high_threshold: 80.0,
    critical_threshold: 100.0,
  });
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingPolicy, setSavingPolicy] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const fetchAdminData = () => {
    setLoading(true);
    Promise.all([
      getAdminConfig().catch(() => ({ policy: {} })),
      getAdminUsers().catch(() => []),
      getAuditLogs().catch(() => []),
    ])
      .then(([configRes, usersRes, logsRes]) => {
        if (configRes.policy) setPolicy(configRes.policy);
        setUsers(usersRes || []);
        setAuditLogs(logsRes || []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handlePolicyChange = (field: string, val: number) => {
    setPolicy((prev: any) => ({ ...prev, [field]: val }));
  };

  const handleSavePolicy = async () => {
    setSavingPolicy(true);
    setSaveSuccess(null);
    try {
      await updateAdminConfig({ policy });
      setSaveSuccess('Risk scoring policy updated and committed to audit trail.');
      setTimeout(() => setSaveSuccess(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to update policy');
    } finally {
      setSavingPolicy(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Administration & Governance"
        subtitle="Policy threshold calibration, authorized supervisory personnel registry, and immutable audit logs."
        badgeText="System Governance"
      />

      {saveSuccess && (
        <div className="p-3 bg-[#EBFDF2] border border-[#D1FADF] text-[#2F7D5A] text-xs rounded flex items-center space-x-2">
          <Check className="w-4 h-4 flex-shrink-0" />
          <span className="font-medium">{saveSuccess}</span>
        </div>
      )}

      {/* 1. Risk Policy Configuration */}
      <div className="bg-[#FFFFFF] border border-[#E4E7EC] rounded-md p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E4E7EC]">
          <div>
            <h2 className="text-sm font-bold text-[#17202A]">Risk Weights & Band Thresholds</h2>
            <p className="text-xs text-[#667085] mt-0.5">
              Calibrate relative weights for composite risk scoring across all portfolio projects.
            </p>
          </div>
          <button
            onClick={handleSavePolicy}
            disabled={savingPolicy}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#245B8F] hover:bg-[#1D4D79] text-white rounded text-xs font-semibold disabled:opacity-50 transition"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{savingPolicy ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
          {/* Cost Weight */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-[#17202A]">Cost Weight</span>
              <span className="font-mono text-[#245B8F] font-bold">{(policy.cost_weight * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.60"
              step="0.05"
              value={policy.cost_weight}
              onChange={(e) => handlePolicyChange('cost_weight', parseFloat(e.target.value))}
              className="w-full accent-[#245B8F]"
            />
          </div>

          {/* Time Weight */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-[#17202A]">Schedule Time Weight</span>
              <span className="font-mono text-[#245B8F] font-bold">{(policy.time_weight * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.60"
              step="0.05"
              value={policy.time_weight}
              onChange={(e) => handlePolicyChange('time_weight', parseFloat(e.target.value))}
              className="w-full accent-[#245B8F]"
            />
          </div>

          {/* Progress Weight */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-[#17202A]">Physical Progress Weight</span>
              <span className="font-mono text-[#245B8F] font-bold">{(policy.progress_weight * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.40"
              step="0.05"
              value={policy.progress_weight}
              onChange={(e) => handlePolicyChange('progress_weight', parseFloat(e.target.value))}
              className="w-full accent-[#245B8F]"
            />
          </div>
        </div>
      </div>

      {/* 2. Authorized Officers Table */}
      <div className="bg-[#FFFFFF] border border-[#E4E7EC] rounded-md shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#E4E7EC] bg-[#FAFBFC] flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#17202A]">Authorized Supervisory Officers</h2>
          <span className="text-xs text-[#667085]">Role-Based Access Control</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-[#FFFFFF] border-b border-[#E4E7EC] text-[11px] font-semibold text-[#667085] uppercase">
              <tr>
                <th className="py-2.5 px-4">Officer Name</th>
                <th className="py-2.5 px-4">Email</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3">Department</th>
                <th className="py-2.5 px-4 text-right">Access Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E7EC]">
              {users.map((u: any) => (
                <tr key={u.id} className="hover:bg-[#F9FAFB]">
                  <td className="py-3 px-4 font-semibold text-[#17202A]">{u.name}</td>
                  <td className="py-3 px-4 font-mono text-[#667085]">{u.email}</td>
                  <td className="py-3 px-3">{u.role}</td>
                  <td className="py-3 px-3 text-[#667085]">{u.department}</td>
                  <td className="py-3 px-4 text-right">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F0F6FB] text-[#245B8F] border border-[#D0E2F2]">
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Audit Trail */}
      <div className="bg-[#FFFFFF] border border-[#E4E7EC] rounded-md shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#E4E7EC] bg-[#FAFBFC] flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#17202A]">System Audit Trail</h2>
          <span className="text-xs text-[#667085]">Chronological Governance Logs</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-[#FFFFFF] border-b border-[#E4E7EC] text-[11px] font-semibold text-[#667085] uppercase">
              <tr>
                <th className="py-2.5 px-4">Timestamp</th>
                <th className="py-2.5 px-4">User</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E7EC]">
              {auditLogs.map((log: any) => (
                <tr key={log.id} className="hover:bg-[#F9FAFB]">
                  <td className="py-3 px-4 font-mono text-[#98A2B3] text-[11px]">{log.timestamp}</td>
                  <td className="py-3 px-4 font-medium text-[#17202A]">{log.user}</td>
                  <td className="py-3 px-3 font-mono font-semibold text-[#245B8F]">{log.action}</td>
                  <td className="py-3 px-4 text-[#667085]">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
