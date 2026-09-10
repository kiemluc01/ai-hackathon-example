"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Badge, Button, Card, EmptyState, SectionBar } from "@/components/ui";
import type { Workflow } from "@/lib/types";

export default function PackWorkflowsPage({ params }: { params: Promise<{ packId: string }> }) {
  const { packId } = use(params);
  const router = useRouter();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.listWorkflows(packId).then(setWorkflows).finally(() => setLoading(false));
  };

  useEffect(load, [packId]);

  const create = async () => {
    const created = await api.createWorkflow({
      pack_id: packId,
      name: "Workflow mới",
      description: "",
      platforms: ["claude"],
      nodes: [
        {
          id: "trigger-1",
          type: "step",
          position: { x: 80, y: 160 },
          data: { label: "Nhận yêu cầu", kind: "trigger" },
        },
      ],
      edges: [],
    });
    router.push(`/packs/${packId}/workflows/${created.id}`);
  };

  const remove = async (workflow: Workflow) => {
    if (!confirm(`Xoá workflow "${workflow.name}"?`)) return;
    await api.deleteWorkflow(workflow.id);
    load();
  };

  return (
    <>
      <SectionBar
        title="Workflows"
        subtitle="Kéo thả để nối các skill của bộ này thành một quy trình."
        actions={
          <Button variant="primary" onClick={create}>
            + Tạo workflow
          </Button>
        }
      />

      <div className="px-8 pb-8">
        {loading ? (
          <EmptyState title="Đang tải..." />
        ) : workflows.length === 0 ? (
          <EmptyState title="Chưa có workflow nào" hint="Bấm “Tạo workflow” để mở canvas kéo thả." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {workflows.map((workflow) => (
              <Card key={workflow.id} className="flex min-w-0 flex-col">
                <Link href={`/packs/${packId}/workflows/${workflow.id}`} className="min-w-0">
                  <h3 className="truncate font-medium text-white hover:text-indigo-300">
                    {workflow.name}
                  </h3>
                  <code className="text-xs text-slate-500">{workflow.slug}</code>
                </Link>

                <p className="mt-3 line-clamp-2 flex-1 text-sm text-slate-400">
                  {workflow.description || "Chưa có mô tả."}
                </p>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  <Badge>{workflow.nodes.length} node</Badge>
                  <Badge>{workflow.edges.length} liên kết</Badge>
                  {workflow.platforms.map((p) => (
                    <Badge key={p} tone="indigo">
                      {p}
                    </Badge>
                  ))}
                </div>

                <div className="mt-4 flex gap-2 border-t border-white/5 pt-3">
                  <Link
                    href={`/packs/${packId}/workflows/${workflow.id}`}
                    className="min-w-0 flex-1"
                  >
                    <Button className="w-full">Mở canvas</Button>
                  </Link>
                  <Button variant="danger" onClick={() => remove(workflow)}>
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
