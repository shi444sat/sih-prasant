'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  getProjects,
  getDashboardSummary,
  getAlerts,
  acknowledgeAlert as apiAcknowledgeAlert,
  resolveAlert as apiResolveAlert,
  resetDemoEnvironment
} from '@/lib/api';
import { ProjectListItem, AlertItem, DashboardSummary } from '@/lib/types';

export type SimulationScenario =
  | 'HEALTHY'
  | 'COST_ESCALATION'
  | 'SCHEDULE_DELAY'
  | 'PROGRESS_STAGNATION'
  | 'MILESTONE_FAILURE'
  | 'MULTI_RISK';

export interface AppNotification {
  id: string;
  type: 'ALERT' | 'RISK_CHANGE' | 'SYSTEM' | 'IMPORT';
  title: string;
  message: string;
  projectId?: number;
  timestamp: string;
  read: boolean;
}

export interface SimulationState {
  isActive: boolean;
  scenario: SimulationScenario;
  targetProjectId: number;
  targetProjectCode: string;
  targetProjectName: string;
  month: number; // 1 to 12
  isPlaying: boolean;
  speed: 1 | 2 | 5;
  initialRisk: number;
  currentRisk: number;
  riskDelta: number;
  costRisk: number;
  timeRisk: number;
  progressRisk: number;
  milestoneRisk: number;
  physicalProgress: number;
  financialExpenditureRatio: number;
  earlyWarningTriggered: boolean;
  history: Array<{ month: number; risk: number; physical: number; spendRatio: number }>;
}

