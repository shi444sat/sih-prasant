import pytest
from app.risk.engine import calculate_sub_risks, compute_composite_risk, DEFAULT_POLICY

def test_risk_normalization():
    features = {
        "revised_approved_ratio": 1.45,
        "progress_gap": 25.0,
        "expenditure_ratio": 0.85,
        "schedule_progress": 80.0,
        "physical_progress": 50.0,
        "slippage_days": 100.0,
        "elapsed_percentage": 85.0,
        "progress_delta": 0.1,
        "progress_slope_3m": 0.2,
        "sector_median_gap": -15.0,
        "milestone_delay_rate": 60.0,
        "critical_delayed_count": 3.0,
        "missing_rate": 0.0,
        "data_update_age": 10.0
    }

    sub_risks = calculate_sub_risks(features)
    assert 0.0 <= sub_risks["cost_risk"] <= 100.0
    assert 0.0 <= sub_risks["time_risk"] <= 100.0
    assert 0.0 <= sub_risks["progress_risk"] <= 100.0
    assert 0.0 <= sub_risks["milestone_risk"] <= 100.0

    score, band = compute_composite_risk(sub_risks, DEFAULT_POLICY)
    assert 0.0 <= score <= 100.0
    assert band in ["LOW", "MODERATE", "HIGH", "CRITICAL"]
    # High signals should classify as HIGH or CRITICAL
    assert band in ["HIGH", "CRITICAL"]
