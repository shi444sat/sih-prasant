from fastapi import APIRouter, Depends, HTTPException
from typing import List
from datetime import datetime
import json
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.model_runs import ModelRun
from app.schemas.models import ModelEvaluationResponse, ModelEvaluationRow, TrainModelsResponse
from app.ml.pipeline import train_and_evaluate_models

router = APIRouter(prefix="/models", tags=["Model Evaluation & Training"])

@router.get("/evaluation", response_model=ModelEvaluationResponse)
def get_model_evaluation(db: Session = Depends(get_db)):
    """
    Returns comparative evaluation metrics for statistical baseline vs ML models.
    """
    runs = db.query(ModelRun).filter(ModelRun.is_active == True).order_by(ModelRun.training_date.desc()).all()
    
    # If no runs yet, run an initial evaluation
    if not runs:
        results = train_and_evaluate_models(db)
        if not results:
            return {
                "dataset_version": "demo-synthetic-v1",
                "evaluation_label": "Demo dataset evaluation",
                "models": [],
                "disclaimer": "Insufficient demonstration data for reliable model evaluation. Please seed or import data."
            }
        runs = db.query(ModelRun).filter(ModelRun.is_active == True).all()

    # Deduplicate by model_name (latest run)
    seen_models = set()
    model_rows = []
    for r in runs:
        if r.model_name in seen_models:
            continue
        seen_models.add(r.model_name)
        try:
            m_dict = json.loads(r.metrics)
            model_rows.append(ModelEvaluationRow(
                model_name=r.model_name,
                model_type=r.model_type,
                precision=m_dict.get("precision", 0.0),
                recall=m_dict.get("recall", 0.0),
                f1_score=m_dict.get("f1_score", 0.0),
                pr_auc=m_dict.get("pr_auc", 0.0),
                mae=m_dict.get("mae", 0.0),
                rmse=m_dict.get("rmse", 0.0),
                calibration_score=m_dict.get("calibration_score", 0.0),
                sample_size=m_dict.get("sample_size", r.training_samples),
                status=m_dict.get("status", "Active")
            ))
        except Exception:
            continue

    return {
        "dataset_version": "demo-synthetic-v1",
        "evaluation_label": "Demo dataset evaluation",
        "models": model_rows,
        "disclaimer": "Demo dataset evaluation — not official model accuracy. Models trained on synthetic demo timeline."
    }

@router.post("/train", response_model=TrainModelsResponse)
def trigger_train_models(db: Session = Depends(get_db)):
    """
    Triggers complete chronological train/test split and trains all models.
    """
    results = train_and_evaluate_models(db)
    if not results:
        raise HTTPException(
            status_code=400,
            detail="Insufficient demonstration data to train models."
        )

    model_names = [r["model_name"] for r in results]
    sample_count = results[0].get("sample_size", 0)

    return {
        "status": "success",
        "message": f"Successfully trained and evaluated {len(model_names)} models.",
        "models_trained": model_names,
        "training_samples": sample_count,
        "evaluated_at": datetime.utcnow()
    }
