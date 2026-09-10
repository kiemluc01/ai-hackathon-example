from fastapi import APIRouter

from app.api.routes import agents, exports, meta, packs, skills, workflows

api_router = APIRouter()
api_router.include_router(meta.router)
api_router.include_router(packs.router)
api_router.include_router(skills.router)
api_router.include_router(agents.router)
api_router.include_router(workflows.router)
api_router.include_router(exports.router)
