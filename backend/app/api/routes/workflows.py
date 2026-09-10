from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.utils import slugify
from app.db.session import get_db
from app.models import Agent, Pack, Skill, Workflow
from app.schemas.workflow import (
    WorkflowCompileResult,
    WorkflowCreate,
    WorkflowRead,
    WorkflowUpdate,
)
from app.services.workflow_compiler import compile_workflow

router = APIRouter(prefix="/workflows", tags=["workflows"])


def get_workflow_or_404(workflow_id: str, db: Session) -> Workflow:
    workflow = db.get(Workflow, workflow_id)
    if workflow is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy workflow")
    return workflow


def require_pack(pack_id: str | None, db: Session) -> Pack:
    pack = db.get(Pack, pack_id) if pack_id else None
    if pack is None:
        raise HTTPException(status_code=400, detail="Pack không tồn tại")
    return pack


def unique_slug(db: Session, pack_id: str, desired: str, exclude_id: str | None = None) -> str:
    base = slugify(desired, fallback="workflow")
    candidate, counter = base, 2
    while True:
        stmt = select(Workflow).where(Workflow.pack_id == pack_id, Workflow.slug == candidate)
        if exclude_id:
            stmt = stmt.where(Workflow.id != exclude_id)
        if db.scalar(stmt) is None:
            return candidate
        candidate = f"{base}-{counter}"
        counter += 1


def lookup_tables(db: Session, pack_id: str | None) -> tuple[dict[str, Skill], dict[str, Agent]]:
    if pack_id is None:
        return {}, {}
    skills = {s.id: s for s in db.scalars(select(Skill).where(Skill.pack_id == pack_id))}
    agents = {a.id: a for a in db.scalars(select(Agent).where(Agent.pack_id == pack_id))}
    return skills, agents


@router.get("", response_model=list[WorkflowRead])
def list_workflows(pack_id: str = Query(), db: Session = Depends(get_db)) -> list[Workflow]:
    return list(
        db.scalars(select(Workflow).where(Workflow.pack_id == pack_id).order_by(Workflow.name))
    )


@router.post("", response_model=WorkflowRead, status_code=status.HTTP_201_CREATED)
def create_workflow(payload: WorkflowCreate, db: Session = Depends(get_db)) -> Workflow:
    require_pack(payload.pack_id, db)
    data = payload.model_dump(exclude={"slug", "pack_id"})
    workflow = Workflow(
        pack_id=payload.pack_id,
        slug=unique_slug(db, payload.pack_id, payload.slug or payload.name),
        **data,
    )
    db.add(workflow)
    db.commit()
    db.refresh(workflow)
    return workflow


@router.get("/{workflow_id}", response_model=WorkflowRead)
def get_workflow(workflow_id: str, db: Session = Depends(get_db)) -> Workflow:
    return get_workflow_or_404(workflow_id, db)


@router.patch("/{workflow_id}", response_model=WorkflowRead)
def update_workflow(
    workflow_id: str, payload: WorkflowUpdate, db: Session = Depends(get_db)
) -> Workflow:
    workflow = get_workflow_or_404(workflow_id, db)
    data = payload.model_dump(exclude_unset=True)
    data.pop("pack_id", None)  # a workflow never moves between packs
    if data.get("slug"):
        data["slug"] = unique_slug(db, workflow.pack_id, data["slug"], exclude_id=workflow.id)
    for field, value in data.items():
        setattr(workflow, field, value)
    db.commit()
    db.refresh(workflow)
    return workflow


@router.delete("/{workflow_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_workflow(workflow_id: str, db: Session = Depends(get_db)) -> None:
    db.delete(get_workflow_or_404(workflow_id, db))
    db.commit()


@router.post("/{workflow_id}/compile", response_model=WorkflowCompileResult)
def compile_existing(workflow_id: str, db: Session = Depends(get_db)) -> dict:
    workflow = get_workflow_or_404(workflow_id, db)
    skills, agents = lookup_tables(db, workflow.pack_id)
    return compile_workflow(workflow, skills, agents)


@router.post("/validate", response_model=WorkflowCompileResult)
def validate_draft(payload: WorkflowCreate, db: Session = Depends(get_db)) -> dict:
    """Validate a canvas that has not been saved yet."""
    draft = Workflow(
        slug="draft",
        name=payload.name,
        description=payload.description,
        nodes=payload.nodes,
        edges=payload.edges,
        platforms=payload.platforms,
    )
    skills, agents = lookup_tables(db, payload.pack_id)
    return compile_workflow(draft, skills, agents)
