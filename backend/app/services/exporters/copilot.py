from app.services.exporters.base import ExportFile, bullet_list, frontmatter
from app.services.platforms import PLATFORM_MAP

PLATFORM = "copilot"


def skill_files(skill) -> list[ExportFile]:
    apply_to = (skill.config or {}).get("apply_to") or "**"
    meta = {"applyTo": apply_to, "description": skill.description}

    body = [f"# {skill.name}", ""]
    if skill.description:
        body += [skill.description.strip(), ""]
    if skill.content:
        body.append(skill.content.strip())

    path = PLATFORM_MAP[PLATFORM]["skill_path"].format(slug=skill.slug)
    return [
        ExportFile(
            path,
            frontmatter(meta, "\n".join(body)),
            PLATFORM,
            notes=[f"Áp dụng cho file khớp `{apply_to}`."],
        )
    ]


def agent_files(agent, skills) -> list[ExportFile]:
    meta = {"description": agent.description}
    if agent.tools:
        meta["tools"] = agent.tools
    if agent.model and agent.model != "inherit":
        meta["model"] = agent.model

    body = [f"# {agent.name}", "", agent.system_prompt.strip() or f"Bạn là {agent.name}."]
    if skills:
        body += ["", "## Hướng dẫn tham chiếu", ""]
        body.append(
            bullet_list([f"[{s.name}](../instructions/{s.slug}.instructions.md)" for s in skills])
        )

    path = PLATFORM_MAP[PLATFORM]["agent_path"].format(slug=agent.slug)
    return [ExportFile(path, frontmatter(meta, "\n".join(body)), PLATFORM)]


def workflow_files(workflow, compiled) -> list[ExportFile]:
    meta = {"mode": "agent", "description": workflow.description or workflow.name}
    body = [f"# {workflow.name}", "", compiled["markdown"]]
    path = PLATFORM_MAP[PLATFORM]["workflow_path"].format(slug=workflow.slug)
    return [
        ExportFile(
            path,
            frontmatter(meta, "\n".join(body)),
            PLATFORM,
            notes=[f"Gọi bằng `/{workflow.slug}` trong Copilot Chat."],
        )
    ]
