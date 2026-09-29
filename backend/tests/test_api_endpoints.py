import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import engine, Base, SessionLocal
from app.analytics.synthetic_generator import seed_database_with_synthetic_data

@pytest.fixture(scope="module")
def client():
    # Trigger table creation and demo seeding
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    seed_database_with_synthetic_data(db, seed=42)
    db.close()

    with TestClient(app) as c:
        yield c

def test_health(client):
    res = client.get("/")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "online"
    assert "Synthetic Demonstration Dataset" in data["data_mode"]

def test_login_demo_credentials(client):
    # Admin login
    res = client.post("/auth/login", json={"email": "admin@drishti.local", "password": "admin123"})
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["role"] == "Admin"

    # Officer login
    res = client.post("/auth/login", json={"email": "officer@drishti.local", "password": "officer123"})
    assert res.status_code == 200
    assert res.json()["user"]["role"] == "Officer"

def test_dashboard_summary(client):
    res = client.get("/dashboard/summary")
    assert res.status_code == 200
    data = res.json()
    assert data["kpis"]["total_projects"] > 0
    assert len(data["risk_distribution"]) == 4
    assert len(data["top_risk_projects"]) <= 10
    assert "SYNTHETIC" in data["disclaimer"].upper()

def test_project_list_and_detail(client):
    res = client.get("/projects")
    assert res.status_code == 200
    projects = res.json()
    assert len(projects) > 0
    first_p = projects[0]

    # Detail
    res_det = client.get(f"/projects/{first_p['id']}")
    assert res_det.status_code == 200
    detail = res_det.json()
    assert detail["id"] == first_p["id"]
    assert "snapshots" in detail
    assert "milestones" in detail

def test_alerts_endpoint(client):
    res = client.get("/alerts")
    assert res.status_code == 200
    alerts = res.json()
    assert isinstance(alerts, list)

def test_analytics_and_benchmarks(client):
    res = client.get("/analytics/benchmarks")
    assert res.status_code == 200
    data = res.json()
    assert "sector_benchmarks" in data

def test_model_evaluation(client):
    res = client.get("/models/evaluation")
    assert res.status_code == 200
    data = res.json()
    assert "models" in data
    assert len(data["models"]) >= 4

def test_assistant_query(client):
    res = client.post("/assistant/query", json={"query": "Which projects need attention?"})
    assert res.status_code == 200
    data = res.json()
    assert len(data["answer"]) > 20
