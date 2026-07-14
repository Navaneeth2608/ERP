import os
from typing import List
from cryptography.fernet import Fernet
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "College ERP Platform"
    API_V1_STR: str = "/api/v1"
    
    # Database and Redis
    DATABASE_URL: str = "postgresql+asyncpg://erp_user:erp_password@localhost:5432/erp_db"
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Security
    SECRET_KEY: str = "super-secret-development-key-that-is-at-least-32-chars-long-or-longer"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # PII Encryption Key (must be a valid Fernet key: 32 url-safe base64-encoded bytes)
    ENCRYPTION_KEY: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    def __init__(self, **values):
        super().__init__(**values)
        # Ensure we always have a valid Fernet encryption key
        if not self.ENCRYPTION_KEY:
            self.ENCRYPTION_KEY = Fernet.generate_key().decode()

settings = Settings()
