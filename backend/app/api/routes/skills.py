from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.core.utils import slugify
from app.db.session import get_db
from app.models import Pack, Skill
from app.schemas.skill import SkillCreate, SkillRead, SkillUpdate

router = APIRouter(prefix="/skills", tags=["skills"])


def get_skill_or_404(skill_id: str, db: Session) -> Skill:
    skill = db.get(Skill, skill_id)
    if skill is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy skill")
    return skill


def require_pack(pack_id: str, db: Session) -> Pack:
    pack = db.get(Pack, pack_id)
    if pack is None:
        raise HTTPException(status_code=400, detail="Pack không tồn tại")
    return pack


def unique_slug(db: Session, pack_id: str, desired: str, exclude_id: str | None = None) -> str:
    """Slugs only need to be unique inside their own pack."""
    base = slugify(desired, fallback="skill")
    candidate, counter = base, 2
    while True:
        stmt = select(Skill).where(Skill.pack_id == pack_id, Skill.slug == candidate)
        if exclude_id:
            stmt = stmt.where(Skill.id != exclude_id)
        if db.scalar(stmt) is None:
            return candidate
        candidate = f"{base}-{counter}"
        counter += 1


@router.get("", response_model=list[SkillRead])
def list_skills(
    pack_id: str = Query(description="Skill luôn thuộc về đúng một pack"),
    db: Session = Depends(get_db),
    q: str | None = Query(default=None, description="Tìm theo tên, mô tả hoặc code"),
    stage: str | None = None,
    platform: str | None = None,
    status_filter: str | None = Query(default=None, alias="status"),
) -> list[Skill]:
    stmt = select(Skill).where(Skill.pack_id == pack_id).order_by(Skill.code, Skill.name)
    if q:
        pattern = f"%{q.lower()}%"
        stmt = stmt.where(
            or_(
                Skill.name.ilike(pattern),
                Skill.description.ilike(pattern),
                Skill.code.ilike(pattern),
            )
        )
    if stage:
        stmt = stmt.where(Skill.stage == stage)
    if status_filter:
        stmt = stmt.where(Skill.status == status_filter)

    skills = list(db.scalars(stmt))
    if platform:
        skills = [s for s in skills if platform in (s.platforms or [])]
    return skills


@router.post("", response_model=SkillRead, status_code=status.HTTP_201_CREATED)
def create_skill(payload: SkillCreate, db: Session = Depends(get_db)) -> Skill:
    require_pack(payload.pack_id, db)
    data = payload.model_dump(exclude={"slug", "pack_id"})
    skill = Skill(
        pack_id=payload.pack_id,
        slug=unique_slug(db, payload.pack_id, payload.slug or payload.name),
        **data,
    )
    db.add(skill)
    db.commit()
    db.refresh(skill)
    return skill


@router.get("/{skill_id}", response_model=SkillRead)
def get_skill(skill_id: str, db: Session = Depends(get_db)) -> Skill:
    return get_skill_or_404(skill_id, db)


@router.patch("/{skill_id}", response_model=SkillRead)
def update_skill(skill_id: str, payload: SkillUpdate, db: Session = Depends(get_db)) -> Skill:
    skill = get_skill_or_404(skill_id, db)
    data = payload.model_dump(exclude_unset=True)
    if data.get("slug"):
        data["slug"] = unique_slug(db, skill.pack_id, data["slug"], exclude_id=skill.id)
    for field, value in data.items():
        setattr(skill, field, value)
    db.commit()
    db.refresh(skill)
    return skill


@router.delete("/{skill_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_skill(skill_id: str, db: Session = Depends(get_db)) -> None:
    db.delete(get_skill_or_404(skill_id, db))
    db.commit()


@router.post("/{skill_id}/duplicate", response_model=SkillRead, status_code=status.HTTP_201_CREATED)
def duplicate_skill(skill_id: str, db: Session = Depends(get_db)) -> Skill:
    source = get_skill_or_404(skill_id, db)
    clone = Skill(
        pack_id=source.pack_id,
        slug=unique_slug(db, source.pack_id, f"{source.slug}-copy"),
        name=f"{source.name} (copy)",
        code=source.code,
        description=source.description,
        content=source.content,
        stage=source.stage,
        priority=source.priority,
        owner=source.owner,
        version=source.version,
        status="draft",
        user_invocable=source.user_invocable,
        tags=list(source.tags or []),
        platforms=list(source.platforms or []),
        config=dict(source.config or {}),
    )
    db.add(clone)
    db.commit()
    db.refresh(clone)
    return clone
