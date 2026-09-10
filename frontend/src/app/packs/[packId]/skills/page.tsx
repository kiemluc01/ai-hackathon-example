"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { Badge, Button, Card, EmptyState, Input, SectionBar, Select } from "@/components/ui";
import type { Skill } from "@/lib/types";

const PRIORITY_TONE: Record<string, string> = {
  critical: "rose",
  high: "amber",
  medium: "indigo",
  low: "slate",
};

export default function PackSkillsPage({ params }: { params: Promise<{ packId: string }> }) {
  const { packId } = use(params);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api
      .listSkills(packId)
      .then(setSkills)
      .finally(() => setLoading(false));
  };

  useEffect(load, [packId]);

  const stages = useMemo(() => Array.from(new Set(skills.map((s) => s.stage))).sort(), [skills]);

  const visible = skills.filter((skill) => {
    const haystack = `${skill.name} ${skill.code} ${skill.description}`.toLowerCase();
    return haystack.includes(query.toLowerCase()) && (!stage || skill.stage === stage);
  });

  const duplicate = async (id: string) => {
    await api.duplicateSkill(id);
    load();
  };

  const remove = async (skill: Skill) => {
    if (!confirm(`Xoá skill "${skill.name}"?`)) return;
    await api.deleteSkill(skill.id);
    load();
  };

  return (
    <>
      <SectionBar
        title="Skills"
        subtitle="Chỉ thuộc bộ skill này — sửa ở đây không ảnh hưởng pack khác."
        actions={
          <Link href={`/packs/${packId}/skills/new`}>
            <Button variant="primary">+ Tạo skill mới</Button>
          </Link>
        }
      />

      <div className="space-y-4 px-8 pb-8">
        <div className="flex flex-wrap gap-3">
          <Input
            placeholder="Tìm theo tên, code hoặc mô tả..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="max-w-md"
          />
          <Select value={stage} onChange={(e) => setStage(e.target.value)} className="max-w-[200px]">
            <option value="">Tất cả giai đoạn</option>
            {stages.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
          <span className="self-center text-sm text-slate-500">{visible.length} skill</span>
        </div>

        {loading ? (
          <EmptyState title="Đang tải..." />
        ) : visible.length === 0 ? (
          <EmptyState
            title="Chưa có skill nào khớp bộ lọc"
            hint="Thử xoá bộ lọc hoặc tạo skill mới."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {visible.map((skill) => (
              <Card key={skill.id} className="flex min-w-0 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/packs/${packId}/skills/${skill.id}`} className="min-w-0">
                    <h3 className="truncate font-medium text-white hover:text-indigo-300">
                      {skill.name}
                    </h3>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {skill.code ? <Badge>{skill.code}</Badge> : null}
                      <Badge tone={PRIORITY_TONE[skill.priority] ?? "slate"}>{skill.priority}</Badge>
                      <Badge>{skill.stage}</Badge>
                    </div>
                  </Link>
                  <span className="shrink-0 text-xs text-slate-500">v{skill.version}</span>
                </div>

                <p className="mt-3 line-clamp-3 flex-1 text-sm text-slate-400">
                  {skill.description || "Chưa có mô tả."}
                </p>

                <div className="mt-4 flex flex-wrap gap-1">
                  {skill.platforms.map((p) => (
                    <Badge key={p} tone="indigo">
                      {p}
                    </Badge>
                  ))}
                </div>

                <div className="mt-4 flex gap-2 border-t border-white/5 pt-3">
                  <Link href={`/packs/${packId}/skills/${skill.id}`} className="min-w-0 flex-1">
                    <Button className="w-full">Mở</Button>
                  </Link>
                  <Button onClick={() => duplicate(skill.id)}>Nhân bản</Button>
                  <Button variant="danger" onClick={() => remove(skill)}>
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
