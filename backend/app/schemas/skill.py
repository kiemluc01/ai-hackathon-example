from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class SkillBase(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    description: str = ""
    content: str = ""
    code: str = ""
    stage: str = "development"
    priority: str = "medium"
    owner: str = ""
    version: str = "0.1.0"
    status: str = "draft"
    user_invocable: bool = True
    tags: list[str] = Field(default_factory=list)
    platforms: list[str] = Field(default_factory=lambda: ["claude"])
    config: dict[str, Any] = Field(default_factory=dict)


class SkillCreate(SkillBase):
    slug: str | None = None
    pack_id: str


class SkillUpdate(BaseModel):
    name: str | None = None
    slug: str | None = None
    description: str | None = None
    content: str | None = None
    code: str | None = None
    stage: str | None = None
    priority: str | None = None
    owner: str | None = None
    version: str | None = None
    status: str | None = None
    user_invocable: bool | None = None
    tags: list[str] | None = None
    platforms: list[str] | None = None
    config: dict[str, Any] | None = None


class SkillRead(SkillBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    slug: str
    pack_id: str
    created_at: datetime
    updated_at: datetime
