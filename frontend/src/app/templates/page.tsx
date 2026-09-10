"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import type { Template } from "@/lib/types";

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.listTemplates().then(setTemplates).finally(() => setLoading(false));
  }, []);

  return (
    <>
      <PageHeader
        title="Template chuẩn"
        subtitle="Khuôn dùng để tạo bộ skill mới. Chỉ đọc — sửa một pack không bao giờ đụng tới template."
      />

      <div className="space-y-6 p-8">
        {loading ? <EmptyState title="Đang tải..." /> : null}

        {templates.map((template) => (
          <Card key={template.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-medium text-white">{template.name}</h2>
                <p className="mt-1 text-sm text-slate-400">{template.description}</p>
                {template.source !== "—" ? (
                  <code className="mt-1 block break-all text-xs text-indigo-300">
                    {template.source}
                  </code>
                ) : null}
              </div>
              <div className="flex shrink-0 gap-2">
                <Badge tone="indigo">{template.skill_count} skill</Badge>
                <Badge>chỉ đọc</Badge>
              </div>
            </div>

            {template.skills.length ? (
              <div className="mt-4 grid gap-2 border-t border-white/5 pt-4 sm:grid-cols-2 lg:grid-cols-3">
                {template.skills.map((skill) => (
                  <div
                    key={skill.slug}
                    className="rounded-lg border border-white/10 bg-black/20 px-3 py-2"
                  >
                    <div className="truncate text-sm text-slate-200">{skill.name}</div>
                    <div className="mt-0.5 text-xs text-slate-500">
                      {skill.code || "—"} · {skill.stage}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </Card>
        ))}
      </div>
    </>
  );
}
