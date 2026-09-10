from app.services.exporters.base import ExportFile, bullet_list, frontmatter
from app.services.platforms import PLATFORM_MAP

PLATFORM = "claude"


def skill_files(skill) -> list[ExportFile]:
    config = skill.config or {}
    meta = {"name": skill.slug, "description": skill.description}
    if skill.code:
        meta["code"] = skill.code
    if skill.version:
        meta["version"] = skill.version
    if skill.stage:
        meta["stage"] = skill.stage
    if skill.priority:
        meta["priority"] = skill.priority
    if skill.owner:
        meta["owner"] = skill.owner
    meta["user-invocable"] = bool(skill.user_invocable)
    if config.get("allowed_tools"):
        meta["allowed-tools"] = config["allowed_tools"]
    if config.get("model") and config["model"] != "inherit":
        meta["model"] = config["model"]

    body = [f"# {skill.name}", ""]
    if skill.content:
        body.append(skill.content.strip())
    if skill.tags:
        body += ["", "## Tags", "", bullet_list(skill.tags)]

    path = PLATFORM_MAP[PLATFORM]["skill_path"].format(slug=skill.slug)
    return [
        ExportFile(
            path=path,
            content=frontmatter(meta, "\n".join(body)),
            platform=PLATFORM,
            notes=["Claude Code dùng frontmatter `name` + `description` để quyết định khi nào nạp skill."],
        )
    ]


def agent_files(agent, skills) -> list[ExportFile]:
    meta = {"name": agent.slug, "description": agent.description}
    if agent.tools:
        meta["tools"] = ", ".join(agent.tools)
    if agent.model and agent.model != "inherit":
        meta["model"] = agent.model
    if agent.color:
        meta["color"] = agent.color

    body = [agent.system_prompt.strip() or f"Bạn là {agent.name}."]
    if skills:
        body += ["", "## Skills khả dụng", ""]
        body.append(bullet_list([f"`{s.slug}` — {s.description}" for s in skills]))

    path = PLATFORM_MAP[PLATFORM]["agent_path"].format(slug=agent.slug)
    return [ExportFile(path, frontmatter(meta, "\n".join(body)), PLATFORM)]


def workflow_files(workflow, compiled) -> list[ExportFile]:
    meta = {"description": workflow.description or f"Workflow {workflow.name}"}
    body = [f"# {workflow.name}", "", compiled["markdown"]]
    path = PLATFORM_MAP[PLATFORM]["workflow_path"].format(slug=workflow.slug)
    return [
        ExportFile(
            path,
            frontmatter(meta, "\n".join(body)),
            PLATFORM,
            notes=[f"Gọi bằng slash command `/{workflow.slug}` trong Claude Code."],
        )
    ]
