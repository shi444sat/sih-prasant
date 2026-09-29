from fastapi import APIRouter, Depends, Query
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models.projects import Project
from app.models.snapshots import ProjectSnapshot
from app.models.predictions import RiskPrediction
from app.models.alerts import Alert
from app.schemas.analytics import DashboardSummaryResponse, KPICards, RiskDistributionItem, SectorBenchmarkItem, TopRiskProjectItem

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(
    ministry: Optional[str] = None,
    sector: Optional[str] = None,
    agency: Optional[str] = None,
    status: Optional[str] = None,
    risk_level: Optional[str] = None,
    db: Session = Depends(get_db)
):
    # Base query for projects
    query = db.query(Project)
    if ministry and ministry != "All":
        query = query.filter(Project.ministry == ministry)
    if sector and sector != "All":
        query = query.filter(Project.sector == sector)
    if agency and agency != "All":
        query = query.filter(Project.agency == agency)
    if status and status != "All":
        query = query.filter(Project.status == status)

    all_filtered_projects = query.all()
    project_ids = [p.id for p in all_filtered_projects]

    if not project_ids:
        return {
            "kpis": {
                "total_projects": 0,
                "critical_high_risk": 0,
                "high_cost_risk": 0,
                "high_time_risk": 0,
                "active_alerts": 0,
                "data_freshness_label": "No projects match criteria",
                "dataset_label": "Synthetic Demonstration Dataset"
            },
            "risk_distribution": [],
            "portfolio_performance_trend": [],
            "top_risk_projects": [],
            "sector_benchmarks": [],
            "recent_alerts": [],
            "disclaimer": "DEMO DATA — SYNTHETIC DATASET | Configurable prototype policy — not an official government threshold."
        }

    # Fetch latest predictions for filtered projects
    all_preds = db.query(RiskPrediction).filter(
        RiskPrediction.project_id.in_(project_ids)
    ).order_by(RiskPrediction.created_at.desc()).all()

    # Deduplicate to latest prediction per project
    latest_preds_by_proj: Dict[int, RiskPrediction] = {}
    for pr in all_preds:
        if pr.project_id not in latest_preds_by_proj:
            latest_preds_by_proj[pr.project_id] = pr

    # Filter projects by risk level if requested
    filtered_project_map = {}
    for p in all_filtered_projects:
        pr = latest_preds_by_proj.get(p.id)
        band = pr.risk_band if pr else "LOW"
        if risk_level and risk_level != "All":
            if band.upper() != risk_level.upper():
                continue
        filtered_project_map[p.id] = (p, pr)

    total_projs = len(filtered_project_map)
    crit_high = 0
    high_cost = 0
    high_time = 0
    dist_counts = {"LOW": 0, "MODERATE": 0, "HIGH": 0, "CRITICAL": 0}

    ranked_items = []

    for p_id, (p, pr) in filtered_project_map.items():
        c_risk = pr.cost_risk if pr else 0.0
        t_risk = pr.time_risk if pr else 0.0
        o_risk = pr.overall_risk if pr else 0.0
        band = pr.risk_band if pr else "LOW"

        if band in ["HIGH", "CRITICAL"]:
            crit_high += 1
        if c_risk >= 60.0:
            high_cost += 1
        if t_risk >= 60.0:
            high_time += 1

        dist_counts[band] = dist_counts.get(band, 0) + 1

        top_drv = "Operational Variance"
        if pr and pr.drivers:
            top_drv = pr.drivers[0].driver

        ranked_items.append({
            "id": p.id,
            "code": p.code,
            "name": p.name,
            "sector": p.sector,
            "agency": p.agency,
            "cost_risk": c_risk,
            "time_risk": t_risk,
            "overall_risk": o_risk,
            "risk_band": band,
            "status": p.status,
            "top_driver": top_drv
        })

    # Sort descending by overall risk for Top Projects Requiring Review
    ranked_items.sort(key=lambda x: x["overall_risk"], reverse=True)
    top_10 = []
    for rank, item in enumerate(ranked_items[:10], start=1):
        item_copy = dict(item)
        item_copy["rank"] = rank
        top_10.append(item_copy)

    # Active alerts count
    active_alerts_query = db.query(Alert).filter(
        Alert.project_id.in_(list(filtered_project_map.keys())),
        Alert.status == "Active"
    )
    active_alerts_count = active_alerts_query.count()
    recent_alerts_objs = active_alerts_query.order_by(Alert.created_at.desc()).limit(6).all()
    recent_alerts = [
        {
            "id": a.id,
            "alert_code": a.alert_code,
            "project_id": a.project_id,
            "project_name": a.project.name if a.project else "",
            "severity": a.severity,
            "type": a.type,
            "title": a.title,
            "evidence": a.evidence,
            "status": a.status,
            "created_at": a.created_at.strftime("%Y-%m-%d")
        }
        for a in recent_alerts_objs
    ]

    # Risk Distribution Items
    dist_colors = {
        "LOW": "#16A34A",
        "MODERATE": "#D97706",
        "HIGH": "#EA580C",
        "CRITICAL": "#DC2626"
    }
    risk_distribution = []
    for band_name, count in dist_counts.items():
        pct = round((count / total_projs * 100), 1) if total_projs > 0 else 0.0
        risk_distribution.append({
            "name": band_name,
            "count": count,
            "percentage": pct,
            "color": dist_colors.get(band_name, "#2563EB")
        })

    # Portfolio Performance Trend (aggregated average over months)
    snaps_query = db.query(ProjectSnapshot).filter(
        ProjectSnapshot.project_id.in_(list(filtered_project_map.keys()))
    ).all()
    month_data: Dict[str, Dict[str, Any]] = {}
    for s in snaps_query:
        if s.month not in month_data:
            month_data[s.month] = {"exp": [], "phys": [], "sched": []}
        month_data[s.month]["exp"].append(s.expenditure)
        month_data[s.month]["phys"].append(s.physical_progress)
        month_data[s.month]["sched"].append(s.schedule_progress)

    trend_list = []
    for m in sorted(month_data.keys())[-12:]: # Last 12 months
        vals = month_data[m]
        avg_phys = round(float(sum(vals["phys"]) / len(vals["phys"])), 1) if vals["phys"] else 0.0
        avg_sched = round(float(sum(vals["sched"]) / len(vals["sched"])), 1) if vals["sched"] else 0.0
        total_exp = round(float(sum(vals["exp"])), 1)
        trend_list.append({
            "month": m,
            "avg_physical_progress": avg_phys,
            "avg_schedule_progress": avg_sched,
            "total_expenditure_cr": total_exp,
            "progress_gap": round(avg_sched - avg_phys, 1)
        })

    # Sector Benchmarks
    sector_groups: Dict[str, List[Dict[str, Any]]] = {}
    for p_id, (p, pr) in filtered_project_map.items():
        sec = p.sector
        if sec not in sector_groups:
            sector_groups[sec] = []
        c_risk = pr.cost_risk if pr else 0.0
        t_risk = pr.time_risk if pr else 0.0
        o_risk = pr.overall_risk if pr else 0.0
        
        # Get physical progress
        lat_snap = db.query(ProjectSnapshot).filter(
            ProjectSnapshot.project_id == p.id
        ).order_by(ProjectSnapshot.month.desc()).first()
        phy = lat_snap.physical_progress if lat_snap else 0.0

        sector_groups[sec].append({
            "cost_risk": c_risk,
            "time_risk": t_risk,
            "overall_risk": o_risk,
            "physical_progress": phy
        })

    sector_benchmarks = []
    for sec, items in sector_groups.items():
        n = len(items)
        sector_benchmarks.append({
            "sector": sec,
            "project_count": n,
            "avg_cost_risk": round(sum(x["cost_risk"] for x in items) / n, 1),
            "avg_time_risk": round(sum(x["time_risk"] for x in items) / n, 1),
            "avg_overall_risk": round(sum(x["overall_risk"] for x in items) / n, 1),
            "avg_physical_progress": round(sum(x["physical_progress"] for x in items) / n, 1)
        })
    sector_benchmarks.sort(key=lambda s: s["avg_overall_risk"], reverse=True)

    return {
        "kpis": {
            "total_projects": total_projs,
            "critical_high_risk": crit_high,
            "high_cost_risk": high_cost,
            "high_time_risk": high_time,
            "active_alerts": active_alerts_count,
            "data_freshness_label": "Last sync: 24h ago",
            "dataset_label": "Synthetic Demonstration Dataset"
        },
        "risk_distribution": risk_distribution,
        "portfolio_performance_trend": trend_list,
        "top_risk_projects": top_10,
        "sector_benchmarks": sector_benchmarks,
        "recent_alerts": recent_alerts,
        "disclaimer": "DEMO DATA — SYNTHETIC DATASET | Configurable prototype policy — not an official government threshold."
    }
