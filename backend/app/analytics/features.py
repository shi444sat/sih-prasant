"""
Feature Engineering Module for Project Drishti
Transforms historical project snapshots into analytical indicators.
Disclaimer: Prototype analytical definitions — not official MoSPI business rules.
"""
from typing import Dict, Any, List, Optional
from datetime import datetime
import numpy as np
import pandas as pd

def calculate_snapshot_features(
    project_dict: Dict[str, Any],
    snapshots: List[Dict[str, Any]],
    milestones: List[Dict[str, Any]],
    sector_medians: Optional[Dict[str, float]] = None
) -> Dict[str, float]:
    """
    Computes time-aware engineered features from project history without lookahead bias.
    """
    approved_cost = float(project_dict.get("approved_cost", 1.0))
    revised_cost = float(project_dict.get("revised_cost", approved_cost))
    if revised_cost <= 0:
        revised_cost = approved_cost if approved_cost > 0 else 1.0

    # Ensure snapshots are sorted chronologically
    sorted_snaps = sorted(snapshots, key=lambda s: s.get("month", ""))
    
    if not sorted_snaps:
        # Default fallback if no snapshots
        return {
            "expenditure_ratio": 0.0,
            "revised_approved_ratio": (revised_cost / approved_cost) if approved_cost > 0 else 1.0,
            "monthly_expenditure_change": 0.0,
            "financial_progress": 0.0,
            "physical_progress": 0.0,
            "schedule_progress": 0.0,
            "progress_gap": 0.0,
            "progress_delta": 0.0,
            "progress_slope_3m": 0.0,
            "elapsed_percentage": 0.0,
            "slippage_days": 0.0,
            "milestone_delay_rate": 0.0,
            "delayed_milestone_count": 0.0,
            "critical_delayed_count": 0.0,
            "sector_median_gap": 0.0,
            "peer_ratio": 1.0,
            "data_update_age": 30.0,
            "missing_rate": 0.0,
        }

    latest = sorted_snaps[-1]
    prev = sorted_snaps[-2] if len(sorted_snaps) >= 2 else sorted_snaps[-1]
    
    expenditure = float(latest.get("expenditure", 0.0))
    physical_progress = float(latest.get("physical_progress", 0.0))
    schedule_progress = float(latest.get("schedule_progress", 0.0))
    
    # 1. Cost indicators
    expenditure_ratio = (expenditure / revised_cost) if revised_cost > 0 else 0.0
    revised_approved_ratio = (revised_cost / approved_cost) if approved_cost > 0 else 1.0
    monthly_exp_change = expenditure - float(prev.get("expenditure", 0.0))
    financial_progress = min(100.0, (expenditure / revised_cost) * 100.0) if revised_cost > 0 else 0.0
    
    # 2. Progress indicators
    progress_delta = physical_progress - float(prev.get("physical_progress", 0.0))
    
    # 3-month slope
    if len(sorted_snaps) >= 3:
        p3 = float(sorted_snaps[-3].get("physical_progress", 0.0))
        p2 = float(sorted_snaps[-2].get("physical_progress", 0.0))
        p1 = physical_progress
        slope = (p1 - p3) / 2.0
    else:
        slope = progress_delta
    
    # 3. Schedule indicators
    try:
        start_dt = datetime.strptime(project_dict.get("start_date", "2023-01-01")[:10], "%Y-%m-%d")
        target_dt = datetime.strptime(project_dict.get("target_date", "2026-12-31")[:10], "%Y-%m-%d")
        total_duration = max(30, (target_dt - start_dt).days)
        
        # Calculate snapshot date (use month end)
        month_str = latest.get("month", "2024-01")
        snap_dt = datetime.strptime(f"{month_str}-01", "%Y-%m-%d")
        elapsed_days = max(0, (snap_dt - start_dt).days)
        elapsed_percentage = min(100.0, (elapsed_days / total_duration) * 100.0)
    except Exception:
        elapsed_percentage = schedule_progress

    progress_gap = financial_progress - physical_progress
    schedule_gap = schedule_progress - physical_progress
    slippage_days = max(0.0, schedule_gap * 3.65) # Approximation: 1% schedule lag ~ 3.65 days on a year scale

    # 4. Milestone indicators
    delayed_count = 0
    critical_delayed_count = 0
    total_due = int(latest.get("milestones_due", 0))
    
    for m in milestones:
        st = m.get("status", "Pending")
        crit = m.get("criticality", "Medium")
        p_date = m.get("planned_date", "")
        is_delayed = (st == "Delayed") or (st == "Pending" and p_date and p_date[:7] <= latest.get("month", "9999-99"))
        if is_delayed:
            delayed_count += 1
            if crit in ["Critical", "High"]:
                critical_delayed_count += 1

    if total_due > 0:
        milestone_delay_rate = (delayed_count / total_due) * 100.0
    else:
        milestone_delay_rate = (delayed_count * 20.0) if delayed_count > 0 else 0.0
    milestone_delay_rate = min(100.0, milestone_delay_rate)

    # 5. Benchmark comparisons
    sector = project_dict.get("sector", "General")
    sector_median = sector_medians.get(sector, 50.0) if sector_medians else 50.0
    sector_median_gap = physical_progress - sector_median
    peer_ratio = (physical_progress / sector_median) if sector_median > 0 else 1.0

    # 6. Data quality indicators
    missing_fields = 0
    total_fields = 8
    for f in ["approved_cost", "revised_cost", "start_date", "target_date", "sector", "agency"]:
        if not project_dict.get(f):
            missing_fields += 1
    missing_rate = (missing_fields / total_fields) * 100.0
    
    # Calculate days since snapshot month
    now = datetime.utcnow()
    try:
        snap_year, snap_month = map(int, latest.get("month", "2024-01").split("-"))
        snap_approx_dt = datetime(snap_year, snap_month, 28)
        data_update_age = max(0, (now - snap_approx_dt).days)
    except Exception:
        data_update_age = 15.0

    return {
        "expenditure_ratio": round(expenditure_ratio, 4),
        "revised_approved_ratio": round(revised_approved_ratio, 4),
        "monthly_expenditure_change": round(monthly_exp_change, 2),
        "financial_progress": round(financial_progress, 2),
        "physical_progress": round(physical_progress, 2),
        "schedule_progress": round(schedule_progress, 2),
        "progress_gap": round(progress_gap, 2),
        "progress_delta": round(progress_delta, 2),
        "progress_slope_3m": round(slope, 2),
        "elapsed_percentage": round(elapsed_percentage, 2),
        "slippage_days": round(slippage_days, 1),
        "milestone_delay_rate": round(milestone_delay_rate, 2),
        "delayed_milestone_count": float(delayed_count),
        "critical_delayed_count": float(critical_delayed_count),
        "sector_median_gap": round(sector_median_gap, 2),
        "peer_ratio": round(peer_ratio, 2),
        "data_update_age": float(data_update_age),
        "missing_rate": round(missing_rate, 2),
    }
