from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    DATABASE_URL: str
    REDIS_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    BACKEND_CORS_ORIGINS: str = "http://localhost:3000"

    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE: int = 10485760

    BANK_NAME: str = "Banco Example"
    BANK_ACCOUNT: str = "1234567890"
    BANK_ACCOUNT_HOLDER: str = "Keikichi Logistics S.A."
    BANK_ROUTING: str = "001"

    @property
    def cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.BACKEND_CORS_ORIGINS.split(",")]

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
