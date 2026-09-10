"""Turn a React Flow graph into an ordered, validated playbook."""

from collections import defaultdict, deque
from typing import Any

KIND_LABELS = {
    "trigger": "Trigger",
    "skill": "Skill",
    "agent": "Agent",
    "condition": "Condition",
    "tool": "Tool",
    "output": "Output",
}


def _data(node: dict[str, Any]) -> dict[str, Any]:
    return node.get("data") or {}


def _label(node: dict[str, Any]) -> str:
    return (_data(node).get("label") or node.get("id") or "node").strip()


def compile_workflow(workflow, skills_by_id=None, agents_by_id=None) -> dict[str, Any]:
    skills_by_id = skills_by_id or {}
    agents_by_id = agents_by_id or {}

    nodes: list[dict[str, Any]] = list(workflow.nodes or [])
    edges: list[dict[str, Any]] = list(workflow.edges or [])
    node_map = {n.get("id"): n for n in nodes if n.get("id")}

    errors: list[str] = []
    warnings: list[str] = []
    if not node_map:
        errors.append("Workflow chưa có node nào.")

    indegree: dict[str, int] = {nid: 0 for nid in node_map}
    outgoing: dict[str, list[str]] = defaultdict(list)

    for edge in edges:
        source, target = edge.get("source"), edge.get("target")
        if source not in node_map or target not in node_map:
            warnings.append(f"Bỏ qua edge treo: {source} → {target}")
            continue
        outgoing[source].append(target)
        indegree[target] += 1

    roots = [nid for nid, deg in indegree.items() if deg == 0]
    triggers = [nid for nid, n in node_map.items() if _data(n).get("kind") == "trigger"]

    if node_map and not triggers:
        warnings.append("Workflow chưa có node Trigger — bước đầu được suy ra từ đồ thị.")
    if node_map and not roots:
        errors.append("Không tìm được điểm bắt đầu (mọi node đều có input) — đồ thị có vòng lặp.")

    # Kahn topological sort; triggers first, then original node order.
    order_index = {nid: i for i, nid in enumerate(node_map)}
    queue: deque[str] = deque(sorted(roots, key=lambda n: (n not in triggers, order_index[n])))
    remaining = dict(indegree)
    ordered: list[str] = []

    while queue:
        current = queue.popleft()
        ordered.append(current)
        for nxt in outgoing[current]:
            remaining[nxt] -= 1
            if remaining[nxt] == 0:
                queue.append(nxt)

    if len(ordered) < len(node_map):
        stuck = [nid for nid in node_map if nid not in ordered]
        errors.append("Phát hiện vòng lặp: " + ", ".join(_label(node_map[n]) for n in stuck))
        ordered.extend(stuck)

    steps: list[dict[str, Any]] = []
    for position, nid in enumerate(ordered, start=1):
        node = node_map[nid]
        data = _data(node)
        kind = data.get("kind", "skill")
        detail = data.get("instruction") or ""
        reference = None

        if kind == "skill":
            skill_id = data.get("skillId")
            if not skill_id:
                warnings.append(f"Node '{_label(node)}' chưa gắn skill nào.")
            elif skill_id not in skills_by_id:
                warnings.append(f"Node '{_label(node)}' trỏ tới skill không tồn tại.")
            else:
                skill = skills_by_id[skill_id]
                reference = skill.slug
                detail = detail or skill.description
        elif kind == "agent":
            agent_id = data.get("agentId")
            if agent_id and agent_id in agents_by_id:
                agent = agents_by_id[agent_id]
                reference = agent.slug
                detail = detail or agent.description
            elif agent_id:
                warnings.append(f"Node '{_label(node)}' trỏ tới agent không tồn tại.")

        if not outgoing[nid] and kind != "output":
            warnings.append(f"Node '{_label(node)}' không dẫn tới bước tiếp theo nào.")

        steps.append(
            {
                "order": position,
                "id": nid,
                "label": _label(node),
                "kind": kind,
                "kind_label": KIND_LABELS.get(kind, kind.title()),
                "reference": reference,
                "detail": detail,
                "condition": data.get("condition") or "",
                "next": [_label(node_map[t]) for t in outgoing[nid]],
            }
        )

    return {
        "steps": steps,
        "warnings": warnings,
        "errors": errors,
        "valid": not errors,
        "markdown": render_markdown(workflow, steps),
    }


def render_markdown(workflow, steps: list[dict[str, Any]]) -> str:
    lines: list[str] = []
    if workflow.description:
        lines += [workflow.description.strip(), ""]
    lines += ["## Các bước", ""]
    for step in steps:
        title = step["label"]
        if step["reference"] and step["reference"] != title:
            title = f"{title} → `{step['reference']}`"
        lines.append(f"{step['order']}. **[{step['kind_label']}] {title}**")
        if step["condition"]:
            lines.append(f"   - Điều kiện: {step['condition']}")
        if step["detail"]:
            lines.append(f"   - {step['detail'].strip()}")
        if step["next"]:
            lines.append("   - Bước kế: " + ", ".join(f"`{n}`" for n in step["next"]))
        lines.append("")
    return "\n".join(lines).strip() + "\n"
