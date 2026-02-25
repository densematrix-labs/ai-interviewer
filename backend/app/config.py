from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    LLM_PROXY_URL: str = "https://llm-proxy.densematrix.ai"
    LLM_PROXY_KEY: str = ""
    DATABASE_URL: str = "sqlite+aiosqlite:///./app.db"
    CREEM_API_KEY: str = ""
    CREEM_WEBHOOK_SECRET: str = ""
    CREEM_PRODUCT_IDS: str = "{}"
    TOOL_NAME: str = "ai-interviewer"
    
    class Config:
        env_file = ".env"

@lru_cache()
def get_settings():
    return Settings()
