"""Package a list of ExportFile into an in-memory zip."""

import io
import zipfile
from datetime import datetime, timezone

from app.services.exporters.base import ExportFile


def build_zip(files: list[ExportFile], readme: str | None = None) -> bytes:
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as archive:
        if readme:
            archive.writestr("README.md", readme)
        seen: set[str] = set()
        for item in files:
            path = item.path
            if path in seen:
                continue
            seen.add(path)
            archive.writestr(path, item.content)
    return buffer.getvalue()


def build_readme(platforms: list[str], counts: dict[str, int], pack_name: str = "") -> str:
    stamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    lines = [
        f"# {pack_name or 'Agent Skill Bundle'}",
        "",
        f"Xuất lúc {stamp} bởi Agent Skill Studio.",
        "",
        "## Nền tảng",
        "",
        *[f"- {p}" for p in platforms],
        "",
        "## Nội dung",
        "",
        *[f"- {label}: {count}" for label, count in counts.items()],
        "",
        "Giải nén vào gốc repo — mỗi file đã nằm đúng đường dẫn nền tảng yêu cầu.",
        "",
    ]
    return "\n".join(lines)
