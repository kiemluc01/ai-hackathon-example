"""Pack creation: clone a template into rows owned by exactly one pack."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.utils import slugify
from app.models import Pack, Skill
from app.services.templates import get_template

DEFAULT_PLATFORMS = ["claude", "copilot", "codex"]


def unique_pack_slug(db: Session, desired: str, exclude_id: str | None = None) -> str:
    base = slugify(desired, fallback="pack")
    candidate, counter = base, 2
    while True:
        stmt = select(Pack).where(Pack.slug == candidate)
        if exclude_id:
            stmt = stmt.where(Pack.id != exclude_id)
        if db.scalar(stmt) is None:
            return candidate
        candidate = f"{base}-{counter}"
        counter += 1


def create_pack(
    db: Session,
    *,
    name: str,
    description: str = "",
    slug: str | None = None,
    status: str = "draft",
    platforms: list[str] | None = None,
    template_id: str = "blank",
) -> Pack:
    """Create a pack, copying every template skill into brand-new rows.

    Cloned skills get fresh ids and belong only to this pack, so editing one pack
    can never affect another or the template it came from.
    """
    targets = platforms or list(DEFAULT_PLATFORMS)
    pack = Pack(
        slug=unique_pack_slug(db, slug or name),
        name=name,
        description=description,
        status=status,
        source_template=template_id,
        platforms=targets,
    )
    db.add(pack)
    db.flush()

    template = get_template(template_id)
    for entry in (template or {}).get("skills", []):
        db.add(
            Skill(
                pack_id=pack.id,
                slug=entry["slug"],
                name=entry["name"],
                code=entry["code"],
                description=entry["description"],
                content=entry["content"],
                stage=entry["stage"],
                priority=entry["priority"],
                owner=entry["owner"],
                version=entry["version"],
                status="draft",
                user_invocable=entry["user_invocable"],
                tags=list(entry["tags"]),
                platforms=list(targets),
                config={},
            )
        )

    db.flush()
    return pack
