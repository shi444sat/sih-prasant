from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
import pandas as pd
import io
from sqlalchemy.orm import Session

from app.database import get_db
from app.analytics.data_importer import validate_and_preview_data, ingest_dataframe
from app.models.settings import AuditLog
from app.auth.dependencies import get_current_user
from app.models.users import User

router = APIRouter(prefix="/data", tags=["Data Import"])

@router.post("/validate")
async def validate_upload(file: UploadFile = File(...)):
    """
    Validates uploaded CSV or Excel file structure and business constraints.
    Returns preview and validation summary without persisting to database.
    """
    contents = await file.read()
    filename = file.filename.lower()

    try:
        if filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(contents))
        elif filename.endswith(".xlsx") or filename.endswith(".xls"):
            df = pd.read_excel(io.BytesIO(contents))
        else:
            raise HTTPException(status_code=400, detail="Only CSV or Excel (.xlsx) files are supported.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read file: {str(e)}")

    validation_result = validate_and_preview_data(df)
    return validation_result

@router.post("/import")
async def import_data(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Validates and ingests CSV/Excel file, recalculating features, predictions, and alerts.
    """
    contents = await file.read()
    filename = file.filename.lower()

    try:
        if filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(contents))
        elif filename.endswith(".xlsx") or filename.endswith(".xls"):
            df = pd.read_excel(io.BytesIO(contents))
        else:
            raise HTTPException(status_code=400, detail="Only CSV or Excel (.xlsx) files are supported.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {str(e)}")

    validation = validate_and_preview_data(df)
    if not validation["is_valid"]:
        raise HTTPException(
            status_code=400,
            detail=f"Validation failed: {'; '.join(validation['errors'][:3])}"
        )

    result = ingest_dataframe(df, db)

    # Audit log
    audit = AuditLog(
        user_email=current_user.email,
        action="IMPORT_DATA",
        entity="Dataset",
        details=f"User {current_user.name} imported {len(df)} rows. {result['new_projects_created']} new projects."
    )
    db.add(audit)
    db.commit()

    return {
        "status": "success",
        "message": f"Successfully ingested {len(df)} records. Features, risk predictions, and alerts updated.",
        "details": result
    }
