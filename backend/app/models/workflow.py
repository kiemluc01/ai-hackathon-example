from sqlalchemy import ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.models.base import TimestampMixin


class Workflow(TimestampMixin, Base):
    """A drag & drop graph orchestrating one skill pack / agent."""

    __tablename__ = "workflows"
    __table_args__ = (UniqueConstraint("pack_id", "slug", name="uq_workflow_pack_slug"),)

    pack_id: Mapped[str] = mapped_column(
        String(32), ForeignKey("packs.id", ondelete="CASCADE"), index=True
    )
    slug: Mapped[str] = mapped_column(String(120), index=True)
    name: Mapped[str] = mapped_column(String(160))
    description: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(32), default="draft")
    agent_id: Mapped[str | None] = mapped_column(
        String(32), ForeignKey("agents.id", ondelete="SET NULL"), nullable=True
    )
    nodes: Mapped[list] = mapped_column(JSONB, default=list)
    edges: Mapped[list] = mapped_column(JSONB, default=list)
    viewport: Mapped[dict] = mapped_column(JSONB, default=dict)
    platforms: Mapped[list] = mapped_column(JSONB, default=list)

    pack = relationship("Pack", back_populates="workflows")
    agent = relationship("Agent", lazy="joined")
