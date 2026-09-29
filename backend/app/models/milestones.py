from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Milestone(Base):
    __tablename__ = "milestones"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    planned_date = Column(String(20), nullable=False) # YYYY-MM-DD
    actual_date = Column(String(20), nullable=True)   # YYYY-MM-DD
    status = Column(String(50), nullable=False, default="Pending") # Completed, Pending, Delayed
    criticality = Column(String(50), nullable=False, default="Medium") # Critical, High, Medium, Low
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    project = relationship("Project", back_populates="milestones")
