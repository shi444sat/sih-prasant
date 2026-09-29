from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class ProjectSnapshot(Base):
    __tablename__ = "project_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    month = Column(String(7), nullable=False, index=True)  # YYYY-MM
    expenditure = Column(Float, nullable=False)            # Cumulative In Crores INR
    physical_progress = Column(Float, nullable=False)      # 0 to 100%
    schedule_progress = Column(Float, nullable=False)      # 0 to 100%
    milestones_due = Column(Integer, default=0)
    milestones_delayed = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    project = relationship("Project", back_populates="snapshots")
    predictions = relationship("RiskPrediction", back_populates="snapshot", cascade="all, delete-orphan")
