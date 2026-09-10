"""Read-only skill templates.

The Context Pack shipped in this repo is a *standard* used to create new packs from.
It is never edited through the app: creating a pack copies its skills into fresh rows
that belong to that pack alone.
"""

from functools import lru_cache
from pathlib import Path
from typing import Any

import yaml

from app.core.config import settings
from app.core.utils import slugify

BLANK_TEMPLATE_ID = "blank"


def parse_markdown(text: str) -> tuple[dict[str, Any], str]:
    """Split YAML frontmatter from the markdown body."""
    if not text.startswith("---"):
        return {}, text
    parts = text.split("---", 2)
    if len(parts) < 3:
        return {}, text
    try:
        meta = yaml.safe_load(parts[1]) or {}
    except yaml.YAMLError:
        meta = {}
    return (meta if isinstance(meta, dict) else {}), parts[2].strip()


def _read_skill(path: Path) -> dict[str, Any] | None:
    meta, body = parse_markdown(path.read_text(encoding="utf-8"))
    name = str(meta.get("name") or path.parent.name)
    if not name:
        return None
    return {
        "slug": slugify(name),
        "name": name,
        "code": str(meta.get("code") or ""),
        "description": str(meta.get("description") or "").strip(),
        "content": body,
        "stage": str(meta.get("stage") or "development"),
        "priority": str(meta.get("priority") or "medium"),
        "owner": str(meta.get("owner") or ""),
        "version": str(meta.get("version") or "0.1.0"),
        "user_invocable": bool(meta.get("user-invocable", meta.get("user_invocable", True))),
        "tags": [t for t in [meta.get("stage"), meta.get("priority")] if t],
    }


@lru_cache
def load_templates() -> list[dict[str, Any]]:
    """Discover templates on disk. Cached — templates are read-only."""
    templates: list[dict[str, Any]] = [
        {
            "id": BLANK_TEMPLATE_ID,
            "name": "Pack trống",
            "description": "Bắt đầu từ con số không, tự thêm từng skill.",
            "source": "—",
            "skills": [],
        }
    ]

    skills_dir = Path(settings.seed_pack_dir) / "skills"
    if skills_dir.is_dir():
        skills: list[dict[str, Any]] = []
        seen: set[str] = set()
        for skill_file in sorted(skills_dir.glob("*/SKILL.md")):
            skill = _read_skill(skill_file)
            if skill and skill["slug"] not in seen:
                seen.add(skill["slug"])
                skills.append(skill)
        if skills:
            templates.append(
                {
                    "id": "context-pack",
                    "name": "Context Pack chuẩn",
                    "description": (
                        "Bộ skill chuẩn của dự án — dùng làm khuôn để tạo pack mới. "
                        "Bản gốc chỉ đọc, không sửa được trong ứng dụng."
                    ),
                    "source": str(skills_dir),
                    "skills": skills,
                }
            )

    return templates


def get_template(template_id: str) -> dict[str, Any] | None:
    return next((t for t in load_templates() if t["id"] == template_id), None)


def summaries() -> list[dict[str, Any]]:
    """Template list without the full skill bodies."""
    return [
        {
            "id": t["id"],
            "name": t["name"],
            "description": t["description"],
            "source": t["source"],
            "skill_count": len(t["skills"]),
            "skills": [
                {"slug": s["slug"], "name": s["name"], "code": s["code"], "stage": s["stage"]}
                for s in t["skills"]
            ],
        }
        for t in load_templates()
    ]
