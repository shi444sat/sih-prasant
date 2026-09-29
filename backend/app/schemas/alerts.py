from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AlertBase(BaseModel):
    project_id: int
    severity: str
    type: str
    title: str
    message: str
    evidence: str
    owner: Optional[str] = "Project Monitoring Unit"

class AlertCreate(AlertBase):
    alert_code: str
    prediction_id: Optional[int] = None

class AlertUpdate(BaseModel):
    status: Optional[str] = None
    resolution_notes: Optional[str] = None

class AlertOut(BaseModel):
    id: int
    alert_code: str
    project_id: int
    project_name: Optional[str] = None
    project_code: Optional[str] = None
    severity: str
    type: str
    title: str
    message: str
    evidence: str
    status: str
    owner: str
    acknowledged_by: Optional[str] = None
    acknowledged_at: Optional[datetime] = None
    resolved_by: Optional[str] = None
    resolved_at: Optional[datetime] = None
    resolution_notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class AlertActionRequest(BaseModel):
    notes: Optional[str] = None
