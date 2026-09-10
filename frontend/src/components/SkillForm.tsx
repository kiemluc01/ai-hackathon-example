"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  Button,
  Card,
  CheckboxPill,
  Field,
  Input,
  SectionBar,
  Select,
  Textarea,
} from "@/components/ui";
import { ExportPanel } from "@/components/ExportPanel";
import type { Meta, Platform, Skill } from "@/lib/types";

const TEMPLATE = `## Khi nào dùng
Mô tả tình huống kích hoạt skill này.

## Các bước
1. Bước đầu tiên.
2. Bước tiếp theo.

## Đầu ra
Định dạng kết quả mà skill phải trả về.
`;

type Draft = {
  name: string;
  code: string;
  description: string;
  content: string;
  stage: string;
  priority: string;
  owner: string;
  version: string;
  status: string;
  user_invocable: boolean;
  tags: string;
  platforms: string[];
  apply_to: string;
  allowed_tools: string;
};

const toDraft = (skill?: Skill): Draft => ({
  name: skill?.name ?? "",
  code: skill?.code ?? "",
  description: skill?.description ?? "",
  content: skill?.content ?? TEMPLATE,
  stage: skill?.stage ?? "development",
  priority: skill?.priority ?? "medium",
  owner: skill?.owner ?? "",
  version: skill?.version ?? "0.1.0",
  status: skill?.status ?? "draft",
  user_invocable: skill?.user_invocable ?? true,
  tags: (skill?.tags ?? []).join(", "),
  platforms: skill?.platforms ?? ["claude"],
  apply_to: (skill?.config?.apply_to as string) ?? "",
  allowed_tools: (skill?.config?.allowed_tools as string) ?? "",
});

export function SkillForm({ packId, skill }: { packId: string; skill?: Skill }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(toDraft(skill));
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.platforms().then(setPlatforms);
    api.meta().then(setMeta);
  }, []);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const togglePlatform = (id: string) =>
    setDraft((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(id)
        ? prev.platforms.filter((p) => p !== id)
        : [...prev.platforms, id],
    }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      pack_id: packId,
      name: draft.name,
      code: draft.code,
      description: draft.description,
      content: draft.content,
      stage: draft.stage,
      priority: draft.priority,
      owner: draft.owner,
      version: draft.version,
      status: draft.status,
      user_invocable: draft.user_invocable,
      tags: draft.tags.split(",").map((t) => t.trim()).filter(Boolean),
      platforms: draft.platforms,
      config: {
        ...(draft.apply_to ? { apply_to: draft.apply_to } : {}),
        ...(draft.allowed_tools ? { allowed_tools: draft.allowed_tools } : {}),
      },
    };

    try {
      const saved = skill
        ? await api.updateSkill(skill.id, payload)
        : await api.createSkill(payload);
      router.push(`/packs/${packId}/skills/${saved.id}`);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <SectionBar
        title={skill ? `Sửa: ${skill.name}` : "Tạo skill mới"}
        subtitle="Một định nghĩa, xuất được cho mọi nền tảng đã chọn."
        actions={
          <>
            <Button type="button" onClick={() => router.push(`/packs/${packId}/skills`)}>
              Huỷ
            </Button>
            <Button variant="primary" form="skill-form" disabled={saving || !draft.name}>
              {saving ? "Đang lưu..." : "Lưu skill"}
            </Button>
          </>
        }
      />

      <form
        id="skill-form"
        onSubmit={submit}
        className="flex flex-col gap-6 px-8 pb-8 pt-4 xl:flex-row xl:items-start"
      >
        <div className="min-w-0 flex-1 space-y-6">
          {error ? (
            <Card className="border-rose-500/30 bg-rose-500/5 text-sm text-rose-200">{error}</Card>
          ) : null}

          <Card className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tên skill" hint="Dùng làm slug và tên file khi export.">
                <Input
                  required
                  value={draft.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="vd: code-review"
                />
              </Field>
              <Field label="Mã skill">
                <Input
                  value={draft.code}
                  onChange={(e) => set("code", e.target.value)}
                  placeholder="SK-01"
                />
              </Field>
            </div>

            <Field label="Mô tả" hint="Câu này quyết định khi nào AI tự nạp skill — viết rõ cả khi nào KHÔNG dùng.">
              <Textarea
                rows={3}
                value={draft.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Review một diff về tính đúng, phạm vi và bảo mật. Không dùng để tự sửa code."
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-4">
              <Field label="Giai đoạn">
                <Select value={draft.stage} onChange={(e) => set("stage", e.target.value)}>
                  {(meta?.stages ?? [draft.stage]).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Độ ưu tiên">
                <Select value={draft.priority} onChange={(e) => set("priority", e.target.value)}>
                  {(meta?.priorities ?? [draft.priority]).map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Trạng thái">
                <Select value={draft.status} onChange={(e) => set("status", e.target.value)}>
                  {(meta?.statuses ?? [draft.status]).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Phiên bản">
                <Input value={draft.version} onChange={(e) => set("version", e.target.value)} />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Chủ sở hữu">
                <Input
                  value={draft.owner}
                  onChange={(e) => set("owner", e.target.value)}
                  placeholder="platform-eng"
                />
              </Field>
              <Field label="Tags" hint="Ngăn cách bằng dấu phẩy.">
                <Input value={draft.tags} onChange={(e) => set("tags", e.target.value)} />
              </Field>
            </div>
          </Card>

          <Card>
            <Field label="Nội dung skill (Markdown)" hint="Phần thân file SKILL.md / instructions.">
              <Textarea
                rows={18}
                value={draft.content}
                onChange={(e) => set("content", e.target.value)}
              />
            </Field>
          </Card>
        </div>

        <div className="w-full shrink-0 space-y-6 xl:sticky xl:top-4 xl:w-[400px]">
          <Card>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
              Nền tảng đích
            </h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {platforms.map((platform) => (
                <CheckboxPill
                  key={platform.id}
                  checked={draft.platforms.includes(platform.id)}
                  onChange={() => togglePlatform(platform.id)}
                  label={platform.label}
                  sublabel={platform.skill_path.replace("{slug}", draft.name || "slug")}
                />
              ))}
            </div>
          </Card>

          <Card className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
              Tuỳ chọn nền tảng
            </h3>
            <Field label="applyTo / globs" hint="Copilot và Cursor dùng để giới hạn phạm vi file.">
              <Input
                value={draft.apply_to}
                onChange={(e) => set("apply_to", e.target.value)}
                placeholder="src/**/*.ts"
              />
            </Field>
            <Field label="allowed-tools" hint="Claude Code: danh sách công cụ skill được phép gọi.">
              <Input
                value={draft.allowed_tools}
                onChange={(e) => set("allowed_tools", e.target.value)}
                placeholder="Read, Grep, Bash"
              />
            </Field>
            <CheckboxPill
              checked={draft.user_invocable}
              onChange={(v) => set("user_invocable", v)}
              label="Người dùng gọi trực tiếp được"
              sublabel="Hiện thành slash command"
            />
          </Card>

          {skill ? <ExportPanel kind="skills" id={skill.id} platforms={draft.platforms} /> : null}
        </div>
      </form>
    </>
  );
}
