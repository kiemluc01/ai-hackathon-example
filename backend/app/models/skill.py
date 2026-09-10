from sqlalchemy import Boolean, Column, ForeignKey, String, Table, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.models.base import TimestampMixin

agent_skills = Table(
    "agent_skills",
    Base.metadata,
    Column("agent_id", String(32), ForeignKey("agents.id", ondelete="CASCADE"), primary_key=True),
    Column("skill_id", String(32), ForeignKey("skills.id", ondelete="CASCADE"), primary_key=True),
)


class Skill(TimestampMixin, Base):
    """A capability inside one pack, compiled into each AI platform's own format."""

    __tablename__ = "skills"
    __table_args__ = (UniqueConstraint("pack_id", "slug", name="uq_skill_pack_slug"),)

    pack_id: Mapped[str] = mapped_column(
        String(32), ForeignKey("packs.id", ondelete="CASCADE"), index=True
    )
    slug: Mapped[str] = mapped_column(String(120), index=True)
    name: Mapped[str] = mapped_column(String(160))
    code: Mapped[str] = mapped_column(String(32), default="")
    description: Mapped[str] = mapped_column(Text, default="")
    content: Mapped[str] = mapped_column(Text, default="")
    stage: Mapped[str] = mapped_column(String(60), default="development")
    priority: Mapped[str] = mapped_column(String(32), default="medium")
    owner: Mapped[str] = mapped_column(String(80), default="")
    version: Mapped[str] = mapped_column(String(32), default="0.1.0")
    status: Mapped[str] = mapped_column(String(32), default="draft")
    user_invocable: Mapped[bool] = mapped_column(Boolean, default=True)
    tags: Mapped[list] = mapped_column(JSONB, default=list)
    platforms: Mapped[list] = mapped_column(JSONB, default=list)
    # Platform hints: allowed_tools, model, apply_to globs, argument_hint...
    config: Mapped[dict] = mapped_column(JSONB, default=dict)

    pack = relationship("Pack", back_populates="skills")
    agents = relationship("Agent", secondary=agent_skills, back_populates="skills")
