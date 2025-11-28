from functools import lru_cache
from typing import List

from pydantic import AnyHttpUrl, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    environment: str = Field("development", alias="ENVIRONMENT")
    debug: bool = Field(True, alias="DEBUG")
    secret_key: str = Field(..., alias="SECRET_KEY")
    timezone: str = Field("UTC", alias="TIMEZONE")

    postgres_host: str = Field("db", alias="POSTGRES_HOST")
    postgres_port: int = Field(5432, alias="POSTGRES_PORT")
    postgres_db: str = Field("keikichi_logistics", alias="POSTGRES_DB")
    postgres_user: str = Field("keikichi", alias="POSTGRES_USER")
    postgres_password: str = Field("password", alias="POSTGRES_PASSWORD")

    jwt_secret_key: str = Field(..., alias="JWT_SECRET_KEY")
    jwt_algorithm: str = Field("HS256", alias="JWT_ALGORITHM")
    access_token_expire_minutes: int = Field(30, alias="ACCESS_TOKEN_EXPIRE_MINUTES")
    refresh_token_expire_days: int = Field(7, alias="REFRESH_TOKEN_EXPIRE_DAYS")

    backend_host: str = Field("0.0.0.0", alias="BACKEND_HOST")
    backend_port: int = Field(8000, alias="BACKEND_PORT")
    backend_cors_origins: List[AnyHttpUrl] = Field(default_factory=list, alias="BACKEND_CORS_ORIGINS")

    vite_api_url: AnyHttpUrl | None = Field(None, alias="VITE_API_URL")
    vite_ws_url: AnyHttpUrl | None = Field(None, alias="VITE_WS_URL")

    max_file_size_mb: int = Field(10, alias="MAX_FILE_SIZE_MB")
    allowed_file_types: str = Field("pdf,jpg,jpeg,png,xml", alias="ALLOWED_FILE_TYPES")
    upload_dir: str = Field("/app/uploads", alias="UPLOAD_DIR")

    default_admin_email: str = Field(..., alias="DEFAULT_ADMIN_EMAIL")
    default_admin_password: str = Field(..., alias="DEFAULT_ADMIN_PASSWORD")
    default_admin_name: str = Field("Administrador", alias="DEFAULT_ADMIN_NAME")

    default_spaces_per_trip: int = Field(28, alias="DEFAULT_SPACES_PER_TRIP")
    space_hold_minutes: int = Field(15, alias="SPACE_HOLD_MINUTES")
    reservation_cancel_hours: int = Field(24, alias="RESERVATION_CANCEL_HOURS")
    default_currency: str = Field("MXN", alias="DEFAULT_CURRENCY")
    default_tax_rate: float = Field(0.16, alias="DEFAULT_TAX_RATE")

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False)

    @property
    def database_url(self) -> str:
        return (
            f"postgresql+asyncpg://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )


@lru_cache

def get_settings() -> Settings:
    return Settings()  # type: ignore[arg-type]


settings = get_settings()
