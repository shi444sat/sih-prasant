"""
Seed Demo Data Script for Project Drishti
Run this script to initialize the database and seed the synthetic dataset.
"""
import sys
import os

# Add backend directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from app.database import engine, Base, SessionLocal
from app.analytics.synthetic_generator import seed_database_with_synthetic_data
from app.ml.pipeline import train_and_evaluate_models

def main():
    print("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        print("Seeding synthetic demonstration dataset (63 projects, 12-24 snapshots each)...")
        seed_database_with_synthetic_data(db, seed=42)
        print("Training baseline and ML models on synthetic timeline...")
        train_and_evaluate_models(db, version="v1.0-manual-seed")
        print("Done! Demo database is populated and ready.")
    finally:
        db.close()

if __name__ == "__main__":
    main()
