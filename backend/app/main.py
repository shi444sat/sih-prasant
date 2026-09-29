from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.database import engine, Base, SessionLocal
from app.analytics.synthetic_generator import seed_database_with_synthetic_data
from app.ml.pipeline import train_and_evaluate_models

# Routers
from app.routers.auth import router as auth_router
from app.routers.projects import router as projects_router
from app.routers.dashboard import router as dashboard_router
from app.routers.alerts import router as alerts_router
from app.routers.analytics import router as analytics_router
from app.routers.models import router as models_router
from app.routers.data_import import router as data_import_router
from app.routers.admin import router as admin_router
from app.routers.assistant import router as assistant_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Create DB tables
    Base.metadata.create_all(bind=engine)
    
    # 2. Seed synthetic dataset on startup if Demo Mode is enabled
    db = SessionLocal()
    try:
        if settings.DEMO_MODE:
            seed_database_with_synthetic_data(db, seed=42)
            # Ensure model runs are populated
            train_and_evaluate_models(db, version="v1.0-init")
    finally:
        db.close()
        
    yield

app = FastAPI(
    title="PROJECT DRISHTI - Infrastructure Project Intelligence & Early Warning System",
    description=(
        "Web-based integrated infrastructure project-monitoring platform for SIH26103 (MoSPI DIID).\n\n"
        "**Pipeline**: DATA → INDICATORS → PREDICTION → EXPLANATION → EARLY WARNING → HUMAN ACTION.\n\n"
        "**Data Integrity Notice**: All demonstration records are synthetic. "
        "Configurable prototype policy — not an official government threshold."
    ),
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if settings.CORS_ORIGINS else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth_router)
app.include_router(dashboard_router)
app.include_router(projects_router)
app.include_router(alerts_router)
app.include_router(analytics_router)
app.include_router(models_router)
app.include_router(data_import_router)
app.include_router(admin_router)
app.include_router(assistant_router)

@app.get("/", tags=["Health"])
def health_check():
    return {
        "status": "online",
        "service": "Project Drishti Intelligence Engine",
        "data_mode": "Synthetic Demonstration Dataset",
        "disclaimer": settings.POLICY_DISCLAIMER
    }