interface AppContextType {
  projects: ProjectListItem[];
  dashboardSummary: DashboardSummary | null;
  alerts: AlertItem[];
  notifications: AppNotification[];
  loading: boolean;
  isCommandCenterOpen: boolean;
  isSearchOpen: boolean;
  isSidebarCollapsed: boolean;
  simulation: SimulationState;
  selectedProjectForFocus: ProjectListItem | null;
  setCommandCenterOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSelectedProjectForFocus: (project: ProjectListItem | null) => void;
  startSimulation: (scenario: SimulationScenario, projectId?: number) => void;
  pauseSimulation: () => void;
  resumeSimulation: () => void;
  stepSimulationForward: () => void;
  resetSimulation: () => void;
  setSimulationSpeed: (speed: 1 | 2 | 5) => void;
  setSimulationMonth: (month: number) => void;
  acknowledgeAlert: (alertId: number, notes?: string) => Promise<void>;
  resolveAlert: (alertId: number, notes?: string) => Promise<void>;
  markNotificationAsRead: (id: string) => void;
  clearNotifications: () => void;
  resetDemo: () => Promise<void>;
  refreshAllData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Deterministic risk progression profiles for simulation scenarios
const SCENARIO_PROFILES: Record<SimulationScenario, {
  name: string;
  baseRisk: number;
  riskCurve: number[]; // 12 months (0-11)
  costRiskCurve: number[];
  timeRiskCurve: number[];
  progressCurve: number[]; // Physical progress %
  spendCurve: number[];    // Spend ratio %
  warningMonth: number;
  warningMessage: string;
}> = {
  HEALTHY: {
    name: 'Healthy Operational Envelope',
    baseRisk: 24,
    riskCurve: [24, 25, 23, 26, 25, 24, 26, 25, 27, 26, 25, 24],
    costRiskCurve: [20, 21, 20, 22, 21, 20, 22, 21, 23, 22, 21, 20],
    timeRiskCurve: [22, 23, 21, 24, 23, 22, 24, 23, 25, 24, 23, 22],
    progressCurve: [20, 26, 32, 38, 44, 50, 56, 62, 68, 74, 80, 86],
    spendCurve: [18, 24, 30, 36, 42, 48, 54, 60, 66, 72, 78, 84],
    warningMonth: 99, // never
    warningMessage: 'Project operates nominally within approved financial and physical envelope.',
  },
  SCHEDULE_DELAY: {
    name: 'Schedule Delay & Slippage',
    baseRisk: 34,
    riskCurve: [34, 39, 45, 52, 61, 69, 76, 81, 84, 86, 87, 88],
    costRiskCurve: [30, 32, 35, 39, 43, 48, 54, 58, 62, 65, 68, 70],
    timeRiskCurve: [38, 45, 55, 64, 75, 83, 89, 92, 94, 95, 96, 96],
    progressCurve: [25, 28, 30, 32, 34, 36, 38, 40, 42, 44, 45, 46], // stagnating
    spendCurve: [25, 30, 36, 43, 51, 59, 66, 72, 78, 83, 87, 91],
    warningMonth: 5, // crosses threshold in month 5 (61)
    warningMessage: 'Target completion has shifted by 74 days. Physical progress lag rate: -18.4% below planned S-curve.',
  },
  COST_ESCALATION: {
    name: 'Cost Escalation & Budget Overrun',
    baseRisk: 32,
    riskCurve: [32, 38, 46, 55, 64, 72, 78, 82, 85, 87, 89, 90],
    costRiskCurve: [35, 45, 56, 68, 79, 86, 91, 93, 95, 96, 97, 98],
    timeRiskCurve: [28, 31, 35, 40, 45, 50, 54, 58, 61, 64, 66, 68],
    progressCurve: [22, 26, 30, 34, 38, 42, 46, 50, 54, 58, 62, 66],
    spendCurve: [25, 36, 49, 62, 74, 85, 94, 102, 110, 118, 125, 131], // rapid overrun
    warningMonth: 4,
    warningMessage: 'Expenditure outpaced physical progress by 28.5%. Anticipated revised cost exceeds approved outlay by +22%.',
  },
  PROGRESS_STAGNATION: {
    name: 'Physical Delivery Stagnation',
    baseRisk: 30,
    riskCurve: [30, 35, 42, 50, 59, 67, 74, 79, 82, 84, 85, 86],
    costRiskCurve: [26, 29, 33, 38, 44, 50, 55, 60, 64, 67, 70, 72],
    timeRiskCurve: [34, 40, 48, 57, 67, 75, 81, 85, 88, 90, 92, 93],
    progressCurve: [28, 30, 31, 31.5, 32, 32.2, 32.5, 33, 33.2, 33.5, 33.8, 34], // complete plateau
    spendCurve: [28, 33, 39, 45, 51, 57, 63, 68, 73, 78, 82, 86],
    warningMonth: 5,
    warningMessage: 'Physical progress plateaued at 32% for 4 consecutive months while site establishment overheads continue.',
  },
  MILESTONE_FAILURE: {
    name: 'Critical Path Milestone Delay',
    baseRisk: 35,
    riskCurve: [35, 41, 48, 58, 68, 75, 80, 83, 85, 87, 88, 89],
    costRiskCurve: [28, 32, 37, 44, 51, 57, 62, 66, 70, 73, 75, 77],
    timeRiskCurve: [40, 48, 58, 70, 81, 87, 91, 93, 94, 95, 96, 96],
    progressCurve: [24, 27, 30, 33, 36, 38, 40, 42, 44, 46, 48, 50],
    spendCurve: [22, 27, 33, 40, 48, 56, 64, 71, 77, 83, 88, 92],
    warningMonth: 4,
    warningMessage: 'Key Tier-1 Milestone "Land Acquisition & ROW Package 3" breached deadline by 62 days, freezing dependent packages.',
  },
  MULTI_RISK: {
    name: 'Multi-Risk Compound Event',
    baseRisk: 42,
    riskCurve: [42, 51, 62, 73, 82, 89, 93, 95, 96, 97, 98, 99],
    costRiskCurve: [40, 52, 65, 78, 88, 94, 96, 97, 98, 99, 99, 100],
    timeRiskCurve: [45, 56, 70, 83, 91, 95, 97, 98, 99, 99, 100, 100],
    progressCurve: [26, 28, 29, 30, 31, 32, 33, 34, 35, 35.5, 36, 36.5],
    spendCurve: [28, 42, 58, 74, 90, 104, 118, 130, 141, 150, 158, 165],
    warningMonth: 3,
    warningMessage: 'Compound failure: critical milestone missed, physical delivery halted, and contractor claims caused budget overrun.',
  },
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCommandCenterOpen, setCommandCenterOpen] = useState(false);
  const [isSearchOpen, setSearchOpen] = useState(false);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedProjectForFocus, setSelectedProjectForFocus] = useState<ProjectListItem | null>(null);

  const [notifications, setNotifications] = useState<AppNotification[]>([
    {
      id: 'notif-1',
      type: 'ALERT',
      title: 'Critical Schedule Slippage Detected',
      message: 'PRJ-ROA-1042 target completion shifted by 74 days.',
      projectId: 1,
      timestamp: 'Just now',
      read: false,
    },
    {
      id: 'notif-2',
      type: 'RISK_CHANGE',
      title: 'Composite Risk Increased (+15 pts)',
      message: 'Dedicated Freight Corridor Eastern Arm crossed into HIGH risk tier.',
      projectId: 2,
      timestamp: '15m ago',
      read: false,
    },
    {
      id: 'notif-3',
      type: 'SYSTEM',
      title: 'Model Pipeline Retrained',
      message: 'Gradient Boosting calibrated model v1.2 updated with latest monthly features.',
      timestamp: '1h ago',
      read: true,
    }
  ]);

  // Initial Simulation State
  const [simulation, setSimulation] = useState<SimulationState>({
    isActive: false,
    scenario: 'SCHEDULE_DELAY',
    targetProjectId: 1,
    targetProjectCode: 'PRJ-ROA-1042',
    targetProjectName: 'National Highway Corridor NH-44 Bypass Package 3',
    month: 1,
    isPlaying: false,
    speed: 1,
    initialRisk: 34,
    currentRisk: 34,
    riskDelta: 0,
    costRisk: 30,
    timeRisk: 38,
    progressRisk: 25,
    milestoneRisk: 35,
    physicalProgress: 25,
    financialExpenditureRatio: 0.25,
    earlyWarningTriggered: false,
    history: [{ month: 1, risk: 34, physical: 25, spendRatio: 25 }],
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const refreshAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [projs, summary, alrts] = await Promise.all([
        getProjects({ limit: '150' }).catch(() => []),
        getDashboardSummary().catch(() => null),
        getAlerts().catch(() => []),
      ]);
      setProjects(projs);
      setDashboardSummary(summary);
      setAlerts(alrts);

      if (projs.length > 0 && !selectedProjectForFocus) {
        setSelectedProjectForFocus(projs[0]);
      }
    } catch (err) {
      console.error('Failed to load application data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedProjectForFocus]);

  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  // Step simulation forward logic
  const stepSimulationForward = useCallback(() => {
    setSimulation((prev) => {
      if (prev.month >= 12) {
        return { ...prev, isPlaying: false };
      }
      const nextMonth = prev.month + 1;
      const profile = SCENARIO_PROFILES[prev.scenario];
      const mIdx = nextMonth - 1;

      const newRisk = profile.riskCurve[mIdx];
      const newCost = profile.costRiskCurve[mIdx];
      const newTime = profile.timeRiskCurve[mIdx];
      const newProgress = profile.progressCurve[mIdx];
      const newSpend = profile.spendCurve[mIdx];
      const delta = Number((newRisk - prev.initialRisk).toFixed(1));
      const shouldTriggerWarning = !prev.earlyWarningTriggered && nextMonth >= profile.warningMonth;

      // Update project list & dashboard summary state to reflect live simulation
      setProjects((currProjects) =>
        currProjects.map((p) => {
          if (p.id === prev.targetProjectId || p.code === prev.targetProjectCode) {
            const riskBand =
              newRisk >= 80 ? 'CRITICAL' : newRisk >= 60 ? 'HIGH' : newRisk >= 30 ? 'MODERATE' : 'LOW';
            return {
              ...p,
              overall_risk: newRisk,
              risk_band: riskBand as any,
              cost_risk: newCost,
              time_risk: newTime,
              latest_physical_progress: newProgress,
              latest_expenditure: Math.round((p.approved_cost * newSpend) / 100),
            };
          }
          return p;
        })
      );

      // Trigger Alert if threshold crossed
      if (shouldTriggerWarning) {
        const newSimAlert: AlertItem = {
          id: Date.now(),
          alert_code: `ALT-SIM-${nextMonth}`,
          project_id: prev.targetProjectId,
          project_name: prev.targetProjectName,
          project_code: prev.targetProjectCode,
          severity: newRisk >= 80 ? 'Critical' : 'High',
          type: `${profile.name} Threshold Breach`,
          title: `Simulated Early Warning: ${profile.name}`,
          message: profile.warningMessage,
          evidence: `Month ${nextMonth}: Risk score accelerated to ${newRisk}/100. ${profile.warningMessage}`,
          status: 'Active',
          owner: 'NHAI / Monitoring Cell',
          acknowledged_by: null,
          acknowledged_at: null,
          resolved_by: null,
          resolved_at: null,
          resolution_notes: null,
          created_at: new Date().toISOString(),
        };

        setAlerts((currAlerts) => [newSimAlert, ...currAlerts]);

        setNotifications((currNotifs) => [
          {
            id: `notif-${Date.now()}`,
            type: 'ALERT',
            title: `EARLY WARNING: ${prev.targetProjectCode}`,
            message: `Risk score escalated to ${newRisk}/100 (${newRisk >= 80 ? 'CRITICAL' : 'HIGH'}). Requires review.`,
            projectId: prev.targetProjectId,
            timestamp: 'Just now',
            read: false,
          },
          ...currNotifs,
        ]);

        // Increment active alerts count in dashboard
        setDashboardSummary((currSumm) => {
          if (!currSumm) return null;
          return {
            ...currSumm,
            kpis: {
              ...currSumm.kpis,
              active_alerts: currSumm.kpis.active_alerts + 1,
              critical_high_risk: currSumm.kpis.critical_high_risk + 1,
            },
          };
        });
      }

      return {
        ...prev,
        month: nextMonth,
        currentRisk: newRisk,
        riskDelta: delta,
        costRisk: newCost,
        timeRisk: newTime,
        physicalProgress: newProgress,
        financialExpenditureRatio: newSpend / 100,
        earlyWarningTriggered: prev.earlyWarningTriggered || shouldTriggerWarning,
        history: [
          ...prev.history,
          { month: nextMonth, risk: newRisk, physical: newProgress, spendRatio: newSpend },
        ],
      };
    });
  }, []);

  // Simulation playback loop
  useEffect(() => {
    if (simulation.isPlaying) {
      const intervalMs = Math.max(400, 1600 / simulation.speed);
      timerRef.current = setInterval(() => {
        stepSimulationForward();
      }, intervalMs);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [simulation.isPlaying, simulation.speed, stepSimulationForward]);

  const startSimulation = useCallback((scenario: SimulationScenario, projectId?: number) => {
    const profile = SCENARIO_PROFILES[scenario];
    const targetProj = projects.find((p) => p.id === (projectId || 1)) || projects[0] || {
      id: 1,
      code: 'PRJ-ROA-1042',
      name: 'National Highway Corridor NH-44 Bypass Package 3',
    };

    setSimulation({
      isActive: true,
      scenario,
      targetProjectId: targetProj.id,
      targetProjectCode: targetProj.code,
      targetProjectName: targetProj.name,
      month: 1,
      isPlaying: true,
      speed: 1,
      initialRisk: profile.baseRisk,
      currentRisk: profile.baseRisk,
      riskDelta: 0,
      costRisk: profile.costRiskCurve[0],
      timeRisk: profile.timeRiskCurve[0],
      progressRisk: 25,
      milestoneRisk: 30,
      physicalProgress: profile.progressCurve[0],
      financialExpenditureRatio: profile.spendCurve[0] / 100,
      earlyWarningTriggered: false,
      history: [{ month: 1, risk: profile.baseRisk, physical: profile.progressCurve[0], spendRatio: profile.spendCurve[0] }],
    });

    setNotifications((curr) => [
      {
        id: `notif-sim-start-${Date.now()}`,
        type: 'SYSTEM',
        title: `Simulation Initiated: ${profile.name}`,
        message: `Running 12-month synthetic progression on project ${targetProj.code}.`,
        projectId: targetProj.id,
        timestamp: 'Just now',
        read: false,
      },
      ...curr,
    ]);
  }, [projects]);

  const pauseSimulation = useCallback(() => {
    setSimulation((prev) => ({ ...prev, isPlaying: false }));
  }, []);

  const resumeSimulation = useCallback(() => {
    setSimulation((prev) => ({ ...prev, isPlaying: true }));
  }, []);

  const resetSimulation = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setSimulation((prev) => {
      const profile = SCENARIO_PROFILES[prev.scenario];
      return {
        ...prev,
        month: 1,
        isPlaying: false,
        currentRisk: prev.initialRisk,
        riskDelta: 0,
        costRisk: profile.costRiskCurve[0],
        timeRisk: profile.timeRiskCurve[0],
        physicalProgress: profile.progressCurve[0],
        financialExpenditureRatio: profile.spendCurve[0] / 100,
        earlyWarningTriggered: false,
        history: [{ month: 1, risk: prev.initialRisk, physical: profile.progressCurve[0], spendRatio: profile.spendCurve[0] }],
      };
    });
    refreshAllData();
  }, [refreshAllData]);

  const setSimulationSpeed = useCallback((speed: 1 | 2 | 5) => {
    setSimulation((prev) => ({ ...prev, speed }));
  }, []);

  const setSimulationMonth = useCallback((month: number) => {
    const clamped = Math.max(1, Math.min(12, month));
    setSimulation((prev) => {
      const profile = SCENARIO_PROFILES[prev.scenario];
      const mIdx = clamped - 1;
      const newRisk = profile.riskCurve[mIdx];
      return {
        ...prev,
        month: clamped,
        currentRisk: newRisk,
        riskDelta: Number((newRisk - prev.initialRisk).toFixed(1)),
        costRisk: profile.costRiskCurve[mIdx],
        timeRisk: profile.timeRiskCurve[mIdx],
        physicalProgress: profile.progressCurve[mIdx],
        financialExpenditureRatio: profile.spendCurve[mIdx] / 100,
      };
    });
  }, []);

  const acknowledgeAlert = useCallback(async (alertId: number, notes?: string) => {
    try {
      await apiAcknowledgeAlert(alertId, notes || 'Acknowledged via unified monitoring queue');
      setAlerts((curr) =>
        curr.map((a) => (a.id === alertId ? { ...a, status: 'Acknowledged' as const } : a))
      );
      setNotifications((curr) => [
        {
          id: `notif-ack-${Date.now()}`,
          type: 'SYSTEM',
          title: `Alert #${alertId} Acknowledged`,
          message: 'Monitoring officer acknowledgement recorded in compliance audit ledger.',
          timestamp: 'Just now',
          read: false,
        },
        ...curr,
      ]);
    } catch (err: any) {
      console.error('Failed to acknowledge alert:', err);
    }
  }, []);

  const resolveAlert = useCallback(async (alertId: number, notes?: string) => {
    try {
      await apiResolveAlert(alertId, notes || 'Resolved with verified mitigation actions');
      setAlerts((curr) =>
        curr.map((a) => (a.id === alertId ? { ...a, status: 'Resolved' as const } : a))
      );
      setDashboardSummary((curr) => {
        if (!curr) return null;
        return {
          ...curr,
          kpis: {
            ...curr.kpis,
            active_alerts: Math.max(0, curr.kpis.active_alerts - 1),
          },
        };
      });
      setNotifications((curr) => [
        {
          id: `notif-res-${Date.now()}`,
          type: 'SYSTEM',
          title: `Alert #${alertId} Resolved`,
          message: 'Mitigation plan logged and alert closed.',
          timestamp: 'Just now',
          read: false,
        },
        ...curr,
      ]);
    } catch (err: any) {
      console.error('Failed to resolve alert:', err);
    }
  }, []);

  const markNotificationAsRead = useCallback((id: string) => {
    setNotifications((curr) =>
      curr.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const resetDemo = useCallback(async () => {
    setLoading(true);
    try {
      await resetDemoEnvironment();
      await refreshAllData();
      setSimulation((prev) => ({
        ...prev,
        isActive: false,
        month: 1,
        isPlaying: false,
        currentRisk: 34,
        riskDelta: 0,
        earlyWarningTriggered: false,
      }));
      setNotifications([
        {
          id: `notif-reset-${Date.now()}`,
          type: 'SYSTEM',
          title: 'Demonstration Environment Reset',
          message: 'Restored deterministic synthetic dataset (seed=42) and recalibrated baseline models.',
          timestamp: 'Just now',
          read: false,
        },
      ]);
    } catch (err) {
      console.error('Failed to reset demo:', err);
    } finally {
      setLoading(false);
    }
  }, [refreshAllData]);

  return (
    <AppContext.Provider
      value={{
        projects,
        dashboardSummary,
        alerts,
        notifications,
        loading,
        isCommandCenterOpen,
        isSearchOpen,
        isSidebarCollapsed,
        simulation,
        selectedProjectForFocus,
        setCommandCenterOpen,
        setSearchOpen,
        setSidebarCollapsed,
        setSelectedProjectForFocus,
        startSimulation,
        pauseSimulation,
        resumeSimulation,
        stepSimulationForward,
        resetSimulation,
        setSimulationSpeed,
        setSimulationMonth,
        acknowledgeAlert,
        resolveAlert,
        markNotificationAsRead,
        clearNotifications,
        resetDemo,
        refreshAllData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

export const useAppContext = useApp;
