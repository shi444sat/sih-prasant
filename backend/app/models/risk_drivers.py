from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class RiskDriver(Base):
    __tablename__ = "risk_drivers"

    id = Column(Integer, primary_key=True, index=True)
    prediction_id = Column(Integer, ForeignKey("risk_predictions.id", ondelete="CASCADE"), nullable=False, index=True)
    driver = Column(String(150), nullable=False)        # E.g., Milestone Slippage, Financial-Physical Divergence
    contribution = Column(Float, nullable=False)       # Point contribution to risk score, e.g. +18.5
    evidence = Column(String(500), nullable=False)     # Concrete evidence metric
    trend = Column(String(50), default="Increasing")   # Increasing, Stable, Decreasing

    # Relationships
    prediction = relationship("RiskPrediction", back_populates="drivers")
