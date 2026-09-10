from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import Agent, Pack, Skill, Workflow
from app.schemas.export import BundleRequest, ExportPreview
from app.services.bundler import build_readme, build_zip
from app.services.exporters.base import ExportFile
from app.services.exporters.registry import (
    export_agent,
    export_skill,
    export_workflow,
    resolve_platforms,
)
from app.services.workflow_compiler import compile_workflow

router = APIRouter(prefix="/exports", tags=["exports"])


def _compiled(db: Session, workflow: Workflow) -> dict:
    """Resolve node references inside the workflow's own pack only."""
    skills = {
        s.id: s for s in db.scalars(select(Skill).where(Skill.pack_id == workflow.pack_id))
    }
    agents = {
        a.id: a for a in db.scalars(select(Agent).where(Agent.pack_id == workflow.pack_id))
    }
    return compile_workflow(workflow, skills, agents)


@router.get("/skills/{skill_id}", response_model=ExportPreview)
def preview_skill(
    skill_id: str,
    db: Session = Depends(get_db),
    platforms: list[str] | None = Query(default=None),
) -> ExportPreview:
    skill = db.get(Skill, skill_id)
    if skill is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy skill")
    targets = resolve_platforms(platforms, skill.platforms)
    files = [f for p in targets for f in export_skill(skill, p)]
    return ExportPreview(platforms=targets, files=[f.to_dict() for f in files])


@router.get("/agents/{agent_id}", response_model=ExportPreview)
def preview_agent(
    agent_id: str,
    db: Session = Depends(get_db),
    platforms: list[str] | None = Query(default=None),
) -> ExportPreview:
    agent = db.get(Agent, agent_id)
    if agent is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy agent")
    targets = resolve_platforms(platforms, agent.platforms)
    files = [f for p in targets for f in export_agent(agent, agent.skills, p)]
    return ExportPreview(platforms=targets, files=[f.to_dict() for f in files])


@router.get("/workflows/{workflow_id}", response_model=ExportPreview)
def preview_workflow(
    workflow_id: str,
    db: Session = Depends(get_db),
    platforms: list[str] | None = Query(default=None),
) -> ExportPreview:
    workflow = db.get(Workflow, workflow_id)
    if workflow is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy workflow")
    targets = resolve_platforms(platforms, workflow.platforms)
    compiled = _compiled(db, workflow)
    files = [f for p in targets for f in export_workflow(workflow, compiled, p)]
    return ExportPreview(platforms=targets, files=[f.to_dict() for f in files])


@router.post("/bundle")
def download_bundle(payload: BundleRequest, db: Session = Depends(get_db)) -> Response:
    pack = db.get(Pack, payload.pack_id)
    if pack is None:
        raise HTTPException(status_code=400, detail="Pack không tồn tại")

    targets = resolve_platforms(payload.platforms, pack.platforms)

    def scoped(model, ids: list[str]):
        stmt = select(model).where(model.pack_id == pack.id)
        if not payload.include_all:
            stmt = stmt.where(model.id.in_(ids or [""]))
        return list(db.scalars(stmt))

    skills = scoped(Skill, payload.skill_ids)
    agents = scoped(Agent, payload.agent_ids)
    workflows = scoped(Workflow, payload.workflow_ids)

    if not (skills or agents or workflows):
        raise HTTPException(status_code=400, detail="Chưa chọn nội dung nào để xuất")

    files: list[ExportFile] = []
    for platform in targets:
        files += [f for s in skills for f in export_skill(s, platform)]
        files += [f for a in agents for f in export_agent(a, a.skills, platform)]
        for workflow in workflows:
            files += export_workflow(workflow, _compiled(db, workflow), platform)

    readme = build_readme(
        targets,
        {"Skills": len(skills), "Agents": len(agents), "Workflows": len(workflows)},
        pack_name=pack.name,
    )
    archive = build_zip(files, readme)
    return Response(
        content=archive,
        media_type="application/zip",
        headers={
            "Content-Disposition": f'attachment; filename="{pack.slug}-bundle.zip"'
        },
    )
