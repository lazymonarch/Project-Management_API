from pydantic_settings import BaseSettings
from functools import lru_cache
from dotenv import load_dotenv
import os

# Explicitly load .env into os.environ (ensures availability for all modules)
load_dotenv()

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    ADMIN_INVITE_CODE: str = "default-invite"

    model_config = {
        "env_file": ".env",
        "extra": "ignore",
        "case_sensitive": True
    }

@lru_cache
def get_settings():
    return Settings()

# Convenience: export singleton instance
settings = get_settings()