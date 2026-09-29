from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    alert_code = Column(String(50), unique=True, index=True, nullable=False) # E.g. ALT-2026-001
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    prediction_id = Column(Integer, ForeignKey("risk_predictions.id", ondelete="SET NULL"), nullable=True, index=True)
    severity = Column(String(20), nullable=False, index=True) # Critical, High, Moderate, Low
    type = Column(String(50), nullable=False, index=True)     # Cost Escalation, Schedule Delay, Progress Stagnation, Spend/Progress Divergence, Milestone Slippage, Data Stale, Multivariate Anomaly
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    evidence = Column(Text, nullable=False)
    status = Column(String(30), nullable=False, default="Active", index=True) # Active, Acknowledged, Resolved
    owner = Column(String(100), default="Project Monitoring Unit")
    acknowledged_by = Column(String(100), nullable=True)
    acknowledged_at = Column(DateTime, nullable=True)
    resolved_by = Column(String(100), nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    resolution_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    project = relationship("Project", back_populates="alerts")
    prediction = relationship("RiskPrediction", back_populates="alerts")
