"use client";

import { use, useEffect, useState } from "react";
import { WorkflowCanvas } from "@/components/WorkflowCanvas";
import { EmptyState } from "@/components/ui";
import { api } from "@/lib/api";
import type { Workflow } from "@/lib/types";

export default function WorkflowEditorPage({
  params,
}: {
  params: Promise<{ packId: string; workflowId: string }>;
}) {
  const { packId, workflowId } = use(params);
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getWorkflow(workflowId).then(setWorkflow).catch((e: Error) => setError(e.message));
  }, [workflowId]);

  if (error)
    return (
      <div className="p-8">
        <EmptyState title="Không tải được workflow" hint={error} />
      </div>
    );
  if (!workflow)
    return (
      <div className="p-8">
        <EmptyState title="Đang tải canvas..." />
      </div>
    );
  return <WorkflowCanvas packId={packId} workflow={workflow} />;
}
