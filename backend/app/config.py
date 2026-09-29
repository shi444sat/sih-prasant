import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Project Drishti"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # Database
    DATABASE_URL: str = "sqlite:///./drishti.db"
    
    # Auth
    SECRET_KEY: str = "drishti_super_secret_jwt_key_sih26103_prototype_not_for_prod"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    
    # Demo & Disclaimers
    DEMO_MODE: bool = True
    DATASET_LABEL: str = "Synthetic Demonstration Dataset"
    POLICY_DISCLAIMER: str = "Configurable prototype policy — not an official government threshold."
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000"
    ]

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
