from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class RiskPrediction(Base):
    __tablename__ = "risk_predictions"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    snapshot_id = Column(Integer, ForeignKey("project_snapshots.id", ondelete="CASCADE"), nullable=True, index=True)
    model_version = Column(String(50), nullable=False, default="v1.0-baseline")
    dataset_version = Column(String(50), nullable=False, default="demo-synthetic-v1")
    cost_risk = Column(Float, nullable=False)          # 0 - 100
    time_risk = Column(Float, nullable=False)          # 0 - 100
    progress_risk = Column(Float, nullable=False)      # 0 - 100
    milestone_risk = Column(Float, nullable=False)     # 0 - 100
    data_quality_risk = Column(Float, nullable=False)  # 0 - 100
    overall_risk = Column(Float, nullable=False)       # 0 - 100
    risk_band = Column(String(50), nullable=False)     # LOW, MODERATE, HIGH, CRITICAL
    prediction_date = Column(String(20), nullable=False) # YYYY-MM-DD
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    project = relationship("Project", back_populates="predictions")
    snapshot = relationship("ProjectSnapshot", back_populates="predictions")
    drivers = relationship("RiskDriver", back_populates="prediction", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="prediction", cascade="all, delete-orphan")
