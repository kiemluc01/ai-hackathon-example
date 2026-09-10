import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import OperationalError

from app.api.router import api_router
from app.core.config import settings
from app.db.session import Base, SessionLocal, engine
from app.models import Agent, Pack, Skill, Workflow  # noqa: F401  (register mappers)
from app.services.seed import seed_if_empty

logger = logging.getLogger("uvicorn.error")


def init_database(attempts: int = 10, delay: float = 2.0) -> None:
    """Create tables and seed, retrying while Postgres finishes booting."""
    for attempt in range(1, attempts + 1):
        try:
            Base.metadata.create_all(bind=engine)
            if settings.seed_on_startup:
                with SessionLocal() as db:
                    created = seed_if_empty(db)
                if any(created.values()):
                    logger.info("Seeded database: %s", created)
            return
        except OperationalError as exc:
            if attempt == attempts:
                raise
            logger.warning("Database not ready (%s/%s): %s", attempt, attempts, exc)
            time.sleep(delay)


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_database()
    yield


app = FastAPI(title=settings.app_name, version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.api_prefix)


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": settings.app_name}
