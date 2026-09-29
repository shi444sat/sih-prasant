from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.orm import relationship
from app.database import Base

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    ministry = Column(String(150), nullable=False, index=True)
    department = Column(String(150), nullable=False)
    sector = Column(String(100), nullable=False, index=True)
    agency = Column(String(150), nullable=False, index=True)
    approved_cost = Column(Float, nullable=False)  # In Crores INR
    revised_cost = Column(Float, nullable=False)
    start_date = Column(String(20), nullable=False)  # YYYY-MM-DD
    target_date = Column(String(20), nullable=False) # YYYY-MM-DD
    status = Column(String(50), nullable=False, default="Ongoing") # Ongoing, Delayed, Critical, Completed
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    snapshots = relationship("ProjectSnapshot", back_populates="project", cascade="all, delete-orphan")
    milestones = relationship("Milestone", back_populates="project", cascade="all, delete-orphan")
    predictions = relationship("RiskPrediction", back_populates="project", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="project", cascade="all, delete-orphan")
