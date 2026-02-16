"""
Application configuration settings.
"""
from typing import List, Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Application
    PROJECT_NAME: str = "Trading Platform"
    API_V1_STR: str = "/api/v1"

    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:8000"]

    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/trading_platform"

    # Email
    SMTP_TLS: bool = True
    SMTP_PORT: Optional[int] = None
    SMTP_HOST: Optional[str] = None
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAILS_FROM_EMAIL: Optional[str] = None
    EMAILS_FROM_NAME: Optional[str] = None

    # External APIs
    MARKET_DATA_API_KEY: Optional[str] = None

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
