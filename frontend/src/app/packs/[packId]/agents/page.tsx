"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Badge, Button, Card, EmptyState, SectionBar } from "@/components/ui";
import type { Agent } from "@/lib/types";

export default function PackAgentsPage({ params }: { params: Promise<{ packId: string }> }) {
  const { packId } = use(params);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.listAgents(packId).then(setAgents).finally(() => setLoading(false));
  };

  useEffect(load, [packId]);

  const remove = async (agent: Agent) => {
    if (!confirm(`Xoá agent "${agent.name}"?`)) return;
    await api.deleteAgent(agent.id);
    load();
  };

  return (
    <>
      <SectionBar
        title="Agents"
        subtitle="Chỉ gắn được skill nằm trong chính bộ skill này."
        actions={
          <Link href={`/packs/${packId}/agents/new`}>
            <Button variant="primary">+ Tạo agent mới</Button>
          </Link>
        }
      />

      <div className="px-8 pb-8">
        {loading ? (
          <EmptyState title="Đang tải..." />
        ) : agents.length === 0 ? (
          <EmptyState title="Chưa có agent nào" hint="Tạo agent để gom các skill của pack lại." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {agents.map((agent) => (
              <Card key={agent.id} className="flex min-w-0 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <Link href={`/packs/${packId}/agents/${agent.id}`} className="min-w-0">
                    <h3 className="truncate font-medium text-white hover:text-indigo-300">
                      {agent.name}
                    </h3>
                    <code className="text-xs text-slate-500">{agent.slug}</code>
                  </Link>
                  <Badge tone={agent.status === "published" ? "green" : "slate"}>
                    {agent.status}
                  </Badge>
                </div>

                <p className="mt-3 line-clamp-2 flex-1 text-sm text-slate-400">
                  {agent.description || "Chưa có mô tả."}
                </p>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  <Badge tone="indigo">{agent.model}</Badge>
                  <Badge>{agent.skills.length} skill</Badge>
                  {agent.tools.slice(0, 3).map((tool) => (
                    <Badge key={tool}>{tool}</Badge>
                  ))}
                </div>

                <div className="mt-4 flex gap-2 border-t border-white/5 pt-3">
                  <Link href={`/packs/${packId}/agents/${agent.id}`} className="min-w-0 flex-1">
                    <Button className="w-full">Mở</Button>
                  </Link>
                  <Button variant="danger" onClick={() => remove(agent)}>
                    Xoá
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
