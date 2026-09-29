from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, List
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models.alerts import Alert
from app.models.projects import Project
from app.models.users import User
from app.models.settings import AuditLog
from app.schemas.alerts import AlertOut, AlertActionRequest
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/alerts", tags=["Alerts"])

@router.get("", response_model=List[AlertOut])
def list_alerts(
    severity: Optional[str] = None,
    type: Optional[str] = None,
    status: Optional[str] = None,
    project_id: Optional[int] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(Alert)

    if severity and severity != "All":
        query = query.filter(Alert.severity.ilike(severity))
    if type and type != "All":
        query = query.filter(Alert.type == type)
    if status and status != "All":
        query = query.filter(Alert.status == status)
    if project_id:
        query = query.filter(Alert.project_id == project_id)

    alerts = query.order_by(desc(Alert.created_at)).all()
    results = []

    for a in alerts:
        p = a.project
        if search:
            s_pat = search.lower()
            if not (s_pat in a.title.lower() or s_pat in a.evidence.lower() or (p and s_pat in p.name.lower())):
                continue

        results.append({
            "id": a.id,
            "alert_code": a.alert_code,
            "project_id": a.project_id,
            "project_name": p.name if p else None,
            "project_code": p.code if p else None,
            "severity": a.severity,
            "type": a.type,
            "title": a.title,
            "message": a.message,
            "evidence": a.evidence,
            "status": a.status,
            "owner": a.owner,
            "acknowledged_by": a.acknowledged_by,
            "acknowledged_at": a.acknowledged_at,
            "resolved_by": a.resolved_by,
            "resolved_at": a.resolved_at,
            "resolution_notes": a.resolution_notes,
            "created_at": a.created_at
        })

    return results[skip : skip + limit]

@router.post("/{id}/acknowledge", response_model=AlertOut)
def acknowledge_alert(
    id: int,
    req: AlertActionRequest = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    alert = db.query(Alert).filter(Alert.id == id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.status = "Acknowledged"
    alert.acknowledged_by = current_user.name
    alert.acknowledged_at = datetime.utcnow()
    if req and req.notes:
        alert.resolution_notes = req.notes

    audit = AuditLog(
        user_email=current_user.email,
        action="ACKNOWLEDGE_ALERT",
        entity=f"Alert {alert.alert_code}",
        details=f"Alert acknowledged by {current_user.name} ({current_user.role})."
    )
    db.add(audit)
    db.commit()
    db.refresh(alert)

    p = alert.project
    return {
        "id": alert.id,
        "alert_code": alert.alert_code,
        "project_id": alert.project_id,
        "project_name": p.name if p else None,
        "project_code": p.code if p else None,
        "severity": alert.severity,
        "type": alert.type,
        "title": alert.title,
        "message": alert.message,
        "evidence": alert.evidence,
        "status": alert.status,
        "owner": alert.owner,
        "acknowledged_by": alert.acknowledged_by,
        "acknowledged_at": alert.acknowledged_at,
        "resolved_by": alert.resolved_by,
        "resolved_at": alert.resolved_at,
        "resolution_notes": alert.resolution_notes,
        "created_at": alert.created_at
    }

@router.post("/{id}/resolve", response_model=AlertOut)
def resolve_alert(
    id: int,
    req: AlertActionRequest = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    alert = db.query(Alert).filter(Alert.id == id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.status = "Resolved"
    alert.resolved_by = current_user.name
    alert.resolved_at = datetime.utcnow()
    if req and req.notes:
        alert.resolution_notes = req.notes
    else:
        alert.resolution_notes = "Mitigation action initiated by monitoring unit."

    audit = AuditLog(
        user_email=current_user.email,
        action="RESOLVE_ALERT",
        entity=f"Alert {alert.alert_code}",
        details=f"Alert resolved by {current_user.name} ({current_user.role}). Notes: {alert.resolution_notes}"
    )
    db.add(audit)
    db.commit()
    db.refresh(alert)

    p = alert.project
    return {
        "id": alert.id,
        "alert_code": alert.alert_code,
        "project_id": alert.project_id,
        "project_name": p.name if p else None,
        "project_code": p.code if p else None,
        "severity": alert.severity,
        "type": alert.type,
        "title": alert.title,
        "message": alert.message,
        "evidence": alert.evidence,
        "status": alert.status,
        "owner": alert.owner,
        "acknowledged_by": alert.acknowledged_by,
        "acknowledged_at": alert.acknowledged_at,
        "resolved_by": alert.resolved_by,
        "resolved_at": alert.resolved_at,
        "resolution_notes": alert.resolution_notes,
        "created_at": alert.created_at
    }
