from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import Agent, Pack, Skill, Workflow
from app.schemas.pack import PackCreate, PackRead, PackSummary, PackUpdate, TemplateSummary
from app.services.packs import create_pack, unique_pack_slug
from app.services.templates import get_template, summaries

router = APIRouter(prefix="/packs", tags=["packs"])


def get_pack_or_404(pack_id: str, db: Session) -> Pack:
    pack = db.get(Pack, pack_id)
    if pack is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy pack")
    return pack


@router.get("", response_model=list[PackSummary])
def list_packs(db: Session = Depends(get_db)) -> list[PackSummary]:
    def counts(model) -> dict[str, int]:
        rows = db.execute(select(model.pack_id, func.count()).group_by(model.pack_id)).all()
        return dict(rows)

    skill_counts, agent_counts, workflow_counts = counts(Skill), counts(Agent), counts(Workflow)

    return [
        PackSummary(
            **PackRead.model_validate(pack).model_dump(),
            skill_count=skill_counts.get(pack.id, 0),
            agent_count=agent_counts.get(pack.id, 0),
            workflow_count=workflow_counts.get(pack.id, 0),
        )
        for pack in db.scalars(select(Pack).order_by(Pack.created_at.desc()))
    ]


@router.post("", response_model=PackRead, status_code=status.HTTP_201_CREATED)
def create(payload: PackCreate, db: Session = Depends(get_db)) -> Pack:
    if get_template(payload.template_id) is None:
        raise HTTPException(status_code=400, detail="Template không tồn tại")
    pack = create_pack(
        db,
        name=payload.name,
        description=payload.description,
        slug=payload.slug,
        status=payload.status,
        platforms=payload.platforms,
        template_id=payload.template_id,
    )
    db.commit()
    db.refresh(pack)
    return pack


@router.get("/templates", response_model=list[TemplateSummary])
def list_templates() -> list[dict]:
    return summaries()


@router.get("/{pack_id}", response_model=PackSummary)
def get_one(pack_id: str, db: Session = Depends(get_db)) -> PackSummary:
    pack = get_pack_or_404(pack_id, db)
    return PackSummary(
        **PackRead.model_validate(pack).model_dump(),
        skill_count=len(pack.skills),
        agent_count=len(pack.agents),
        workflow_count=len(pack.workflows),
    )


@router.patch("/{pack_id}", response_model=PackRead)
def update(pack_id: str, payload: PackUpdate, db: Session = Depends(get_db)) -> Pack:
    pack = get_pack_or_404(pack_id, db)
    data = payload.model_dump(exclude_unset=True)
    if data.get("slug"):
        data["slug"] = unique_pack_slug(db, data["slug"], exclude_id=pack.id)
    for field, value in data.items():
        setattr(pack, field, value)
    db.commit()
    db.refresh(pack)
    return pack


@router.delete("/{pack_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete(pack_id: str, db: Session = Depends(get_db)) -> None:
    """Deleting a pack removes its skills, agents and workflows with it."""
    db.delete(get_pack_or_404(pack_id, db))
    db.commit()


@router.post("/{pack_id}/duplicate", response_model=PackRead, status_code=status.HTTP_201_CREATED)
def duplicate(pack_id: str, db: Session = Depends(get_db)) -> Pack:
    """Fork a pack into a fully independent copy."""
    source = get_pack_or_404(pack_id, db)
    clone = Pack(
        slug=unique_pack_slug(db, f"{source.slug}-copy"),
        name=f"{source.name} (copy)",
        description=source.description,
        status="draft",
        source_template=source.source_template,
        platforms=list(source.platforms or []),
    )
    db.add(clone)
    db.flush()

    for skill in source.skills:
        db.add(
            Skill(
                pack_id=clone.id,
                slug=skill.slug,
                name=skill.name,
                code=skill.code,
                description=skill.description,
                content=skill.content,
                stage=skill.stage,
                priority=skill.priority,
                owner=skill.owner,
                version=skill.version,
                status=skill.status,
                user_invocable=skill.user_invocable,
                tags=list(skill.tags or []),
                platforms=list(skill.platforms or []),
                config=dict(skill.config or {}),
            )
        )

    db.commit()
    db.refresh(clone)
    return clone
