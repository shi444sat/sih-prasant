"""
Synthetic Demonstration Dataset Generator for Project Drishti
Generates 60 realistic infrastructure projects across 7 sectors with 12-24 monthly snapshots,
milestones, and distinct risk profiles.
Deterministic random seed (42).
DISCLAIMER: "DEMO DATA — SYNTHETIC DEMONSTRATION DATASET (Not official PAIMANA/MoSPI data)"
"""
import random
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Dict, Any
from sqlalchemy.orm import Session

from app.models.projects import Project
from app.models.snapshots import ProjectSnapshot
from app.models.milestones import Milestone
from app.models.predictions import RiskPrediction
from app.models.risk_drivers import RiskDriver
from app.models.alerts import Alert
from app.models.users import User
from app.auth.security import get_password_hash
from app.analytics.features import calculate_snapshot_features
from app.risk.engine import calculate_sub_risks, compute_composite_risk, get_risk_policy
from app.risk.explainability import generate_risk_drivers
from app.alerts.engine import evaluate_project_alerts

SECTORS_DATA = [
    {
        "sector": "Road Transport & Highways",
        "ministry": "Ministry of Road Transport and Highways",
        "department": "Department of Highways",
        "agencies": ["NHAI", "NHIDCL"]
    },
    {
        "sector": "Railways",
        "ministry": "Ministry of Railways",
        "department": "Railway Board",
        "agencies": ["RVNL", "IRCON", "DFCCIL"]
    },
    {
        "sector": "Power & Renewable Energy",
        "ministry": "Ministry of Power",
        "department": "Central Electricity Authority",
        "agencies": ["NTPC", "POWERGRID", "NHPC", "SECI"]
    },
    {
        "sector": "Petroleum & Natural Gas",
        "ministry": "Ministry of Petroleum and Natural Gas",
        "department": "Exploration & Production Wing",
        "agencies": ["ONGC", "IOCL", "GAIL", "BPCL"]
    },
    {
        "sector": "Urban Infrastructure & Metro",
        "ministry": "Ministry of Housing and Urban Affairs",
        "department": "Urban Transport Division",
        "agencies": ["DMRC", "MMRDA", "BMRCL"]
    },
    {
        "sector": "Water Resources & Sanitation",
        "ministry": "Ministry of Jal Shakti",
        "department": "National River Conservation Directorate",
        "agencies": ["NWDA", "WAPCOS", "SMC"]
    },
    {
        "sector": "Shipping, Ports & Waterways",
        "ministry": "Ministry of Ports, Shipping and Waterways",
        "department": "Sagarmala Development Cell",
        "agencies": ["JNPT", "Deendayal Port Trust", "IWAI"]
    }
]

PROJECT_ARCHETYPES = [
    "Healthy High-Performer",
    "Cost Escalation Case",
    "Schedule Delay Case",
    "Progress Stagnation Case",
    "Milestone Slippage Case",
    "Spend/Progress Divergence Case",
    "Data Reporting Stale Case",
    "Multi-Risk Compounded Crisis"
]

