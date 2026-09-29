"""
Data Import & Ingestion Validation Engine for Project Drishti
Validates, parses, and ingests CSV/Excel monthly monitoring datasets,
triggering end-to-end recalculation of features, risk scores, and early warnings.
"""
from typing import Dict, Any, List, Tuple
from datetime import datetime
import pandas as pd
import numpy as np
from sqlalchemy.orm import Session

from app.models.projects import Project
from app.models.snapshots import ProjectSnapshot
from app.models.predictions import RiskPrediction
from app.models.risk_drivers import RiskDriver
from app.analytics.features import calculate_snapshot_features
from app.risk.engine import calculate_sub_risks, compute_composite_risk, get_risk_policy
from app.risk.explainability import generate_risk_drivers
from app.alerts.engine import evaluate_project_alerts

REQUIRED_COLUMNS = [
    "project_code",
    "project_name",
    "ministry",
    "sector",
    "agency",
    "approved_cost",
    "revised_cost",
    "start_date",
    "target_date",
    "month",
    "expenditure",
    "physical_progress",
    "schedule_progress"
]

def validate_and_preview_data(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Performs comprehensive structural and semantic validation on uploaded data.
    """
    total_rows = len(df)
    missing_cols = [c for c in REQUIRED_COLUMNS if c not in df.columns]
    
    if missing_cols:
        return {
            "is_valid": False,
            "total_rows": total_rows,
            "valid_rows": 0,
            "invalid_rows": total_rows,
            "errors": [f"Missing required columns: {', '.join(missing_cols)}"],
            "warnings": [],
            "preview": []
        }

    errors = []
    warnings = []
    valid_mask = pd.Series([True] * total_rows)

    # 1. Negative cost check
    neg_costs = (df["approved_cost"] < 0) | (df["revised_cost"] < 0) | (df["expenditure"] < 0)
    if neg_costs.any():
        bad_idx = df[neg_costs].index.tolist()
        errors.append(f"Rows {bad_idx[:5]} have negative cost or expenditure values.")
        valid_mask = valid_mask & (~neg_costs)

    # 2. Progress bounds check [0, 100]
    out_of_bounds = (
        (df["physical_progress"] < 0) | (df["physical_progress"] > 100) |
        (df["schedule_progress"] < 0) | (df["schedule_progress"] > 100)
    )
    if out_of_bounds.any():
        bad_idx = df[out_of_bounds].index.tolist()
        errors.append(f"Rows {bad_idx[:5]} have progress values outside 0% - 100%.")
        valid_mask = valid_mask & (~out_of_bounds)

    # 3. Date format validation
    date_err_rows = []
    for idx, row in df.iterrows():
        try:
            m_str = str(row["month"]).strip()
            if len(m_str) == 7: # YYYY-MM
                datetime.strptime(m_str, "%Y-%m")
            elif len(m_str) >= 10:
                datetime.strptime(m_str[:10], "%Y-%m-%d")
        except Exception:
            date_err_rows.append(idx)
            
    if date_err_rows:
        errors.append(f"Rows {date_err_rows[:5]} contain invalid month date formatting.")
        valid_mask.loc[date_err_rows] = False

    # 4. Duplicate project+month check
    dups = df.duplicated(subset=["project_code", "month"], keep=False)
    if dups.any():
        dup_idx = df[dups].index.tolist()
        warnings.append(f"Found {len(dup_idx)} duplicate project snapshot records (same code and month).")

    valid_count = int(valid_mask.sum())
    invalid_count = total_rows - valid_count

    # Preview sample
    preview_records = df.head(10).replace({np.nan: None}).to_dict(orient="records")

    return {
        "is_valid": len(errors) == 0,
        "total_rows": total_rows,
        "valid_rows": valid_count,
        "invalid_rows": invalid_count,
        "errors": errors,
        "warnings": warnings,
        "preview": preview_records
    }

def ingest_dataframe(df: pd.DataFrame, db: Session) -> Dict[str, Any]:
    """
    Ingests validated data, upserting projects and snapshots,
    recalculating features, risk predictions, drivers, and alerts.
    """
    policy = get_risk_policy(db)
    inserted_projects = 0
    inserted_snapshots = 0

    # Group by project_code
    grouped = df.groupby("project_code")

    for p_code, group in grouped:
        first_row = group.iloc[0]
        
        # Upsert project
        project = db.query(Project).filter(Project.code == p_code).first()
        if not project:
            project = Project(
                code=p_code,
                name=str(first_row.get("project_name", f"Project {p_code}")),
                ministry=str(first_row.get("ministry", "General Ministry")),
                department=str(first_row.get("department", "Infrastructure Wing")),
                sector=str(first_row.get("sector", "General")),
                agency=str(first_row.get("agency", "Executing Agency")),
                approved_cost=float(first_row.get("approved_cost", 100.0)),
                revised_cost=float(first_row.get("revised_cost", 100.0)),
                start_date=str(first_row.get("start_date", "2023-01-01"))[:10],
                target_date=str(first_row.get("target_date", "2026-12-31"))[:10],
                status="Ongoing"
            )
            db.add(project)
            db.flush()
            inserted_projects += 1
        else:
            # Update costs if revised
            project.revised_cost = float(first_row.get("revised_cost", project.revised_cost))
            db.flush()

        # Ingest snapshots
        for _, row in group.iterrows():
            m_str = str(row["month"]).strip()[:7]
            existing_snap = db.query(ProjectSnapshot).filter(
                ProjectSnapshot.project_id == project.id,
                ProjectSnapshot.month == m_str
            ).first()

            if not existing_snap:
                snap = ProjectSnapshot(
                    project_id=project.id,
                    month=m_str,
                    expenditure=float(row.get("expenditure", 0.0)),
                    physical_progress=float(row.get("physical_progress", 0.0)),
                    schedule_progress=float(row.get("schedule_progress", 0.0)),
                    milestones_due=int(row.get("milestones_due", 0)),
                    milestones_delayed=int(row.get("milestones_delayed", 0))
                )
                db.add(snap)
                inserted_snapshots += 1
            else:
                existing_snap.expenditure = float(row.get("expenditure", existing_snap.expenditure))
                existing_snap.physical_progress = float(row.get("physical_progress", existing_snap.physical_progress))
                existing_snap.schedule_progress = float(row.get("schedule_progress", existing_snap.schedule_progress))

        db.flush()

        # Fetch all snapshots chronologically for this project
        all_snaps = db.query(ProjectSnapshot).filter(
            ProjectSnapshot.project_id == project.id
        ).order_by(ProjectSnapshot.month.asc()).all()

        snaps_list = [
            {
                "month": s.month,
                "expenditure": s.expenditure,
                "physical_progress": s.physical_progress,
                "schedule_progress": s.schedule_progress,
                "milestones_due": s.milestones_due,
                "milestones_delayed": s.milestones_delayed
            }
            for s in all_snaps
        ]

        milestones_list = [
            {
                "name": m.name,
                "planned_date": m.planned_date,
                "status": m.status,
                "criticality": m.criticality
            }
            for m in project.milestones
        ]

        p_dict = {
            "approved_cost": project.approved_cost,
            "revised_cost": project.revised_cost,
            "start_date": project.start_date,
            "target_date": project.target_date,
            "sector": project.sector,
            "agency": project.agency
        }

        # Recalculate features
        features = calculate_snapshot_features(p_dict, snaps_list, milestones_list)
        sub_risks = calculate_sub_risks(features)
        overall_risk, risk_band = compute_composite_risk(sub_risks, policy)

        latest_snap_month = snaps_list[-1]["month"] if snaps_list else "2024-01"

        # Update or create prediction
        pred = db.query(RiskPrediction).filter(RiskPrediction.project_id == project.id).first()
        if not pred:
            pred = RiskPrediction(
                project_id=project.id,
                model_version="v1.0-imported-engine",
                dataset_version="user-import-v1",
                cost_risk=sub_risks["cost_risk"],
                time_risk=sub_risks["time_risk"],
                progress_risk=sub_risks["progress_risk"],
                milestone_risk=sub_risks["milestone_risk"],
                data_quality_risk=sub_risks["data_quality_risk"],
                overall_risk=overall_risk,
                risk_band=risk_band,
                prediction_date=f"{latest_snap_month}-28"
            )
            db.add(pred)
            db.flush()
        else:
            pred.cost_risk = sub_risks["cost_risk"]
            pred.time_risk = sub_risks["time_risk"]
            pred.progress_risk = sub_risks["progress_risk"]
            pred.milestone_risk = sub_risks["milestone_risk"]
            pred.data_quality_risk = sub_risks["data_quality_risk"]
            pred.overall_risk = overall_risk
            pred.risk_band = risk_band
            pred.prediction_date = f"{latest_snap_month}-28"
            db.flush()

        # Update drivers
        db.query(RiskDriver).filter(RiskDriver.prediction_id == pred.id).delete()
        drivers = generate_risk_drivers(features, sub_risks, policy)
        for drv in drivers:
            rd = RiskDriver(
                prediction_id=pred.id,
                driver=drv["driver"],
                contribution=drv["contribution"],
                evidence=drv["evidence"],
                trend=drv["trend"]
            )
            db.add(rd)

        # Trigger Early Warning evaluation
        evaluate_project_alerts(
            project=project,
            features=features,
            sub_risks=sub_risks,
            overall_risk=overall_risk,
            prediction_id=pred.id,
            db=db
        )

    db.commit()

    return {
        "status": "success",
        "projects_affected": len(grouped),
        "new_projects_created": inserted_projects,
        "snapshots_processed": inserted_snapshots
    }
