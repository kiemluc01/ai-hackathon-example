"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { NodeKind } from "@/lib/types";

export const KIND_STYLE: Record<NodeKind, { ring: string; dot: string; icon: string; label: string }> = {
  trigger: { ring: "border-emerald-400/50", dot: "bg-emerald-400", icon: "▶", label: "Trigger" },
  skill: { ring: "border-indigo-400/50", dot: "bg-indigo-400", icon: "◆", label: "Skill" },
  agent: { ring: "border-violet-400/50", dot: "bg-violet-400", icon: "⬢", label: "Agent" },
  condition: { ring: "border-amber-400/50", dot: "bg-amber-400", icon: "◇", label: "Condition" },
  tool: { ring: "border-sky-400/50", dot: "bg-sky-400", icon: "⚙", label: "Tool" },
  output: { ring: "border-rose-400/50", dot: "bg-rose-400", icon: "■", label: "Output" },
};

export function StepNode({ data, selected }: NodeProps) {
  const kind = ((data as Record<string, unknown>).kind as NodeKind) ?? "skill";
  const style = KIND_STYLE[kind] ?? KIND_STYLE.skill;
  const label = ((data as Record<string, unknown>).label as string) ?? "Bước";
  const instruction = (data as Record<string, unknown>).instruction as string | undefined;
  const condition = (data as Record<string, unknown>).condition as string | undefined;
  const unbound = kind === "skill" && !(data as Record<string, unknown>).skillId;

  return (
    <div
      className={`w-56 rounded-xl border bg-panel/95 px-3 py-2.5 shadow-lg transition ${style.ring} ${
        selected ? "ring-2 ring-indigo-400/70" : ""
      }`}
    >
      {kind !== "trigger" ? (
        <Handle type="target" position={Position.Left} />
      ) : null}

      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${style.dot}`} />
        <span className="text-[10px] uppercase tracking-wider text-slate-500">{style.label}</span>
        {unbound ? (
          <span className="ml-auto text-[10px] text-amber-300" title="Chưa gắn skill">
            ⚠
          </span>
        ) : null}
      </div>

      <div className="mt-1 truncate text-sm font-medium text-slate-100">{label}</div>

      {condition ? (
        <div className="mt-1 truncate text-[11px] text-amber-200/80">if: {condition}</div>
      ) : null}
      {instruction ? (
        <div className="mt-1 line-clamp-2 text-[11px] leading-snug text-slate-400">{instruction}</div>
      ) : null}

      {kind !== "output" ? <Handle type="source" position={Position.Right} /> : null}
    </div>
  );
}
