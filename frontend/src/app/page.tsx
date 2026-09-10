"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Badge, Button, Card, EmptyState, Field, Input, PageHeader, Select, Textarea } from "@/components/ui";
import type { PackSummary, Template } from "@/lib/types";

export default function PacksPage() {
  const router = useRouter();
  const [packs, setPacks] = useState<PackSummary[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [templateId, setTemplateId] = useState("context-pack");

  const load = () => {
    setLoading(true);
    api
      .listPacks()
      .then(setPacks)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    api.listTemplates().then(setTemplates).catch(() => undefined);
  }, []);

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const pack = await api.createPack({ name, description, template_id: templateId });
      router.push(`/packs/${pack.id}/skills`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const remove = async (pack: PackSummary) => {
    if (!confirm(`Xoá bộ skill "${pack.name}"? Toàn bộ skill, agent và workflow bên trong sẽ mất.`))
      return;
    await api.deletePack(pack.id);
    load();
  };

  const duplicate = async (pack: PackSummary) => {
    await api.duplicatePack(pack.id);
    load();
  };

  const selectedTemplate = templates.find((t) => t.id === templateId);

  return (
    <>
      <PageHeader
        title="Bộ skill"
        subtitle="Mỗi bộ skill là một pack độc lập — tạo từ template chuẩn rồi sửa riêng, không ảnh hưởng lẫn nhau."
      />

      <div className="grid gap-6 p-8 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-4">
          {error ? (
            <Card className="border-rose-500/30 bg-rose-500/5 text-sm text-rose-200">{error}</Card>
          ) : null}

          {loading ? (
            <EmptyState title="Đang tải..." />
          ) : packs.length === 0 ? (
            <EmptyState
              title="Chưa có bộ skill nào"
              hint="Dùng form bên phải để tạo bộ skill đầu tiên từ template chuẩn."
            />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {packs.map((pack) => (
                <Card key={pack.id} className="flex flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <Link href={`/packs/${pack.id}/skills`} className="min-w-0">
                      <h3 className="truncate font-medium text-white hover:text-indigo-300">
                        {pack.name}
                      </h3>
                      <code className="text-xs text-slate-500">{pack.slug}</code>
                    </Link>
                    <Badge tone={pack.status === "published" ? "green" : "slate"}>
                      {pack.status}
                    </Badge>
                  </div>

                  <p className="mt-3 line-clamp-2 flex-1 text-sm text-slate-400">
                    {pack.description || "Chưa có mô tả."}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    <Badge tone="indigo">{pack.skill_count} skill</Badge>
                    <Badge>{pack.agent_count} agent</Badge>
                    <Badge>{pack.workflow_count} workflow</Badge>
                  </div>
                  <p className="mt-2 text-xs text-slate-600">
                    Tạo từ template: {pack.source_template}
                  </p>

                  <div className="mt-4 flex gap-2 border-t border-white/5 pt-3">
                    <Link href={`/packs/${pack.id}/skills`} className="flex-1">
                      <Button className="w-full">Mở</Button>
                    </Link>
                    <Button onClick={() => duplicate(pack)}>Nhân bản</Button>
                    <Button variant="danger" onClick={() => remove(pack)}>
                      Xoá
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <Card className="h-fit">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
            Tạo bộ skill mới
          </h2>
          <form onSubmit={create} className="space-y-4">
            <Field label="Tên bộ skill">
              <Input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="vd: Pack cho dự án Payment"
              />
            </Field>

            <Field label="Mô tả">
              <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
            </Field>

            <Field label="Tạo từ template" hint="Skill sẽ được sao chép thành bản riêng của pack này.">
              <Select value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} ({template.skill_count} skill)
                  </option>
                ))}
              </Select>
            </Field>

            {selectedTemplate && selectedTemplate.skills.length ? (
              <div className="max-h-48 overflow-auto rounded-lg border border-white/10 bg-black/20 p-3">
                <p className="mb-2 text-xs text-slate-500">Sẽ sao chép:</p>
                <ul className="space-y-1">
                  {selectedTemplate.skills.map((skill) => (
                    <li key={skill.slug} className="truncate text-xs text-slate-400">
                      <span className="text-slate-600">{skill.code || "—"}</span> {skill.name}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <Button variant="primary" className="w-full" disabled={creating || !name}>
              {creating ? "Đang tạo..." : "Tạo bộ skill"}
            </Button>
          </form>
        </Card>
      </div>
    </>
  );
}
