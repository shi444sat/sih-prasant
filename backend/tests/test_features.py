import pytest
from app.analytics.features import calculate_snapshot_features

def test_feature_engineering_basic():
    project = {
        "approved_cost": 500.0,
        "revised_cost": 650.0,
        "start_date": "2023-01-01",
        "target_date": "2025-12-31",
        "sector": "Road Transport & Highways",
        "agency": "NHAI"
    }
    snapshots = [
        {"month": "2023-01", "expenditure": 50.0, "physical_progress": 8.0, "schedule_progress": 10.0, "milestones_due": 1, "milestones_delayed": 0},
        {"month": "2023-02", "expenditure": 120.0, "physical_progress": 15.0, "schedule_progress": 18.0, "milestones_due": 2, "milestones_delayed": 0},
        {"month": "2023-03", "expenditure": 210.0, "physical_progress": 22.0, "schedule_progress": 26.0, "milestones_due": 3, "milestones_delayed": 1},
    ]
    milestones = [
        {"name": "Land Clearances", "planned_date": "2023-02-15", "status": "Completed", "criticality": "High"},
        {"name": "Earthwork Package", "planned_date": "2023-03-01", "status": "Delayed", "criticality": "Critical"}
    ]

    features = calculate_snapshot_features(project, snapshots, milestones)

    # Asserts
    assert features["revised_approved_ratio"] == 1.3
    assert features["physical_progress"] == 22.0
    assert features["progress_delta"] == 7.0
    assert features["delayed_milestone_count"] >= 1.0
    assert "expenditure_ratio" in features
    assert "progress_gap" in features
    assert not any(features[k] != features[k] for k in features) # No NaNs!
