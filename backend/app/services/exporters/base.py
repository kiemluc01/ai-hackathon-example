from dataclasses import dataclass, field
from typing import Any

import yaml


@dataclass
class ExportFile:
    path: str
    content: str
    platform: str
    language: str = "markdown"
    notes: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "path": self.path,
            "content": self.content,
            "platform": self.platform,
            "language": self.language,
            "notes": self.notes,
        }


def frontmatter(data: dict[str, Any], body: str) -> str:
    """Render a markdown document with a YAML frontmatter block."""
    clean = {k: v for k, v in data.items() if v not in (None, "", [], {})}
    if not clean:
        return body.strip() + "\n"
    header = yaml.safe_dump(clean, sort_keys=False, allow_unicode=True, default_flow_style=False)
    return f"---\n{header}---\n\n{body.strip()}\n"


def bullet_list(items: list[str]) -> str:
    return "\n".join(f"- {item}" for item in items if item)
