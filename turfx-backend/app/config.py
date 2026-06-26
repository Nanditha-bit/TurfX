from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Server
    PORT: int = 5000
    ENVIRONMENT: str = "development"

    # Database
    DB_HOST: str = "localhost"
    DB_PORT: int = 5432
    DB_NAME: str = "turfx_db"
    DB_USER: str = "postgres"
    DB_PASSWORD: str = "12345678"

    # JWT
    JWT_SECRET: str = "turfx_super_secret_jwt_key_2024"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRES_DAYS: int = 30

    # Razorpay
    RAZORPAY_KEY_ID: str = "rzp_test_demo_key"
    RAZORPAY_KEY_SECRET: str = "demo_secret_key"

    # Email
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASS: str = ""
    EMAIL_FROM: str = "TurfX <noreply@turfx.in>"

    # CORS
    FRONTEND_URL: str = "http://localhost:3001"

    # Uploads
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE_MB: int = 10

    # Admin seed
    ADMIN_PHONE: str = "+919999999999"
    ADMIN_PASSWORD: str = "Admin@123"

    @property
    def DATABASE_URL(self) -> str:
        return (
            f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        )

    @property
    def ASYNC_DATABASE_URL(self) -> str:
        return (
            f"postgresql+asyncpg://{self.DB_USER}:{self.DB_PASSWORD}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        )

    @property
    def is_demo_razorpay(self) -> bool:
        return "demo" in self.RAZORPAY_KEY_ID

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
