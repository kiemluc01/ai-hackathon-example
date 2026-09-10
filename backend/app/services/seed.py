"""Seed a demo pack so the app is not empty on first run.

The Context Pack in this repo stays a read-only template — seeding *copies* it into a
normal, fully editable pack exactly the way the UI does.
"""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Agent, Pack, Skill, Workflow
from app.services.packs import DEFAULT_PLATFORMS, create_pack
from app.services.templates import get_template


def _demo_workflow(pack_id: str, agent: Agent, skills: list[Skill]) -> Workflow:
    """A small left-to-right graph so the canvas is never empty on first load."""
    nodes: list[dict] = [
        {
            "id": "trigger",
            "type": "step",
            "position": {"x": 40, "y": 180},
            "data": {"label": "Nhận yêu cầu", "kind": "trigger", "instruction": "Người dùng mô tả task."},
        }
    ]
    edges: list[dict] = []
    previous = "trigger"

    for index, skill in enumerate(skills[:3]):
        node_id = f"skill-{index + 1}"
        nodes.append(
            {
                "id": node_id,
                "type": "step",
                "position": {"x": 320 + index * 280, "y": 180},
                "data": {
                    "label": skill.name,
                    "kind": "skill",
                    "skillId": skill.id,
                    "instruction": skill.description,
                },
            }
        )
        edges.append({"id": f"e-{previous}-{node_id}", "source": previous, "target": node_id})
        previous = node_id

    nodes.append(
        {
            "id": "output",
            "type": "step",
            "position": {"x": 320 + len(skills[:3]) * 280, "y": 180},
            "data": {"label": "Bàn giao kết quả", "kind": "output", "instruction": "Emit RESULT block."},
        }
    )
    edges.append({"id": f"e-{previous}-output", "source": previous, "target": "output"})

    return Workflow(
        pack_id=pack_id,
        slug="default-delivery-flow",
        name="Delivery flow mặc định",
        description="Luồng mẫu: nhận yêu cầu → chạy các skill → bàn giao kết quả.",
        status="draft",
        agent_id=agent.id,
        nodes=nodes,
        edges=edges,
        viewport={"x": 0, "y": 0, "zoom": 0.85},
        platforms=list(DEFAULT_PLATFORMS),
    )


def seed_if_empty(db: Session) -> dict[str, int]:
    if db.scalar(select(Pack).limit(1)) is not None:
        return {"packs": 0, "skills": 0, "agents": 0, "workflows": 0}

    template_id = "context-pack" if get_template("context-pack") else "blank"
    pack = create_pack(
        db,
        name="Pack mẫu",
        description="Được tạo từ Context Pack chuẩn — sửa thoải mái, bản gốc không đổi.",
        template_id=template_id,
        platforms=list(DEFAULT_PLATFORMS),
    )

    skills = list(db.scalars(select(Skill).where(Skill.pack_id == pack.id).order_by(Skill.code)))

    agent = Agent(
        pack_id=pack.id,
        slug="delivery-engineer",
        name="Delivery Engineer",
        description="Agent mặc định chạy trọn vòng đời: hiểu context → implement → review.",
        model="inherit",
        system_prompt=(
            "Bạn là kỹ sư giao hàng. Luôn mở context gate trước khi sửa code, "
            "giữ diff nhỏ nhất có thể, và luôn chạy kiểm chứng trước khi báo hoàn thành."
        ),
        color="violet",
        status="draft",
        tools=["Read", "Edit", "Bash", "Grep"],
        platforms=list(DEFAULT_PLATFORMS),
        config={},
    )
    agent.skills = skills[:6]
    db.add(agent)
    db.flush()

    db.add(_demo_workflow(pack.id, agent, skills))
    db.commit()

    return {"packs": 1, "skills": len(skills), "agents": 1, "workflows": 1}
