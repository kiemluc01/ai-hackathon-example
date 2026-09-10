"use client";

import { use, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button, Card, CheckboxPill, EmptyState, SectionBar } from "@/components/ui";
import type { Agent, Platform, Skill, Workflow } from "@/lib/types";

export default function PackExportPage({ params }: { params: Promise<{ packId: string }> }) {
  const { packId } = use(params);

  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);

  const [targets, setTargets] = useState<string[]>(["claude"]);
  const [skillIds, setSkillIds] = useState<string[]>([]);
  const [agentIds, setAgentIds] = useState<string[]>([]);
  const [workflowIds, setWorkflowIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.platforms().then(setPlatforms);
    api.listSkills(packId).then(setSkills);
    api.listAgents(packId).then(setAgents);
    api.listWorkflows(packId).then(setWorkflows);
  }, [packId]);

  const toggle = (setter: (fn: (prev: string[]) => string[]) => void, id: string) =>
    setter((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const total = skillIds.length + agentIds.length + workflowIds.length;

  const download = async () => {
    setBusy(true);
    setError(null);
    try {
      const blob = await api.downloadBundle({
        pack_id: packId,
        platforms: targets,
        skill_ids: skillIds,
        agent_ids: agentIds,
        workflow_ids: workflowIds,
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "agent-skill-bundle.zip";
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <SectionBar
        title="Xuất bundle"
        subtitle="Chỉ xuất nội dung của bộ skill này, đặt đúng đường dẫn từng nền tảng."
        actions={
          <>
            <Button
              onClick={() => {
                setSkillIds(skills.map((s) => s.id));
                setAgentIds(agents.map((a) => a.id));
                setWorkflowIds(workflows.map((w) => w.id));
              }}
            >
              Chọn tất cả
            </Button>
            <Button variant="primary" onClick={download} disabled={busy || !total || !targets.length}>
              {busy ? "Đang đóng gói..." : `Tải zip (${total})`}
            </Button>
          </>
        }
      />

      <div className="space-y-6 px-8 pb-8">
        {error ? (
          <Card className="border-rose-500/30 bg-rose-500/5 text-sm text-rose-200">{error}</Card>
        ) : null}

        <Card>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
            Nền tảng
          </h3>
          <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {platforms.map((platform) => (
              <CheckboxPill
                key={platform.id}
                checked={targets.includes(platform.id)}
                onChange={() => toggle(setTargets, platform.id)}
                label={platform.label}
                sublabel={platform.vendor}
              />
            ))}
          </div>
        </Card>

        <div className="grid gap-6 xl:grid-cols-3">
          {[
            { title: "Skills", items: skills, selected: skillIds, setter: setSkillIds, sub: (s: Skill) => s.code || s.stage },
            { title: "Agents", items: agents, selected: agentIds, setter: setAgentIds, sub: (a: Agent) => `${a.skills.length} skill` },
            { title: "Workflows", items: workflows, selected: workflowIds, setter: setWorkflowIds, sub: (w: Workflow) => `${w.nodes.length} node` },
          ].map((group) => (
            <Card key={group.title} className="min-w-0">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
                {group.title} ({group.selected.length}/{group.items.length})
              </h3>
              <div className="max-h-96 space-y-2 overflow-auto">
                {(group.items as { id: string; name: string }[]).map((item) => (
                  <CheckboxPill
                    key={item.id}
                    checked={group.selected.includes(item.id)}
                    onChange={() => toggle(group.setter, item.id)}
                    label={item.name}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    sublabel={(group.sub as (x: any) => string)(item)}
                  />
                ))}
                {!group.items.length ? <EmptyState title={`Chưa có ${group.title.toLowerCase()}`} /> : null}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
