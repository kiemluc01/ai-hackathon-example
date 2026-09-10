from app.services.exporters.base import ExportFile, bullet_list
from app.services.platforms import PLATFORM_MAP

PLATFORM = "codex"


def _heading(skill) -> str:
    return f"# {skill.name}" + (f" ({skill.code})" if skill.code else "")


def skill_files(skill) -> list[ExportFile]:
    body = [_heading(skill), ""]
    if skill.description:
        body += ["> " + skill.description.strip(), ""]
    meta = [f"**Stage:** {skill.stage}", f"**Priority:** {skill.priority}", f"**Version:** {skill.version}"]
    body += [" · ".join(meta), ""]
    if skill.content:
        body.append(skill.content.strip())

    path = PLATFORM_MAP[PLATFORM]["skill_path"].format(slug=skill.slug)
    return [
        ExportFile(
            path,
            "\n".join(body).strip() + "\n",
            PLATFORM,
            notes=["Codex đọc markdown thuần — metadata được viết inline thay vì frontmatter."],
        )
    ]


def agent_files(agent, skills) -> list[ExportFile]:
    body = [f"# {agent.name}", ""]
    if agent.description:
        body += [agent.description.strip(), ""]
    body += ["## Vai trò", "", agent.system_prompt.strip() or f"Bạn là {agent.name}.", ""]
    if agent.tools:
        body += ["## Công cụ được phép", "", bullet_list(agent.tools), ""]
    if skills:
        body += ["## Skills", "", bullet_list([f"**{s.name}** — {s.description}" for s in skills]), ""]

    path = PLATFORM_MAP[PLATFORM]["agent_path"].format(slug=agent.slug)
    return [
        ExportFile(
            path,
            "\n".join(body).strip() + "\n",
            PLATFORM,
            notes=["Gộp nội dung này vào AGENTS.md ở gốc repo để Codex luôn đọc được."],
        )
    ]


def workflow_files(workflow, compiled) -> list[ExportFile]:
    body = [f"# {workflow.name}", "", compiled["markdown"]]
    path = PLATFORM_MAP[PLATFORM]["workflow_path"].format(slug=workflow.slug)
    return [ExportFile(path, "\n".join(body).strip() + "\n", PLATFORM)]
