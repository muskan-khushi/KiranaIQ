from pydantic_settings import BaseSettings
from typing import Literal


class Settings(BaseSettings):
    # Database
    MONGO_URI: str = "mongodb://localhost:27017/kiranaiq"
    REDIS_URL: str = "redis://localhost:6379/0"

    # Auth
    JWT_SECRET: str = "dev-secret-change-in-production"
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

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()