def generate_synthetic_data(seed: int = 42) -> List[Dict[str, Any]]:
    random.seed(seed)
    np.random.seed(seed)

    projects_data = []
    project_idx = 101

    # Generate 64 realistic infrastructure projects
    for sec_info in SECTORS_DATA:
        sector = sec_info["sector"]
        ministry = sec_info["ministry"]
        dept = sec_info["department"]
        agencies = sec_info["agencies"]

        # 9 projects per sector (approx 63 total)
        for i in range(9):
            agency = agencies[i % len(agencies)]
            archetype = PROJECT_ARCHETYPES[(project_idx) % len(PROJECT_ARCHETYPES)]
            code = f"PRJ-{sector[:3].upper()}-{project_idx}"
            
            # Realistic naming
            names_by_sector = {
                "Road Transport & Highways": [
                    "4-Laning of NH-44 Corridor Section IV",
                    "Eastern Peripheral Expressway Link Package B",
                    "Varanasi-Ranchi-Kolkata Access Controlled Highway",
                    "Delhi-Dehradun Economic Corridor Package 2",
                    "Bengaluru-Chennai Expressway Section III",
                    "Raipur-Visakhapatnam Highway Stretch 5",
                    "Siliguri Ring Road Construction",
                    "Western Dedicated Bypass NH-48",
                    "Hill Highway Improvement Project Phase II"
                ],
                "Railways": [
                    "Dedicated Freight Corridor Western Arm Reach 3",
                    "Rishikesh-Karnaprayag Rail Link Package 4",
                    "Bhairabi-Sairang New Railway Line Project",
                    "Bilaspur-Manali-Leh Strategic Rail Alignment",
                    "Doubling of Hubballi-Chikjajur Rail Route",
                    "Electrification of Lumding-Badarpur Section",
                    "Multi-Modal Logistic Rail Hub Dadri",
                    "3rd Line Track Laying Nagpur-Wardha",
                    "High-Speed Rail Corridor Geotechnical Works"
                ],
                "Power & Renewable Energy": [
                    "765kV D/C Transmission System Phase 3",
                    "Subansiri Lower Hydroelectric Project Unit 5",
                    "Ultra Mega Solar Park Grid Connectivity 1200MW",
                    "Green Hydrogen Hybrid Facility Phase I",
                    "Kawas Combined Cycle Power Plant Renovation",
                    "Western Region Energy Storage Battery Bank",
                    "Inter-Regional Grid Interconnector Package B",
                    "Floating Solar Photovoltaic Plant 100MW",
                    "Supercritical Thermal Power Unit Extension"
                ],
                "Petroleum & Natural Gas": [
                    "Urja Ganga Gas Pipeline Extension Reach 2",
                    "Paradip-Hyderabad Multi-Product Pipeline",
                    "Mumbai High Deepwater Offshore Redevelopment",
                    "North East Gas Grid Cluster C Pipeline",
                    "LPG Bottling & Strategic Storage Facility",
                    "Barauni Refinery Capacity Expansion Phase II",
                    "City Gas Distribution Network Sector 7",
                    "Crude Oil Underground Cavern Strategic Reserve",
                    "Bio-Ethanol 2G Production Plant"
                ],
                "Urban Infrastructure & Metro": [
                    "Metro Line 4 Elevated Viaduct & 8 Stations",
                    "Underground Tunneling Boring Reach 2",
                    "Smart City Automated Traffic Management Network",
                    "Multi-Modal Transit Terminal & Skywalk Complex",
                    "Suburban Commuter Rail Corridor Phase 1",
                    "Water Metro Hybrid Ferry Terminal Package",
                    "Ring Road Elevated Corridor Flyover Stretch",
                    "Automated Fare Collection & Signalling Overhaul",
                    "Zero Emission Electric Bus Depot & Depot Infra"
                ],
                "Water Resources & Sanitation": [
                    "Ken-Betwa River Linkage Canal Reach 1",
                    "Jal Jeevan Bulk Water Grid Distribution Cluster 4",
                    "Comprehensive River Front Flood Protection Works",
                    "Sewage Treatment Plant 120 MLD & Interceptor",
                    "Polavaram Irrigation Left Main Canal",
                    "Micro-Irrigation Solar Pumping Lift Network",
                    "Urban Drainage & Stormwater Channel Overhaul",
                    "Desalination Coastal Potable Water Plant",
                    "Aquifer Recharge Deep Borehole Cluster"
                ],
                "Shipping, Ports & Waterways": [
                    "Deep Draft Container Berth Construction Package 3",
                    "National Waterway 1 Multi-Modal Terminal Extension",
                    "Outer Harbour Breakwater & Capital Dredging",
                    "Automated Container Cargo Handling Yard",
                    "Coastal Ro-Pax Ferry Jetty Construction",
                    "Inland Navigation Lock Gate Rehabilitation",
                    "Port Connectivity Expressway 6-Lane Link",
                    "LNG Bunker Storage & Bunkering Terminal",
                    "Ship Repair Dry Dock Modernization Phase 1"
                ]
            }

            p_name = names_by_sector[sector][i % len(names_by_sector[sector])]
            
            # Base budget in Crores
            cost_tier = random.choice(["Small", "Medium", "Mega"])
            if cost_tier == "Small":
                app_cost = round(random.uniform(90.0, 350.0), 2)
            elif cost_tier == "Medium":
                app_cost = round(random.uniform(400.0, 1800.0), 2)
            else:
                app_cost = round(random.uniform(2200.0, 8500.0), 2)

            # Dates
            start_year = random.choice([2022, 2023])
            start_month = random.randint(1, 6)
            start_date = f"{start_year}-{start_month:02d}-15"
            
            dur_months = random.randint(30, 48)
            target_dt = datetime.strptime(start_date, "%Y-%m-%d") + timedelta(days=dur_months * 30)
            target_date = target_dt.strftime("%Y-%m-%d")

            # Archetype risk adjustment
            rev_cost = app_cost
            if archetype in ["Cost Escalation Case", "Multi-Risk Compounded Crisis"]:
                rev_cost = round(app_cost * random.uniform(1.25, 1.58), 2)
            elif archetype in ["Spend/Progress Divergence Case"]:
                rev_cost = round(app_cost * random.uniform(1.10, 1.25), 2)
            elif random.random() < 0.2:
                rev_cost = round(app_cost * random.uniform(1.02, 1.08), 2)

            num_snapshots = random.randint(14, 24)
            # If data reporting stale, end snapshots 3-4 months ago
            end_offset = 3 if archetype == "Data Reporting Stale Case" else 0

            # Monthly progression simulation
            snapshots = []
            cur_phys = 0.0
            cur_exp = 0.0

            # Base project month starts
            cur_dt = datetime.strptime(start_date, "%Y-%m-%d")

            for m_idx in range(num_snapshots - end_offset):
                m_str = (cur_dt + timedelta(days=m_idx * 30)).strftime("%Y-%m")
                sched_expected = min(100.0, round(((m_idx + 1) / dur_months) * 100.0, 1))

                # Simulate physical progress increments based on archetype
                if archetype == "Healthy High-Performer":
                    inc = random.uniform(2.5, 4.8)
                    cur_phys = min(98.0, cur_phys + inc)
                    exp_ratio = (cur_phys / 100.0) * random.uniform(0.92, 1.05)
                elif archetype == "Cost Escalation Case":
                    inc = random.uniform(1.5, 3.2)
                    cur_phys = min(85.0, cur_phys + inc)
                    exp_ratio = min(1.0, (cur_phys / 100.0) * random.uniform(1.25, 1.50))
                elif archetype == "Schedule Delay Case":
                    inc = random.uniform(0.8, 1.8)
                    cur_phys = min(60.0, cur_phys + inc)
                    exp_ratio = (cur_phys / 100.0) * random.uniform(1.0, 1.15)
                elif archetype == "Progress Stagnation Case":
                    # Slows to a crawl in recent 4 months
                    if m_idx >= (num_snapshots - end_offset - 4):
                        inc = random.uniform(0.0, 0.2)
                    else:
                        inc = random.uniform(2.0, 3.5)
                    cur_phys = min(72.0, cur_phys + inc)
                    exp_ratio = (cur_phys / 100.0) * random.uniform(1.0, 1.2)
                elif archetype == "Milestone Slippage Case":
                    inc = random.uniform(1.2, 2.5)
                    cur_phys = min(65.0, cur_phys + inc)
                    exp_ratio = (cur_phys / 100.0) * random.uniform(1.05, 1.20)
                elif archetype == "Spend/Progress Divergence Case":
                    inc = random.uniform(1.0, 2.0)
                    cur_phys = min(48.0, cur_phys + inc)
                    # Disbursed heavily
                    exp_ratio = min(0.95, (cur_phys / 100.0) * random.uniform(1.6, 2.1))
                elif archetype == "Data Reporting Stale Case":
                    inc = random.uniform(2.0, 3.5)
                    cur_phys = min(55.0, cur_phys + inc)
                    exp_ratio = (cur_phys / 100.0) * random.uniform(0.98, 1.08)
                else: # Multi-risk
                    if m_idx >= (num_snapshots - 5):
                        inc = random.uniform(0.1, 0.4)
                    else:
                        inc = random.uniform(1.0, 2.0)
                    cur_phys = min(52.0, cur_phys + inc)
                    exp_ratio = min(0.98, (cur_phys / 100.0) * random.uniform(1.5, 1.9))

                cur_exp = round(min(rev_cost * 1.05, rev_cost * exp_ratio), 2)
                cur_phys = round(min(100.0, cur_phys), 1)

                due_miles = min(8, int((sched_expected / 100.0) * 8))
                del_miles = 0
                if archetype in ["Milestone Slippage Case", "Multi-Risk Compounded Crisis"]:
                    del_miles = min(due_miles, max(1, int(due_miles * 0.6)))
                elif archetype in ["Schedule Delay Case"]:
                    del_miles = min(due_miles, max(1, int(due_miles * 0.35)))
                elif random.random() < 0.2:
                    del_miles = 1

                snapshots.append({
                    "month": m_str,
                    "expenditure": cur_exp,
                    "physical_progress": cur_phys,
                    "schedule_progress": sched_expected,
                    "milestones_due": due_miles,
                    "milestones_delayed": del_miles
                })

            # Milestones
            milestones = []
            m_names = [
                ("Detailed Project Report & Statutory Clearances", "High"),
                ("Land Acquisition & Right of Way Handover", "Critical"),
                ("Tender Award & Contractor Mobilization", "Medium"),
                ("Substructure / Civil Foundation Works", "High"),
                ("Main Superstructure / Line Installation", "Critical"),
                ("Sub-system Testing & Grid Interconnection", "High"),
                ("Safety Audit & Pre-Commissioning Trial", "Critical"),
                ("Final Operational Handover & Closeout", "Medium")
            ]

            for m_i, (m_title, m_crit) in enumerate(m_names):
                m_plan_month = (cur_dt + timedelta(days=int((m_i + 1) * (dur_months / 8.0) * 30))).strftime("%Y-%m-%d")
                status = "Pending"
                actual_date = None

                latest_snap = snapshots[-1]
                latest_phys = latest_snap["physical_progress"]

                # Milestone completion threshold
                milestone_threshold = ((m_i + 1) / 8.0) * 100.0
                if latest_phys >= milestone_threshold:
                    status = "Completed"
                    actual_date = m_plan_month
                elif m_plan_month < latest_snap["month"]:
                    if archetype in ["Milestone Slippage Case", "Multi-Risk Compounded Crisis", "Schedule Delay Case"]:
                        status = "Delayed"
                    else:
                        status = "Completed"
                        actual_date = m_plan_month
                else:
                    status = "Pending"

                milestones.append({
                    "name": m_title,
                    "planned_date": m_plan_month,
                    "actual_date": actual_date,
                    "status": status,
                    "criticality": m_crit
                })

            # Overall project status label
            status_label = "Ongoing"
            if archetype in ["Multi-Risk Compounded Crisis", "Spend/Progress Divergence Case"]:
                status_label = "Critical"
            elif archetype in ["Schedule Delay Case", "Cost Escalation Case", "Milestone Slippage Case"]:
                status_label = "Delayed"
            elif snapshots[-1]["physical_progress"] >= 95.0:
                status_label = "Completed"

            p_entry = {
                "id": project_idx,
                "code": code,
                "name": p_name,
                "ministry": ministry,
                "department": dept,
                "sector": sector,
                "agency": agency,
                "approved_cost": app_cost,
                "revised_cost": rev_cost,
                "start_date": start_date,
                "target_date": target_date,
                "status": status_label,
                "archetype": archetype,
                "snapshots": snapshots,
                "milestones": milestones
            }

            projects_data.append(p_entry)
            project_idx += 1

    return projects_data

