from sqlalchemy import String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.models.base import TimestampMixin


class Pack(TimestampMixin, Base):
    """An isolated skill pack.

    Every skill, agent and workflow belongs to exactly one pack and is never shared
    across packs — cloning a template copies rows, it does not reference them.
    """

    __tablename__ = "packs"

    slug: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(160))
    description: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(32), default="draft")
    # Which template this pack was created from, for traceability only.
    source_template: Mapped[str] = mapped_column(String(120), default="blank")
    platforms: Mapped[list] = mapped_column(JSONB, default=list)

    skills = relationship(
        "Skill", back_populates="pack", cascade="all, delete-orphan", lazy="selectin"
    )
    agents = relationship(
        "Agent", back_populates="pack", cascade="all, delete-orphan", lazy="selectin"
    )
    workflows = relationship(
        "Workflow", back_populates="pack", cascade="all, delete-orphan", lazy="selectin"
    )
