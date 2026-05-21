"""Centralised settings — loaded from environment / .env via Pydantic."""
from __future__ import annotations

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """All runtime configuration lives here."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Application
    app_env: str = "development"
    app_name: str = "DI-Platform"
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    app_debug: bool = True
    secret_key: str = Field(default="change-me", min_length=8)

    # Anthropic
    anthropic_api_key: str = ""
    anthropic_model: str = "claude-sonnet-4-6"

    # Database
    database_url: str = "postgresql://di_user:di_pass@localhost:5432/di_platform"
    db_pool_size: int = 10
    db_echo: bool = False

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # Logging
    log_level: str = "INFO"
    log_format: str = "json"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