def seed_database_with_synthetic_data(db: Session, seed: int = 42, force_reset: bool = False):
    """
    Seeds demo users, projects, snapshots, milestones, risk predictions, drivers, and alerts.
    Produces a live, fully populated system instantly on startup.
    """
    # 1. Seed demo users
    demo_users = [
        {"name": "Drishti Admin", "email": "admin@drishti.local", "role": "Admin", "password": "admin123"},
        {"name": "Senior Monitoring Officer", "email": "officer@drishti.local", "role": "Officer", "password": "officer123"},
        {"name": "Lead Risk Analyst", "email": "analyst@drishti.local", "role": "Analyst", "password": "analyst123"},
        {"name": "Executive Director", "email": "executive@drishti.local", "role": "Executive", "password": "executive123"},
    ]

    for u in demo_users:
        existing = db.query(User).filter(User.email == u["email"]).first()
        if not existing:
            new_u = User(
                name=u["name"],
                email=u["email"],
                role=u["role"],
                password_hash=get_password_hash(u["password"]),
                active=True
            )
            db.add(new_u)
    db.commit()

    if force_reset:
        db.query(Alert).delete()
        db.query(RiskDriver).delete()
        db.query(RiskPrediction).delete()
        db.query(Milestone).delete()
        db.query(ProjectSnapshot).delete()
        db.query(Project).delete()
        db.commit()
    else:
        # Check if projects already seeded
        existing_count = db.query(Project).count()
        if existing_count > 0:
            return

    # Generate dataset
    raw_projects = generate_synthetic_data(seed=seed)
    policy = get_risk_policy(db)

    # Save to disk as synthetic CSV reference
    csv_rows = []
    for rp in raw_projects:
        for sn in rp["snapshots"]:
            csv_rows.append({
                "project_code": rp["code"],
                "project_name": rp["name"],
                "ministry": rp["ministry"],
                "department": rp["department"],
                "sector": rp["sector"],
                "agency": rp["agency"],
                "approved_cost": rp["approved_cost"],
                "revised_cost": rp["revised_cost"],
                "start_date": rp["start_date"],
                "target_date": rp["target_date"],
                "month": sn["month"],
                "expenditure": sn["expenditure"],
                "physical_progress": sn["physical_progress"],
                "schedule_progress": sn["schedule_progress"],
                "milestones_due": sn["milestones_due"],
                "milestones_delayed": sn["milestones_delayed"]
            })
    import os
    base_data_dir = "data" if os.path.exists("data") else "../data"
    os.makedirs(os.path.join(base_data_dir, "synthetic"), exist_ok=True)
    os.makedirs(os.path.join(base_data_dir, "sample"), exist_ok=True)
    pd.DataFrame(csv_rows).to_csv(os.path.join(base_data_dir, "synthetic", "synthetic_projects_dataset.csv"), index=False)
    pd.DataFrame(csv_rows[:15]).to_csv(os.path.join(base_data_dir, "sample", "import_template.csv"), index=False)

    # 2. Insert Projects, Snapshots, Milestones, Predictions, Drivers, and Alerts
    for p_info in raw_projects:
        project = Project(
            code=p_info["code"],
            name=p_info["name"],
            ministry=p_info["ministry"],
            department=p_info["department"],
            sector=p_info["sector"],
            agency=p_info["agency"],
            approved_cost=p_info["approved_cost"],
            revised_cost=p_info["revised_cost"],
            start_date=p_info["start_date"],
            target_date=p_info["target_date"],
            status=p_info["status"]
        )
        db.add(project)
        db.flush()

        # Add snapshots
        created_snaps = []
        for s in p_info["snapshots"]:
            snap = ProjectSnapshot(
                project_id=project.id,
                month=s["month"],
                expenditure=s["expenditure"],
                physical_progress=s["physical_progress"],
                schedule_progress=s["schedule_progress"],
                milestones_due=s["milestones_due"],
                milestones_delayed=s["milestones_delayed"]
            )
            db.add(snap)
            created_snaps.append(s)

        # Add milestones
        for m in p_info["milestones"]:
            ms = Milestone(
                project_id=project.id,
                name=m["name"],
                planned_date=m["planned_date"],
                actual_date=m["actual_date"],
                status=m["status"],
                criticality=m["criticality"]
            )
            db.add(ms)

        db.flush()

        # Compute engineered features, risk scores, drivers, and alerts
        p_dict = {
            "approved_cost": project.approved_cost,
            "revised_cost": project.revised_cost,
            "start_date": project.start_date,
            "target_date": project.target_date,
            "sector": project.sector,
            "agency": project.agency
        }
        features = calculate_snapshot_features(p_dict, created_snaps, p_info["milestones"])
        sub_risks = calculate_sub_risks(features)
        overall_risk, risk_band = compute_composite_risk(sub_risks, policy)

        latest_snap_month = created_snaps[-1]["month"] if created_snaps else "2024-01"

        # Create Risk Prediction
        pred = RiskPrediction(
            project_id=project.id,
            snapshot_id=None,
            model_version="v1.0-baseline-rf",
            dataset_version="demo-synthetic-v1",
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

        # Create Explainable Drivers
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

        # Evaluate and create Early Warning Alerts
        evaluate_project_alerts(
            project=project,
            features=features,
            sub_risks=sub_risks,
            overall_risk=overall_risk,
            prediction_id=pred.id,
            db=db
        )

    db.commit()
