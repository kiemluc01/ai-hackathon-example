from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.skill import SkillRead


class AgentBase(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    description: str = ""
    model: str = "inherit"
    system_prompt: str = ""
    color: str = "violet"
    status: str = "draft"
    tools: list[str] = Field(default_factory=list)
    platforms: list[str] = Field(default_factory=lambda: ["claude"])
    config: dict[str, Any] = Field(default_factory=dict)


class AgentCreate(AgentBase):
    slug: str | None = None
    pack_id: str
    skill_ids: list[str] = Field(default_factory=list)


class AgentUpdate(BaseModel):
    name: str | None = None
    slug: str | None = None
    description: str | None = None
    model: str | None = None
    system_prompt: str | None = None
    color: str | None = None
    status: str | None = None
    tools: list[str] | None = None
    platforms: list[str] | None = None
    config: dict[str, Any] | None = None
    skill_ids: list[str] | None = None


class AgentRead(AgentBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    slug: str
    pack_id: str
    skills: list[SkillRead] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime
