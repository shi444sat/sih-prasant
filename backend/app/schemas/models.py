from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from datetime import datetime

class ModelEvaluationRow(BaseModel):
    model_name: str
    model_type: str
    precision: float
    recall: float
    f1_score: float
    pr_auc: float
    mae: float
    rmse: float
    calibration_score: float
    sample_size: int
    status: str

class ModelEvaluationResponse(BaseModel):
    dataset_version: str
    evaluation_label: str
    models: List[ModelEvaluationRow]
    disclaimer: str

class TrainModelsResponse(BaseModel):
    status: str
    message: str
    models_trained: List[str]
    training_samples: int
    evaluated_at: datetime

class ConfigPolicyUpdate(BaseModel):
    cost_weight: float
    time_weight: float
    progress_weight: float
    milestone_weight: float
    data_quality_weight: float
    low_threshold: float
    moderate_threshold: float
    high_threshold: float
    critical_threshold: float

class SystemSettingOut(BaseModel):
    key: str
    value: Any
    description: Optional[str] = None
    updated_at: datetime

    class Config:
        from_attributes = True

class AuditLogOut(BaseModel):
    id: int
    user_email: str
    action: str
    entity: Optional[str] = None
    details: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
