from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.utils import slugify
from app.db.session import get_db
from app.models import Agent, Pack, Skill
from app.schemas.agent import AgentCreate, AgentRead, AgentUpdate

router = APIRouter(prefix="/agents", tags=["agents"])


def get_agent_or_404(agent_id: str, db: Session) -> Agent:
    agent = db.get(Agent, agent_id)
    if agent is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy agent")
    return agent


def require_pack(pack_id: str, db: Session) -> Pack:
    pack = db.get(Pack, pack_id)
    if pack is None:
        raise HTTPException(status_code=400, detail="Pack không tồn tại")
    return pack


def unique_slug(db: Session, pack_id: str, desired: str, exclude_id: str | None = None) -> str:
    base = slugify(desired, fallback="agent")
    candidate, counter = base, 2
    while True:
        stmt = select(Agent).where(Agent.pack_id == pack_id, Agent.slug == candidate)
        if exclude_id:
            stmt = stmt.where(Agent.id != exclude_id)
        if db.scalar(stmt) is None:
            return candidate
        candidate = f"{base}-{counter}"
        counter += 1


def resolve_skills(db: Session, pack_id: str, skill_ids: list[str]) -> list[Skill]:
    """Only skills from the agent's own pack may be attached — packs stay isolated."""
    if not skill_ids:
        return []
    found = list(
        db.scalars(select(Skill).where(Skill.id.in_(skill_ids), Skill.pack_id == pack_id))
    )
    missing = set(skill_ids) - {s.id for s in found}
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Skill không tồn tại trong pack này: {', '.join(missing)}",
        )
    order = {sid: i for i, sid in enumerate(skill_ids)}
    return sorted(found, key=lambda s: order[s.id])


@router.get("", response_model=list[AgentRead])
def list_agents(pack_id: str = Query(), db: Session = Depends(get_db)) -> list[Agent]:
    return list(db.scalars(select(Agent).where(Agent.pack_id == pack_id).order_by(Agent.name)))


@router.post("", response_model=AgentRead, status_code=status.HTTP_201_CREATED)
def create_agent(payload: AgentCreate, db: Session = Depends(get_db)) -> Agent:
    require_pack(payload.pack_id, db)
    data = payload.model_dump(exclude={"slug", "skill_ids", "pack_id"})
    agent = Agent(
        pack_id=payload.pack_id,
        slug=unique_slug(db, payload.pack_id, payload.slug or payload.name),
        **data,
    )
    agent.skills = resolve_skills(db, payload.pack_id, payload.skill_ids)
    db.add(agent)
    db.commit()
    db.refresh(agent)
    return agent


@router.get("/{agent_id}", response_model=AgentRead)
def get_agent(agent_id: str, db: Session = Depends(get_db)) -> Agent:
    return get_agent_or_404(agent_id, db)


@router.patch("/{agent_id}", response_model=AgentRead)
def update_agent(agent_id: str, payload: AgentUpdate, db: Session = Depends(get_db)) -> Agent:
    agent = get_agent_or_404(agent_id, db)
    data = payload.model_dump(exclude_unset=True)
    skill_ids = data.pop("skill_ids", None)
    if data.get("slug"):
        data["slug"] = unique_slug(db, agent.pack_id, data["slug"], exclude_id=agent.id)
    for field, value in data.items():
        setattr(agent, field, value)
    if skill_ids is not None:
        agent.skills = resolve_skills(db, agent.pack_id, skill_ids)
    db.commit()
    db.refresh(agent)
    return agent


@router.delete("/{agent_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_agent(agent_id: str, db: Session = Depends(get_db)) -> None:
    db.delete(get_agent_or_404(agent_id, db))
    db.commit()
