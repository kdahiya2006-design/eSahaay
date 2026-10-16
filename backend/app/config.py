import os
from pathlib import Path
from pydantic import BaseModel
from typing import Optional

def load_env_file():
    candidates = [
        Path(".env"),
        Path("backend/.env"),
        Path(__file__).resolve().parent.parent.parent / ".env",
        Path(__file__).resolve().parent.parent / ".env",
    ]
    for p in candidates:
        if p.exists():
            try:
                with open(p, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            k, v = line.split("=", 1)
                            k, v = k.strip(), v.strip()
                            # Strip surrounding quotes if any
                            if (v.startswith('"') and v.endswith('"')) or (v.startswith("'") and v.endswith("'")):
                                v = v[1:-1]
                            os.environ[k] = v
            except Exception:
                pass

load_env_file()

class Settings(BaseModel):
    PROJECT_NAME: str = "eSahaay - Intelligent Helpline Triage"
    API_V1_STR: str = "/api/v1"
    
    # AI Provider settings: "mock", "gemini", "openai", "anthropic"
    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "gemini")
    AI_API_KEY: Optional[str] = os.getenv("AI_API_KEY", None)
    AI_MODEL: str = os.getenv("AI_MODEL", "gemini-3.5-flash")
    
    # SQLite Database
    DATABASE_PATH: str = os.getenv("DATABASE_PATH", "cases.db")
    
    # CORS
    BACKEND_CORS_ORIGINS: list[str] = ["*"]

settings = Settings()
