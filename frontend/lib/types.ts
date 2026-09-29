export interface User {
  id: number;
  name: string;
  email: string;
  role: 'Executive' | 'Officer' | 'Analyst' | 'Admin';
  active: boolean;
  created_at: string;
}

export interface ProjectListItem {
  id: number;
  code: string;
  name: string;
  ministry: string;
  department: string;
  sector: string;
  agency: string;
  approved_cost: number;
  revised_cost: number;
  start_date: string;
  target_date: string;
  status: string;
  latest_expenditure: number;
  latest_physical_progress: number;
  latest_schedule_progress: number;
  cost_risk: number;
  time_risk: number;
  overall_risk: number;
  risk_band: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  top_driver: string | null;
  last_updated: string | null;
  data_freshness_days: number;
}

export interface Milestone {
  id: number;
  name: string;
  planned_date: string;
  actual_date: string | null;
  status: 'Completed' | 'Pending' | 'Delayed';
  criticality: 'Critical' | 'High' | 'Medium' | 'Low';
}

export interface Snapshot {
  id: number;
  month: string;
  expenditure: number;
  physical_progress: number;
  schedule_progress: number;
  milestones_due: number;
  milestones_delayed: number;
}

export interface RiskDriver {
  id: number;
  driver: string;
  contribution: number;
  evidence: string;
  trend: string;
}

export interface RiskPrediction {
  id: number;
  model_version: string;
  dataset_version: string;
  cost_risk: number;
  time_risk: number;
  progress_risk: number;
  milestone_risk: number;
  data_quality_risk: number;
  overall_risk: number;
  risk_band: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  prediction_date: string;
  drivers: RiskDriver[];
}

export interface ProjectDetail extends ProjectListItem {
  milestones: Milestone[];
  snapshots: Snapshot[];
  latest_prediction: RiskPrediction | null;
  alerts?: AlertItem[];
}

export interface AlertItem {
  id: number;
  alert_code: string;
  project_id: number;
  project_name: string | null;
  project_code: string | null;
  severity: 'Critical' | 'High' | 'Moderate' | 'Low';
  type: string;
  title: string;
  message: string;
  evidence: string;
  status: 'Active' | 'Acknowledged' | 'Resolved';
  owner: string;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  resolution_notes: string | null;
  created_at: string;
}

export interface DashboardSummary {
  kpis: {
    total_projects: number;
    critical_high_risk: number;
    high_cost_risk: number;
    high_time_risk: number;
    active_alerts: number;
    data_freshness_label: string;
    dataset_label: string;
  };
  risk_distribution: {
    name: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
    count: number;
    percentage: number;
    color: string;
  }[];
  portfolio_performance_trend: {
    month: string;
    avg_physical_progress: number;
    avg_schedule_progress: number;
    total_expenditure_cr: number;
    progress_gap: number;
  }[];
  top_risk_projects: {
    rank: number;
    id: number;
    code: string;
    name: string;
    sector: string;
    agency: string;
    cost_risk: number;
    time_risk: number;
    overall_risk: number;
    risk_band: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
    status: string;
    top_driver: string;
  }[];
  sector_benchmarks: {
    sector: string;
    project_count: number;
    avg_cost_risk: number;
    avg_time_risk: number;
    avg_overall_risk: number;
    avg_physical_progress: number;
  }[];
  recent_alerts: {
    id: number;
    alert_code: string;
    project_id: number;
    project_name: string;
    severity: string;
    type: string;
    title: string;
    evidence: string;
    status: string;
    created_at: string;
  }[];
  disclaimer: string;
}

export interface ModelEvaluationRow {
  model_name: string;
  model_type: string;
  precision: number;
  recall: number;
  f1_score: number;
  pr_auc: number;
  mae: number;
  rmse: number;
  calibration_score: number;
  sample_size: number;
  status: string;
}
