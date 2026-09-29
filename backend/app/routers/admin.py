from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models.users import User
from app.models.settings import SystemSetting, AuditLog
from app.models.model_runs import ModelRun
from app.schemas.users import UserOut, UserUpdate
from app.schemas.models import ConfigPolicyUpdate, AuditLogOut
from app.risk.engine import get_risk_policy, set_risk_policy
from app.auth.dependencies import get_current_user, require_role

router = APIRouter(prefix="/admin", tags=["Admin Panel"])

@router.get("/users", response_model=List[UserOut])
def list_users(
    current_user: User = Depends(require_role(["Admin"])),
    db: Session = Depends(get_db)
):
    return db.query(User).all()

@router.put("/users/{id}/role", response_model=UserOut)
def update_user_role(
    id: int,
    update: UserUpdate,
    current_user: User = Depends(require_role(["Admin"])),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if update.role:
        user.role = update.role
    if update.active is not None:
        user.active = update.active

    audit = AuditLog(
        user_email=current_user.email,
        action="UPDATE_USER",
        entity=f"User {user.email}",
        details=f"Updated role to {user.role}, active={user.active}"
    )
    db.add(audit)
    db.commit()
    db.refresh(user)
    return user

@router.get("/config")
def get_admin_config(db: Session = Depends(get_db)):
    policy = get_risk_policy(db)
    return {
        "policy": policy,
        "disclaimer": "Configurable prototype policy — not an official government threshold."
    }

@router.put("/config")
def update_admin_config(
    policy_update: ConfigPolicyUpdate,
    current_user: User = Depends(require_role(["Admin"])),
    db: Session = Depends(get_db)
):
    # Ensure weights sum to 1.0 approx
    w_sum = (
        policy_update.cost_weight + policy_update.time_weight +
        policy_update.progress_weight + policy_update.milestone_weight +
        policy_update.data_quality_weight
    )
    if abs(w_sum - 1.0) > 0.05:
        raise HTTPException(
            status_code=400,
            detail=f"Risk weights must sum to 1.0. Current sum is {w_sum:.2f}."
        )

    updated_policy = {
        "cost_weight": policy_update.cost_weight,
        "time_weight": policy_update.time_weight,
        "progress_weight": policy_update.progress_weight,
        "milestone_weight": policy_update.milestone_weight,
        "data_quality_weight": policy_update.data_quality_weight,
        "low_threshold": policy_update.low_threshold,
        "moderate_threshold": policy_update.moderate_threshold,
        "high_threshold": policy_update.high_threshold,
        "critical_threshold": policy_update.critical_threshold,
        "disclaimer": "Configurable prototype policy — not an official government threshold."
    }

    set_risk_policy(updated_policy, db)

    audit = AuditLog(
        user_email=current_user.email,
        action="UPDATE_CONFIG",
        entity="Risk Policy",
        details=f"Admin updated risk weights: Cost={policy_update.cost_weight}, Time={policy_update.time_weight}."
    )
    db.add(audit)
    db.commit()

    return {
        "status": "success",
        "policy": updated_policy,
        "disclaimer": "Configurable prototype policy — not an official government threshold."
    }

@router.get("/audit-logs", response_model=List[AuditLogOut])
def get_audit_logs(
    current_user: User = Depends(require_role(["Admin", "Executive"])),
    db: Session = Depends(get_db)
):
    return db.query(AuditLog).order_by(desc(AuditLog.created_at)).limit(100).all()

@router.post("/reset-demo")
def reset_demo_environment(
    db: Session = Depends(get_db)
):
    from app.analytics.synthetic_generator import seed_database_with_synthetic_data
    from app.ml.pipeline import train_and_evaluate_models
    
    seed_database_with_synthetic_data(db, seed=42, force_reset=True)
    train_and_evaluate_models(db, version="v1.0-reset")
    
    audit = AuditLog(
        user_email="system@drishti.local",
        action="RESET_DEMO_ENVIRONMENT",
        entity="Full Portfolio",
        details="Restored deterministic synthetic demonstration dataset (seed=42) and recalibrated baseline models."
    )
    db.add(audit)
    db.commit()
    
    return {
        "status": "success",
        "message": "Demo demonstration environment restored to clean baseline state."
    }

