from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Agent Skill Studio API"
    api_prefix: str = "/api/v1"
    database_url: str = "postgresql+psycopg://studio:studio@db:5432/studio"
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"
    # Path (inside the container) to a Context Pack used to seed an empty database.
    seed_pack_dir: str = "/seed/.claude"
    seed_on_startup: bool = True

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
