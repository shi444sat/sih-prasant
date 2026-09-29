import pytest
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.models.projects import Project
from app.models.alerts import Alert
from app.models.predictions import RiskPrediction
from app.analytics.synthetic_generator import seed_database_with_synthetic_data
from app.ml.pipeline import train_and_evaluate_models
from app.reports.pdf_generator import generate_project_pdf

# Use in-memory SQLite for instant isolated E2E testing
TEST_DB_URL = "sqlite:///:memory:"
test_engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

@pytest.fixture(scope="module")
def test_db():
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    seed_database_with_synthetic_data(db, seed=42)
    yield db
    db.close()
    Base.metadata.drop_all(bind=test_engine)

def test_e2e_pipeline_chain(test_db):
    # 1. Verify projects seeded
    project_count = test_db.query(Project).count()
    assert project_count >= 50

    # 2. Verify predictions created
    pred_count = test_db.query(RiskPrediction).count()
    assert pred_count >= 50

    # 3. Verify alerts generated
    alert_count = test_db.query(Alert).count()
    assert alert_count > 0

    # 4. Test ML model training
    results = train_and_evaluate_models(test_db, version="test-run-1")
    assert len(results) >= 4
    for r in results:
        assert "model_name" in r
        assert 0.0 <= r["precision"] <= 1.0
        assert 0.0 <= r["recall"] <= 1.0
        assert 0.0 <= r["f1_score"] <= 1.0

    # 5. Test human action: Acknowledge an alert
    sample_alert = test_db.query(Alert).filter(Alert.status == "Active").first()
    assert sample_alert is not None
    sample_alert.status = "Acknowledged"
    sample_alert.acknowledged_by = "Senior Monitoring Officer"
    test_db.commit()

    refreshed_alert = test_db.query(Alert).filter(Alert.id == sample_alert.id).first()
    assert refreshed_alert.status == "Acknowledged"
    assert refreshed_alert.acknowledged_by == "Senior Monitoring Officer"

    # 6. Test PDF report generation
    target_project = test_db.query(Project).first()
    pdf_bytes = generate_project_pdf(target_project, test_db)
    assert len(pdf_bytes) > 1000
    assert pdf_bytes.startswith(b"%PDF")
