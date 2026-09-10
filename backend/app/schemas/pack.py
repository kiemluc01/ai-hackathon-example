from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class PackBase(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    description: str = ""
    status: str = "draft"
    platforms: list[str] = Field(default_factory=lambda: ["claude"])


class PackCreate(PackBase):
    slug: str | None = None
    # Which template to copy skills from. "blank" starts empty.
    template_id: str = "blank"


class PackUpdate(BaseModel):
    name: str | None = None
    slug: str | None = None
    description: str | None = None
    status: str | None = None
    platforms: list[str] | None = None


class PackRead(PackBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    slug: str
    source_template: str
    created_at: datetime
    updated_at: datetime


class PackSummary(PackRead):
    skill_count: int = 0
    agent_count: int = 0
    workflow_count: int = 0


class TemplateSkill(BaseModel):
    slug: str
    name: str
    code: str
    stage: str


class TemplateSummary(BaseModel):
    id: str
    name: str
    description: str
    source: str
    skill_count: int
    skills: list[TemplateSkill] = Field(default_factory=list)


class TemplateDetail(TemplateSummary):
    full_skills: list[dict[str, Any]] = Field(default_factory=list)
