from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class KPICards(BaseModel):
    total_projects: int
    critical_high_risk: int
    high_cost_risk: int
    high_time_risk: int
    active_alerts: int
    data_freshness_label: str
    dataset_label: str

class RiskDistributionItem(BaseModel):
    name: str  # LOW, MODERATE, HIGH, CRITICAL
    count: int
    percentage: float
    color: str

class SectorBenchmarkItem(BaseModel):
    sector: str
    project_count: int
    avg_cost_risk: float
    avg_time_risk: float
    avg_overall_risk: float
    avg_physical_progress: float

class AgencyBenchmarkItem(BaseModel):
    agency: str
    project_count: int
    avg_overall_risk: float
    avg_cost_overrun_pct: float

class TopRiskProjectItem(BaseModel):
    rank: int
    id: int
    code: str
    name: str
    sector: str
    agency: str
    cost_risk: float
    time_risk: float
    overall_risk: float
    risk_band: str
    status: str
    top_driver: str

class DashboardSummaryResponse(BaseModel):
    kpis: KPICards
    risk_distribution: List[RiskDistributionItem]
    portfolio_performance_trend: List[Dict[str, Any]]
    top_risk_projects: List[TopRiskProjectItem]
    sector_benchmarks: List[SectorBenchmarkItem]
    recent_alerts: List[Dict[str, Any]]
    disclaimer: str
