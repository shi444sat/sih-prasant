"""
Risk Engine for Project Drishti
Computes sub-risk components and weighted composite risk scores.
Configurable prototype policy — not an official government threshold.
"""
from typing import Dict, Any, Tuple
import json
from sqlalchemy.orm import Session
from app.models.settings import SystemSetting

DEFAULT_POLICY = {
    "cost_weight": 0.30,
    "time_weight": 0.30,
    "progress_weight": 0.15,
    "milestone_weight": 0.15,
    "data_quality_weight": 0.10,
    "low_threshold": 30.0,
    "moderate_threshold": 60.0,
    "high_threshold": 80.0,
    "critical_threshold": 100.0,
    "disclaimer": "Configurable prototype policy — not an official government threshold."
}

def get_risk_policy(db: Session = None) -> Dict[str, Any]:
    if db:
        setting = db.query(SystemSetting).filter(SystemSetting.key == "risk_policy").first()
        if setting and setting.value:
            try:
                return json.loads(setting.value)
            except Exception:
                pass
    return DEFAULT_POLICY.copy()

def set_risk_policy(policy_data: Dict[str, Any], db: Session) -> Dict[str, Any]:
    setting = db.query(SystemSetting).filter(SystemSetting.key == "risk_policy").first()
    if not setting:
        setting = SystemSetting(
            key="risk_policy",
            value=json.dumps(policy_data),
            description="Configurable prototype policy for risk weights and thresholds"
        )
        db.add(setting)
    else:
        setting.value = json.dumps(policy_data)
    db.commit()
    return policy_data

def calculate_sub_risks(features: Dict[str, float]) -> Dict[str, float]:
    """
    Calculates sub-risk scores scaled 0-100 based on engineered indicators.
    """
    # 1. Cost Risk (0-100)
    # Ratio of revised to approved (>1.0 indicates cost escalation)
    rev_app_ratio = features.get("revised_approved_ratio", 1.0)
    cost_escalation_pct = max(0.0, (rev_app_ratio - 1.0) * 100.0)
    
    # Financial progress ahead of physical progress (spend divergence)
    prog_gap = max(0.0, features.get("progress_gap", 0.0))
    
    cost_risk = (
        min(40.0, cost_escalation_pct * 1.5) +  # up to 40 pts
        min(40.0, prog_gap * 1.6) +            # up to 40 pts
        min(20.0, features.get("expenditure_ratio", 0.0) * 20.0) # up to 20 pts
    )
    cost_risk = round(min(100.0, max(0.0, cost_risk)), 1)

    # 2. Time Risk (0-100)
    sched_gap = max(0.0, features.get("schedule_progress", 0.0) - features.get("physical_progress", 0.0))
    slippage_days = features.get("slippage_days", 0.0)
    elapsed_gap = max(0.0, features.get("elapsed_percentage", 0.0) - features.get("physical_progress", 0.0))

    time_risk = (
        min(45.0, sched_gap * 1.8) +
        min(35.0, elapsed_gap * 1.4) +
        min(20.0, (slippage_days / 15.0) * 5.0)
    )
    time_risk = round(min(100.0, max(0.0, time_risk)), 1)

    # 3. Progress Risk (0-100)
    delta = features.get("progress_delta", 0.0)
    slope = features.get("progress_slope_3m", 0.0)
    
    # Stagnation penalty
    stagnation_score = 0.0
    if delta <= 0.0:
        stagnation_score += 40.0
    elif delta < 1.0:
        stagnation_score += 25.0
    elif delta < 2.5:
        stagnation_score += 10.0

    if slope <= 0.2:
        stagnation_score += 35.0
    elif slope < 1.5:
        stagnation_score += 20.0

    sector_gap = features.get("sector_median_gap", 0.0)
    if sector_gap < -10.0:
        stagnation_score += 25.0
    elif sector_gap < 0:
        stagnation_score += 15.0

    progress_risk = round(min(100.0, max(0.0, stagnation_score)), 1)

    # 4. Milestone Risk (0-100)
    delay_rate = features.get("milestone_delay_rate", 0.0)
    critical_delayed = features.get("critical_delayed_count", 0.0)
    
    milestone_risk = (
        min(50.0, delay_rate * 0.6) +
        min(50.0, critical_delayed * 25.0)
    )
    milestone_risk = round(min(100.0, max(0.0, milestone_risk)), 1)

    # 5. Data Quality Risk (0-100)
    missing_rate = features.get("missing_rate", 0.0)
    age_days = features.get("data_update_age", 15.0)
    
    age_penalty = 0.0
    if age_days > 90:
        age_penalty = 70.0
    elif age_days > 45:
        age_penalty = 40.0
    elif age_days > 30:
        age_penalty = 20.0
        
    data_quality_risk = min(100.0, (missing_rate * 1.5) + age_penalty)
    data_quality_risk = round(min(100.0, max(0.0, data_quality_risk)), 1)

    return {
        "cost_risk": cost_risk,
        "time_risk": time_risk,
        "progress_risk": progress_risk,
        "milestone_risk": milestone_risk,
        "data_quality_risk": data_quality_risk
    }

def compute_composite_risk(
    sub_risks: Dict[str, float],
    policy: Dict[str, Any]
) -> Tuple[float, str]:
    """
    Computes overall risk score (0-100) and risk band (LOW, MODERATE, HIGH, CRITICAL).
    """
    cost_w = policy.get("cost_weight", 0.30)
    time_w = policy.get("time_weight", 0.30)
    prog_w = policy.get("progress_weight", 0.15)
    mile_w = policy.get("milestone_weight", 0.15)
    qual_w = policy.get("data_quality_weight", 0.10)

    # Normalize weights to ensure sum = 1.0
    total_w = cost_w + time_w + prog_w + mile_w + qual_w
    if total_w <= 0:
        total_w = 1.0

    raw_score = (
        (sub_risks["cost_risk"] * cost_w) +
        (sub_risks["time_risk"] * time_w) +
        (sub_risks["progress_risk"] * prog_w) +
        (sub_risks["milestone_risk"] * mile_w) +
        (sub_risks["data_quality_risk"] * qual_w)
    ) / total_w

    overall_score = round(min(100.0, max(0.0, raw_score)), 1)

    low_th = policy.get("low_threshold", 30.0)
    mod_th = policy.get("moderate_threshold", 60.0)
    high_th = policy.get("high_threshold", 80.0)

    if overall_score < low_th:
        band = "LOW"
    elif overall_score < mod_th:
        band = "MODERATE"
    elif overall_score < high_th:
        band = "HIGH"
    else:
        band = "CRITICAL"

    return overall_score, band
