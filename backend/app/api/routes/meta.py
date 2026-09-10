from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import Agent, Pack, Skill, Workflow
from app.services.platforms import PLATFORMS

router = APIRouter(tags=["meta"])

STAGES = [
    "preparation",
    "locate",
    "comprehension",
    "development",
    "defect-fixing",
    "refactoring",
    "testing",
    "review",
    "documentation",
    "release",
]
PRIORITIES = ["critical", "high", "medium", "low"]
NODE_KINDS = [
    {"id": "trigger", "label": "Trigger", "hint": "Điểm bắt đầu của workflow"},
    {"id": "skill", "label": "Skill", "hint": "Gọi một skill đã định nghĩa"},
    {"id": "agent", "label": "Agent", "hint": "Uỷ quyền cho một agent"},
    {"id": "condition", "label": "Condition", "hint": "Rẽ nhánh theo điều kiện"},
    {"id": "tool", "label": "Tool", "hint": "Chạy một công cụ bên ngoài"},
    {"id": "output", "label": "Output", "hint": "Kết quả bàn giao"},
]


@router.get("/platforms")
def list_platforms() -> list[dict]:
    return PLATFORMS


@router.get("/meta")
def metadata() -> dict:
    return {
        "stages": STAGES,
        "priorities": PRIORITIES,
        "node_kinds": NODE_KINDS,
        "statuses": ["draft", "published", "archived"],
    }


@router.get("/stats")
def stats(
    pack_id: str | None = Query(default=None, description="Bỏ trống để lấy số liệu toàn hệ thống"),
    db: Session = Depends(get_db),
) -> dict:
    def count(model) -> int:
        stmt = select(func.count()).select_from(model)
        if pack_id:
            stmt = stmt.where(model.pack_id == pack_id)
        return db.scalar(stmt) or 0

    stage_stmt = select(Skill.stage, func.count()).group_by(Skill.stage)
    published_stmt = select(func.count()).select_from(Skill).where(Skill.status == "published")
    if pack_id:
        stage_stmt = stage_stmt.where(Skill.pack_id == pack_id)
        published_stmt = published_stmt.where(Skill.pack_id == pack_id)

    return {
        "packs": db.scalar(select(func.count()).select_from(Pack)) or 0,
        "skills": count(Skill),
        "agents": count(Agent),
        "workflows": count(Workflow),
        "published_skills": db.scalar(published_stmt) or 0,
        "skills_by_stage": dict(db.execute(stage_stmt).all()),
    }
