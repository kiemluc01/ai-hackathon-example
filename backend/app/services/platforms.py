"""Registry of AI platforms we can compile skills / agents / workflows for."""

from typing import Any

PLATFORMS: list[dict[str, Any]] = [
    {
        "id": "claude",
        "label": "Claude Code",
        "vendor": "Anthropic",
        "description": "Progressive-disclosure skills, subagents và slash command dưới .claude/.",
        "skill_path": ".claude/skills/{slug}/SKILL.md",
        "agent_path": ".claude/agents/{slug}.md",
        "workflow_path": ".claude/commands/{slug}.md",
        "supports": ["skills", "agents", "workflows"],
        "accent": "#d97757",
    },
    {
        "id": "copilot",
        "label": "GitHub Copilot",
        "vendor": "GitHub",
        "description": "Custom instructions, prompt files và chat modes dưới .github/.",
        "skill_path": ".github/instructions/{slug}.instructions.md",
        "agent_path": ".github/chatmodes/{slug}.chatmode.md",
        "workflow_path": ".github/prompts/{slug}.prompt.md",
        "supports": ["skills", "agents", "workflows"],
        "accent": "#6e7681",
    },
    {
        "id": "codex",
        "label": "OpenAI Codex",
        "vendor": "OpenAI",
        "description": "Hướng dẫn AGENTS.md kèm prompt tái sử dụng trong .codex/prompts/.",
        "skill_path": ".codex/skills/{slug}.md",
        "agent_path": "AGENTS.{slug}.md",
        "workflow_path": ".codex/prompts/{slug}.md",
        "supports": ["skills", "agents", "workflows"],
        "accent": "#10a37f",
    },
    {
        "id": "cursor",
        "label": "Cursor",
        "vendor": "Anysphere",
        "description": "Rule file .mdc trong .cursor/rules/ có glob scoping.",
        "skill_path": ".cursor/rules/{slug}.mdc",
        "agent_path": ".cursor/rules/agent-{slug}.mdc",
        "workflow_path": ".cursor/rules/workflow-{slug}.mdc",
        "supports": ["skills", "agents", "workflows"],
        "accent": "#4f46e5",
    },
    {
        "id": "windsurf",
        "label": "Windsurf",
        "vendor": "Codeium",
        "description": "Rules và workflows markdown dưới .windsurf/.",
        "skill_path": ".windsurf/rules/{slug}.md",
        "agent_path": ".windsurf/rules/agent-{slug}.md",
        "workflow_path": ".windsurf/workflows/{slug}.md",
        "supports": ["skills", "agents", "workflows"],
        "accent": "#0ea5e9",
    },
    {
        "id": "generic",
        "label": "Generic / Portable",
        "vendor": "—",
        "description": "Bundle markdown trung lập, thích ứng với runtime bất kỳ.",
        "skill_path": "agent-pack/skills/{slug}.md",
        "agent_path": "agent-pack/agents/{slug}.md",
        "workflow_path": "agent-pack/workflows/{slug}.md",
        "supports": ["skills", "agents", "workflows"],
        "accent": "#64748b",
    },
]

PLATFORM_IDS = [p["id"] for p in PLATFORMS]
PLATFORM_MAP = {p["id"]: p for p in PLATFORMS}


def get_platform(platform_id: str) -> dict[str, Any] | None:
    return PLATFORM_MAP.get(platform_id)
