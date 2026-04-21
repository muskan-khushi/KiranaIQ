from pydantic_settings import BaseSettings
from pydantic import ConfigDict
from typing import Literal


class Settings(BaseSettings):
    model_config = ConfigDict(env_file=".env", extra="ignore")

    # Database
    MONGO_URI: str = "mongodb://localhost:27017/kiranaiq"
    REDIS_URL: str = "redis://localhost:6379/0"

    # Auth
    JWT_SECRET: str = "dev-secret-change-in-production-min-32-chars"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    # AI / External APIs
    GROQ_API_KEY: str = ""
    GOOGLE_MAPS_KEY: str = ""

    # Storage — "local" for dev, "s3" for prod
    STORAGE_BACKEND: Literal["local", "s3"] = "local"
    LOCAL_UPLOAD_DIR: str = "./uploads"
    AWS_BUCKET: str = "kiranaiq-images"
    AWS_REGION: str = "ap-south-1"
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""

    # Business constants (referenced in tests and pipeline)
    WORKING_DAYS_MONTH: int = 26
    FOIR: float = 0.45
    INTEREST_RATE_PA: float = 0.18

    def validate_for_production(self) -> list[str]:
        """Returns list of warnings for missing critical config."""
        warnings = []
        if not self.GROQ_API_KEY or self.GROQ_API_KEY.startswith("gsk_..."):
            warnings.append("GROQ_API_KEY is not set — vision analysis will use fallback values")
        if self.JWT_SECRET == "dev-secret-change-in-production-min-32-chars":
            warnings.append("JWT_SECRET is using the default dev value — change before production")
        if self.STORAGE_BACKEND == "s3" and not self.AWS_ACCESS_KEY_ID:
            warnings.append("STORAGE_BACKEND=s3 but AWS_ACCESS_KEY_ID is not set")
        return warnings


settings = Settings()