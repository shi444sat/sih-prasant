from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from app.database import Base

class ModelRun(Base):
    __tablename__ = "model_runs"

    id = Column(Integer, primary_key=True, index=True)
    version = Column(String(50), unique=True, index=True, nullable=False)
    model_name = Column(String(100), nullable=False) # Logistic Regression, Ridge Regression, Random Forest, XGBoost
    model_type = Column(String(50), nullable=False)  # Classification, Regression, Baseline
    dataset_version = Column(String(50), nullable=False)
    features = Column(Text, nullable=False)          # JSON encoded list of features
    metrics = Column(Text, nullable=False)           # JSON encoded metrics (precision, recall, f1, pr_auc, mae, rmse, etc.)
    training_samples = Column(Integer, default=0)
    is_active = Column(Boolean, default=False)
    training_date = Column(DateTime, default=datetime.utcnow)
