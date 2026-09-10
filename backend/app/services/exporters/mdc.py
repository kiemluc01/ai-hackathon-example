"""Cursor (.mdc rules) and Windsurf (markdown rules) share one shape."""

from app.services.exporters.base import ExportFile, bullet_list, frontmatter
from app.services.platforms import PLATFORM_MAP


def _make(platform: str):
    def skill_files(skill) -> list[ExportFile]:
        config = skill.config or {}
        meta = {
            "description": skill.description,
            "globs": config.get("apply_to") or "",
            "alwaysApply": bool(config.get("always_apply", False)),
        }
        body = [f"# {skill.name}", ""]
        if skill.content:
            body.append(skill.content.strip())
        path = PLATFORM_MAP[platform]["skill_path"].format(slug=skill.slug)
        return [ExportFile(path, frontmatter(meta, "\n".join(body)), platform)]

    def agent_files(agent, skills) -> list[ExportFile]:
        meta = {"description": agent.description, "alwaysApply": False}
        body = [f"# {agent.name}", "", agent.system_prompt.strip() or f"Bạn là {agent.name}."]
        if skills:
            body += ["", "## Skills", "", bullet_list([f"{s.name} — {s.description}" for s in skills])]
        path = PLATFORM_MAP[platform]["agent_path"].format(slug=agent.slug)
        return [ExportFile(path, frontmatter(meta, "\n".join(body)), platform)]

    def workflow_files(workflow, compiled) -> list[ExportFile]:
        meta = {"description": workflow.description or workflow.name, "alwaysApply": False}
        body = [f"# {workflow.name}", "", compiled["markdown"]]
        path = PLATFORM_MAP[platform]["workflow_path"].format(slug=workflow.slug)
        return [ExportFile(path, frontmatter(meta, "\n".join(body)), platform)]

    return skill_files, agent_files, workflow_files


cursor_skill, cursor_agent, cursor_workflow = _make("cursor")
windsurf_skill, windsurf_agent, windsurf_workflow = _make("windsurf")
generic_skill, generic_agent, generic_workflow = _make("generic")
