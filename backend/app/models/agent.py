from sqlalchemy import ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.models.base import TimestampMixin
from app.models.skill import agent_skills


class Agent(TimestampMixin, Base):
    """A named assistant: a system prompt plus the skills and tools it may use."""

    __tablename__ = "agents"
    __table_args__ = (UniqueConstraint("pack_id", "slug", name="uq_agent_pack_slug"),)

    pack_id: Mapped[str] = mapped_column(
        String(32), ForeignKey("packs.id", ondelete="CASCADE"), index=True
    )
    slug: Mapped[str] = mapped_column(String(120), index=True)
    name: Mapped[str] = mapped_column(String(160))
    description: Mapped[str] = mapped_column(Text, default="")
    model: Mapped[str] = mapped_column(String(80), default="inherit")
    system_prompt: Mapped[str] = mapped_column(Text, default="")
    color: Mapped[str] = mapped_column(String(32), default="violet")
    status: Mapped[str] = mapped_column(String(32), default="draft")
    tools: Mapped[list] = mapped_column(JSONB, default=list)
    platforms: Mapped[list] = mapped_column(JSONB, default=list)
    config: Mapped[dict] = mapped_column(JSONB, default=dict)

    pack = relationship("Pack", back_populates="agents")
    skills = relationship(
        "Skill", secondary=agent_skills, back_populates="agents", lazy="selectin"
    )
