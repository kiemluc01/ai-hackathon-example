from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class WorkflowBase(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    description: str = ""
    status: str = "draft"
    agent_id: str | None = None
    nodes: list[dict[str, Any]] = Field(default_factory=list)
    edges: list[dict[str, Any]] = Field(default_factory=list)
    viewport: dict[str, Any] = Field(default_factory=dict)
    platforms: list[str] = Field(default_factory=lambda: ["claude"])


class WorkflowCreate(WorkflowBase):
    slug: str | None = None
    pack_id: str | None = None


class WorkflowUpdate(BaseModel):
    name: str | None = None
    slug: str | None = None
    description: str | None = None
    status: str | None = None
    agent_id: str | None = None
    nodes: list[dict[str, Any]] | None = None
    edges: list[dict[str, Any]] | None = None
    viewport: dict[str, Any] | None = None
    platforms: list[str] | None = None


class WorkflowRead(WorkflowBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    slug: str
    pack_id: str
    created_at: datetime
    updated_at: datetime


class WorkflowStep(BaseModel):
    order: int
    id: str
    label: str
    kind: str
    kind_label: str
    reference: str | None = None
    detail: str = ""
    condition: str = ""
    next: list[str] = Field(default_factory=list)


class WorkflowCompileResult(BaseModel):
    valid: bool
    steps: list[WorkflowStep]
    warnings: list[str]
    errors: list[str]
    markdown: str
