from pydantic import BaseModel, Field


class ExportFileRead(BaseModel):
    path: str
    content: str
    platform: str
    language: str = "markdown"
    notes: list[str] = Field(default_factory=list)


class ExportPreview(BaseModel):
    platforms: list[str]
    files: list[ExportFileRead]


class BundleRequest(BaseModel):
    pack_id: str
    platforms: list[str] = Field(default_factory=lambda: ["claude"])
    skill_ids: list[str] = Field(default_factory=list)
    agent_ids: list[str] = Field(default_factory=list)
    workflow_ids: list[str] = Field(default_factory=list)
    include_all: bool = False  # everything in the pack, ignoring the id lists
