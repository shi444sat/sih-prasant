from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
import re

from app.database import get_db
from app.models.projects import Project
from app.models.predictions import RiskPrediction
from app.models.alerts import Alert
from app.models.snapshots import ProjectSnapshot

router = APIRouter(prefix="/assistant", tags=["Local Analytical Assistant"])

class QueryRequest(BaseModel):
    query: str

class QueryResponse(BaseModel):
    answer: str
    projects: list = []
    disclaimer: str = "Local rule-based intelligence assistant — completely offline, no paid LLM required."

@router.post("/query", response_model=QueryResponse)
def query_assistant(req: QueryRequest, db: Session = Depends(get_db)):
    q = req.query.strip().lower()

    # Question 1: "Which projects need attention?" / "high risk" / "critical"
    if any(k in q for k in ["need attention", "critical", "highest risk", "top risk"]):
        preds = (
            db.query(RiskPrediction)
            .filter(RiskPrediction.risk_band.in_(["CRITICAL", "HIGH"]))
            .order_by(RiskPrediction.overall_risk.desc())
            .limit(5)
            .all()
        )
        projs = []
        lines = ["Here are the top high/critical risk projects requiring urgent review:"]
        for i, pr in enumerate(preds, 1):
            p = pr.project
            top_d = pr.drivers[0].driver if pr.drivers else "High variance"
            lines.append(f"{i}. **{p.name}** ({p.code}) — Overall Risk: **{pr.overall_risk:.1f}/100** ({pr.risk_band}). Primary driver: *{top_d}*.")
            projs.append({
                "id": p.id,
                "code": p.code,
                "name": p.name,
                "risk": pr.overall_risk,
                "band": pr.risk_band
            })
        return QueryResponse(answer="\n\n".join(lines), projects=projs)

    # Question 2: "Why is Project [X] at risk?"
    match_code = re.search(r'(prj-[a-z0-9\-]+|p-\d+|\d{3})', q, re.IGNORECASE)
    if "why" in q or match_code:
        project = None
        if match_code:
            code_str = match_code.group(1).upper()
            project = db.query(Project).filter(Project.code.ilike(f"%{code_str}%")).first()
        if not project:
            # Check by any name match
            all_p = db.query(Project).all()
            for p in all_p:
                if any(word in p.name.lower() for word in q.split() if len(word) > 4):
                    project = p
                    break

        if project:
            pred = db.query(RiskPrediction).filter(
                RiskPrediction.project_id == project.id
            ).order_by(RiskPrediction.created_at.desc()).first()

            if pred:
                lines = [
                    f"**Analysis for {project.name} ({project.code}):**",
                    f"- **Overall Risk:** {pred.overall_risk:.1f}/100 ({pred.risk_band})",
                    f"- **Cost Risk:** {pred.cost_risk:.1f}/100 | **Time Risk:** {pred.time_risk:.1f}/100",
                    "**Key Contributing Signals (Explainable Evidence):**"
                ]
                for drv in pred.drivers:
                    lines.append(f"• **{drv.driver}** (+{drv.contribution:.1f} pts): {drv.evidence}")
                return QueryResponse(answer="\n".join(lines), projects=[{"id": project.id, "name": project.name}])

    # Question 3: "Which sector has highest risk?"
    if "sector" in q and any(k in q for k in ["highest", "risk", "worst", "average"]):
        projects = db.query(Project).all()
        sec_map = {}
        for p in projects:
            pr = db.query(RiskPrediction).filter(
                RiskPrediction.project_id == p.id
            ).order_by(RiskPrediction.created_at.desc()).first()
            if pr:
                sec_map.setdefault(p.sector, []).append(pr.overall_risk)
        
        sec_avgs = [(s, sum(v)/len(v)) for s, v in sec_map.items()]
        sec_avgs.sort(key=lambda x: x[1], reverse=True)
        
        top_s, top_v = sec_avgs[0]
        lines = [
            f"The sector with the highest average risk is **{top_s}** at **{top_v:.1f}/100**.",
            "Sector risk rankings:"
        ]
        for s, v in sec_avgs:
            lines.append(f"- **{s}**: {v:.1f}/100")
        return QueryResponse(answer="\n".join(lines))

    # Question 4: "Schedule risk above 70"
    if "schedule" in q or "time" in q:
        preds = (
            db.query(RiskPrediction)
            .filter(RiskPrediction.time_risk >= 65.0)
            .order_by(RiskPrediction.time_risk.desc())
            .limit(6)
            .all()
        )
        lines = ["Projects with severe schedule delay risk:"]
        projs = []
        for pr in preds:
            p = pr.project
            lines.append(f"- **{p.name}** ({p.code}) — Time Overrun Risk: **{pr.time_risk:.1f}/100** (Target: {p.target_date})")
            projs.append({"id": p.id, "code": p.code, "name": p.name, "time_risk": pr.time_risk})
        return QueryResponse(answer="\n".join(lines), projects=projs)

    # Default fallback
    return QueryResponse(
        answer=(
            "I can analyze infrastructure projects across the portfolio. Try asking:\n"
            "- *'Which projects need attention?'*\n"
            "- *'Why is Project PRJ-ROA-102 high risk?'*\n"
            "- *'Which sector has the highest average risk?'*\n"
            "- *'Show projects with schedule risk above 70.'*"
        )
    )
