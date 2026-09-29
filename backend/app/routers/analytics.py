from fastapi import APIRouter, Depends, Query
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.projects import Project
from app.models.snapshots import ProjectSnapshot
from app.models.predictions import RiskPrediction
from app.models.alerts import Alert

router = APIRouter(prefix="/analytics", tags=["Analytics & Benchmarking"])

@router.get("/overview")
def get_analytics_overview(
    sector: Optional[str] = None,
    agency: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Project)
    if sector and sector != "All":
        query = query.filter(Project.sector == sector)
    if agency and agency != "All":
        query = query.filter(Project.agency == agency)

    projects = query.all()
    p_ids = [p.id for p in projects]

    # Sector risk distribution
    sec_risk: Dict[str, List[float]] = {}
    agency_risk: Dict[str, List[float]] = {}
    status_dist: Dict[str, int] = {}
    cost_escalation_data = []

    for p in projects:
        status_dist[p.status] = status_dist.get(p.status, 0) + 1
        
        # Calculate cost overrun %
        if p.approved_cost > 0:
            esc_pct = max(0.0, ((p.revised_cost - p.approved_cost) / p.approved_cost) * 100.0)
            cost_escalation_data.append(esc_pct)

        pred = db.query(RiskPrediction).filter(
            RiskPrediction.project_id == p.id
        ).order_by(RiskPrediction.created_at.desc()).first()

        o_risk = pred.overall_risk if pred else 0.0

        if p.sector not in sec_risk:
            sec_risk[p.sector] = []
        sec_risk[p.sector].append(o_risk)

        if p.agency not in agency_risk:
            agency_risk[p.agency] = []
        agency_risk[p.agency].append(o_risk)

    sector_chart = [
        {"sector": s, "avg_risk": round(sum(v) / len(v), 1), "project_count": len(v)}
        for s, v in sec_risk.items()
    ]
    sector_chart.sort(key=lambda x: x["avg_risk"], reverse=True)

    agency_chart = [
        {"agency": a, "avg_risk": round(sum(v) / len(v), 1), "project_count": len(v)}
        for a, v in agency_risk.items()
    ]
    agency_chart.sort(key=lambda x: x["avg_risk"], reverse=True)

    # Risk driver frequency
    alert_type_counts = (
        db.query(Alert.type, func.count(Alert.id))
        .filter(Alert.project_id.in_(p_ids))
        .group_by(Alert.type)
        .all()
    )
    driver_freq = [{"driver": t, "count": c} for t, c in alert_type_counts]
    driver_freq.sort(key=lambda x: x["count"], reverse=True)

    return {
        "sector_risk_distribution": sector_chart,
        "agency_risk_distribution": agency_chart,
        "project_status_distribution": [{"status": k, "count": v} for k, v in status_dist.items()],
        "risk_driver_frequency": driver_freq,
        "avg_cost_escalation_pct": round(sum(cost_escalation_data) / len(cost_escalation_data), 1) if cost_escalation_data else 0.0,
        "disclaimer": "Prototype analytical definitions — not official MoSPI business rules."
    }

@router.get("/benchmarks")
def get_benchmarks_data(
    selected_project_id: Optional[int] = None,
    sector: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Returns comparative benchmarking metrics against sector medians and peer projects.
    """
    # Fetch all sectors with stats
    all_projects = db.query(Project).all()
    sector_stats: Dict[str, Dict[str, Any]] = {}

    for p in all_projects:
        sec = p.sector
        if sec not in sector_stats:
            sector_stats[sec] = {
                "sector": sec,
                "project_count": 0,
                "costs": [],
                "physical_progresses": [],
                "risks": []
            }

        lat_snap = db.query(ProjectSnapshot).filter(
            ProjectSnapshot.project_id == p.id
        ).order_by(ProjectSnapshot.month.desc()).first()

        pred = db.query(RiskPrediction).filter(
            RiskPrediction.project_id == p.id
        ).order_by(RiskPrediction.created_at.desc()).first()

        sector_stats[sec]["project_count"] += 1
        sector_stats[sec]["costs"].append(p.revised_cost)
        if lat_snap:
            sector_stats[sec]["physical_progresses"].append(lat_snap.physical_progress)
        if pred:
            sector_stats[sec]["risks"].append(pred.overall_risk)

    sector_benchmarks = []
    for s_name, data in sector_stats.items():
        phys = data["physical_progresses"]
        risks = data["risks"]
        costs = data["costs"]
        sector_benchmarks.append({
            "sector": s_name,
            "project_count": data["project_count"],
            "median_cost_cr": round(float(sorted(costs)[len(costs)//2]), 1) if costs else 0.0,
            "median_physical_progress": round(float(sorted(phys)[len(phys)//2]), 1) if phys else 0.0,
            "median_risk_score": round(float(sorted(risks)[len(risks)//2]), 1) if risks else 0.0,
            "avg_risk_score": round(sum(risks) / len(risks), 1) if risks else 0.0
        })

    # If selected project, compute direct peer comparison
    project_comparison = None
    target_project = None
    if selected_project_id:
        target_project = db.query(Project).filter(Project.id == selected_project_id).first()
    elif all_projects:
        target_project = all_projects[0]

    if target_project:
        lat_snap = db.query(ProjectSnapshot).filter(
            ProjectSnapshot.project_id == target_project.id
        ).order_by(ProjectSnapshot.month.desc()).first()

        pred = db.query(RiskPrediction).filter(
            RiskPrediction.project_id == target_project.id
        ).order_by(RiskPrediction.created_at.desc()).first()

        # Find peers in same sector
        peers = [p for p in all_projects if p.sector == target_project.sector and p.id != target_project.id]
        peer_phys = []
        peer_risks = []
        for peer in peers:
            p_snap = db.query(ProjectSnapshot).filter(
                ProjectSnapshot.project_id == peer.id
            ).order_by(ProjectSnapshot.month.desc()).first()
            p_pred = db.query(RiskPrediction).filter(
                RiskPrediction.project_id == peer.id
            ).order_by(RiskPrediction.created_at.desc()).first()
            if p_snap:
                peer_phys.append(p_snap.physical_progress)
            if p_pred:
                peer_risks.append(p_pred.overall_risk)

        peer_median_phys = round(float(sorted(peer_phys)[len(peer_phys)//2]), 1) if peer_phys else 50.0
        peer_median_risk = round(float(sorted(peer_risks)[len(peer_risks)//2]), 1) if peer_risks else 50.0

        target_phys = lat_snap.physical_progress if lat_snap else 0.0
        target_risk = pred.overall_risk if pred else 0.0

        project_comparison = {
            "project_id": target_project.id,
            "project_code": target_project.code,
            "project_name": target_project.name,
            "sector": target_project.sector,
            "agency": target_project.agency,
            "physical_progress": target_phys,
            "peer_median_physical_progress": peer_median_phys,
            "physical_progress_diff": round(target_phys - peer_median_phys, 1),
            "overall_risk": target_risk,
            "peer_median_risk": peer_median_risk,
            "risk_diff": round(target_risk - peer_median_risk, 1)
        }

    return {
        "sector_benchmarks": sector_benchmarks,
        "project_comparison": project_comparison,
        "disclaimer": "Do not claim these are official government benchmarks. Synthetic Demonstration Dataset."
    }
