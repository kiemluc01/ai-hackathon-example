"""Dispatch an entity + platform pair to the right exporter."""

from app.services.exporters import claude, codex, copilot, mdc
from app.services.exporters.base import ExportFile
from app.services.platforms import PLATFORM_IDS

EXPORTERS = {
    "claude": (claude.skill_files, claude.agent_files, claude.workflow_files),
    "copilot": (copilot.skill_files, copilot.agent_files, copilot.workflow_files),
    "codex": (codex.skill_files, codex.agent_files, codex.workflow_files),
    "cursor": (mdc.cursor_skill, mdc.cursor_agent, mdc.cursor_workflow),
    "windsurf": (mdc.windsurf_skill, mdc.windsurf_agent, mdc.windsurf_workflow),
    "generic": (mdc.generic_skill, mdc.generic_agent, mdc.generic_workflow),
}


def resolve_platforms(requested: list[str] | None, fallback: list[str] | None = None) -> list[str]:
    """Keep only known platform ids, preserving registry order."""
    wanted = [p for p in (requested or fallback or []) if p in EXPORTERS]
    if not wanted:
        wanted = ["claude"]
    return [p for p in PLATFORM_IDS if p in set(wanted)]


def export_skill(skill, platform: str) -> list[ExportFile]:
    return EXPORTERS[platform][0](skill)


def export_agent(agent, skills, platform: str) -> list[ExportFile]:
    return EXPORTERS[platform][1](agent, skills)


def export_workflow(workflow, compiled, platform: str) -> list[ExportFile]:
    return EXPORTERS[platform][2](workflow, compiled)
