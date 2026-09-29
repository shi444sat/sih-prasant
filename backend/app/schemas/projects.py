from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class MilestoneOut(BaseModel):
    id: int
    name: str
    planned_date: str
    actual_date: Optional[str] = None
    status: str
    criticality: str

    class Config:
        from_attributes = True

class SnapshotOut(BaseModel):
    id: int
    month: str
    expenditure: float
    physical_progress: float
    schedule_progress: float
    milestones_due: int
    milestones_delayed: int

    class Config:
        from_attributes = True

class RiskDriverOut(BaseModel):
    id: int
    driver: str
    contribution: float
    evidence: str
    trend: str

    class Config:
        from_attributes = True

class PredictionOut(BaseModel):
    id: int
    model_version: str
    dataset_version: str
    cost_risk: float
    time_risk: float
    progress_risk: float
    milestone_risk: float
    data_quality_risk: float
    overall_risk: float
    risk_band: str
    prediction_date: str
    drivers: List[RiskDriverOut] = []

    class Config:
        from_attributes = True

class ProjectBase(BaseModel):
    code: str
    name: str
    ministry: str
    department: str
    sector: str
    agency: str
    approved_cost: float
    revised_cost: float
    start_date: str
    target_date: str
    status: str = "Ongoing"

class ProjectCreate(ProjectBase):
    pass

class ProjectListItem(BaseModel):
    id: int
    code: str
    name: str
    ministry: str
    department: str
    sector: str
    agency: str
    approved_cost: float
    revised_cost: float
    start_date: str
    target_date: str
    status: str
    latest_expenditure: Optional[float] = None
    latest_physical_progress: Optional[float] = None
    latest_schedule_progress: Optional[float] = None
    cost_risk: Optional[float] = None
    time_risk: Optional[float] = None
    overall_risk: Optional[float] = None
    risk_band: Optional[str] = "LOW"
    top_driver: Optional[str] = None
    last_updated: Optional[str] = None
    data_freshness_days: Optional[int] = 0

    class Config:
        from_attributes = True

class ProjectDetail(ProjectListItem):
    milestones: List[MilestoneOut] = []
    snapshots: List[SnapshotOut] = []
    latest_prediction: Optional[PredictionOut] = None

    class Config:
        from_attributes = True
