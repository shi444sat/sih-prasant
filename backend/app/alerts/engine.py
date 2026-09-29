"""
Early Warning Engine for Project Drishti
Generates transparent, prioritized rule-based and anomaly-based early warnings.
"""
from typing import Dict, Any, List, Optional
from datetime import datetime
import uuid
from sqlalchemy.orm import Session
from app.models.alerts import Alert
from app.models.projects import Project

def evaluate_project_alerts(
    project: Project,
    features: Dict[str, float],
    sub_risks: Dict[str, float],
    overall_risk: float,
    prediction_id: Optional[int] = None,
    db: Optional[Session] = None
) -> List[Dict[str, Any]]:
    """
    Evaluates rule triggers against project features and returns alert items.
    """
    alerts_to_create = []

    # Helper to generate unique human-readable alert code
    def make_alert_code(prefix: str) -> str:
        return f"ALT-{prefix[:3].upper()}-{project.id}-{int(datetime.utcnow().timestamp()) % 100000}"

    # 1. Cost Escalation Rule
    if sub_risks.get("cost_risk", 0.0) >= 65.0:
        rev_app = features.get("revised_approved_ratio", 1.0)
        overrun_pct = (rev_app - 1.0) * 100.0 if rev_app > 1.0 else 0.0
        alerts_to_create.append({
            "alert_code": make_alert_code("CST"),
            "severity": "Critical" if sub_risks["cost_risk"] >= 80 else "High",
            "type": "Cost Escalation",
            "title": f"Critical Cost Escalation on {project.name}",
            "message": f"Cost risk score reached {sub_risks['cost_risk']}/100 with budget revision index of {rev_app:.2f}x.",
            "evidence": f"Approved cost: INR {project.approved_cost} Cr, Revised: INR {project.revised_cost} Cr (+{overrun_pct:.1f}%).",
            "owner": "Finance & Expenditure Division"
        })

    # 2. Schedule Delay Rule
    if sub_risks.get("time_risk", 0.0) >= 65.0:
        slip_days = features.get("slippage_days", 0.0)
        sched_prog = features.get("schedule_progress", 0.0)
        phy_prog = features.get("physical_progress", 0.0)
        alerts_to_create.append({
            "alert_code": make_alert_code("SCH"),
            "severity": "Critical" if sub_risks["time_risk"] >= 80 else "High",
            "type": "Schedule Delay",
            "title": f"Significant Schedule Lag on {project.name}",
            "message": f"Time overrun risk score is {sub_risks['time_risk']}/100. Target date: {project.target_date}.",
            "evidence": f"Planned schedule is {sched_prog:.1f}% vs physical progress {phy_prog:.1f}% (~{slip_days:.0f} slippage days).",
            "owner": "Project Monitoring Unit"
        })

    # 3. Spend / Progress Divergence Rule
    prog_gap = features.get("progress_gap", 0.0)
    if prog_gap >= 12.0:
        fin_prog = features.get("financial_progress", 0.0)
        phy_prog = features.get("physical_progress", 0.0)
        alerts_to_create.append({
            "alert_code": make_alert_code("DIV"),
            "severity": "High" if prog_gap >= 20.0 else "Moderate",
            "type": "Spend/Progress Divergence",
            "title": f"Material Financial vs Physical Progress Divergence",
            "message": f"Expenditure disbursement is outpacing physical site execution by {prog_gap:.1f}%.",
            "evidence": f"Financial utilization is {fin_prog:.1f}% while site progress is only {phy_prog:.1f}%.",
            "owner": "Quality & Audit Wing"
        })

    # 4. Progress Stagnation Rule
    delta = features.get("progress_delta", 0.0)
    slope = features.get("progress_slope_3m", 0.0)
    if (delta <= 0.2 and slope <= 0.5) and features.get("physical_progress", 0.0) < 95.0:
        alerts_to_create.append({
            "alert_code": make_alert_code("STG"),
            "severity": "High" if delta <= 0.0 else "Moderate",
            "type": "Progress Stagnation",
            "title": f"Work Stagnation Detected",
            "message": "Physical execution velocity has plateaued over recent consecutive reporting cycles.",
            "evidence": f"Last monthly progress delta was {delta:.2f}%; 3-month velocity slope is {slope:.2f}%/month.",
            "owner": "Executing Agency Liaison"
        })

    # 5. Milestone Slippage Rule
    crit_delayed = int(features.get("critical_delayed_count", 0))
    del_count = int(features.get("delayed_milestone_count", 0))
    if crit_delayed > 0 or del_count >= 2:
        alerts_to_create.append({
            "alert_code": make_alert_code("MLS"),
            "severity": "Critical" if crit_delayed >= 2 else "High",
            "type": "Milestone Slippage",
            "title": f"Critical Milestone Overdue",
            "message": f"{del_count} milestone(s) overdue, including {crit_delayed} high/critical impact milestones.",
            "evidence": f"Milestone delay rate is {features.get('milestone_delay_rate', 0.0):.1f}%. Immediate contractor review needed.",
            "owner": "Contract Management Division"
        })

    # 6. Data Staleness Rule
    age_days = features.get("data_update_age", 0.0)
    if age_days >= 45:
        alerts_to_create.append({
            "alert_code": make_alert_code("STL"),
            "severity": "Moderate" if age_days < 75 else "High",
            "type": "Data Stale",
            "title": f"Reporting Inactivity / Stale Record",
            "message": f"Project monitoring record has not been updated for {int(age_days)} days.",
            "evidence": f"Exceeds MoSPI monthly monitoring update cycle threshold of 30 days.",
            "owner": "Data Informatics & Innovation Division"
        })

    # If DB provided, check for active duplicates before saving
    created_records = []
    if db:
        for alert_dict in alerts_to_create:
            # Check if active alert of same type already exists for project
            existing = db.query(Alert).filter(
                Alert.project_id == project.id,
                Alert.type == alert_dict["type"],
                Alert.status == "Active"
            ).first()
            if not existing:
                alert = Alert(
                    alert_code=alert_dict["alert_code"],
                    project_id=project.id,
                    prediction_id=prediction_id,
                    severity=alert_dict["severity"],
                    type=alert_dict["type"],
                    title=alert_dict["title"],
                    message=alert_dict["message"],
                    evidence=alert_dict["evidence"],
                    status="Active",
                    owner=alert_dict["owner"]
                )
                db.add(alert)
                created_records.append(alert)
        db.commit()

    return alerts_to_create
