"use client";

import { use, useEffect, useState } from "react";
import { AgentForm } from "@/components/AgentForm";
import { EmptyState } from "@/components/ui";
import { api } from "@/lib/api";
import type { Agent } from "@/lib/types";

export default function EditAgentPage({
  params,
}: {
  params: Promise<{ packId: string; agentId: string }>;
}) {
  const { packId, agentId } = use(params);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getAgent(agentId).then(setAgent).catch((e: Error) => setError(e.message));
  }, [agentId]);

  if (error)
    return (
      <div className="p-8">
        <EmptyState title="Không tải được agent" hint={error} />
      </div>
    );
  if (!agent)
    return (
      <div className="p-8">
        <EmptyState title="Đang tải..." />
      </div>
    );
  return <AgentForm packId={packId} agent={agent} />;
}
