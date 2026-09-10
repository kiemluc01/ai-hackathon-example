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
import type { Agent, Platform, Skill } from "@/lib/types";

const MODELS = ["inherit", "claude-opus-5", "claude-sonnet-5", "claude-haiku-4-5-20251001", "gpt-5"];

export function AgentForm({ packId, agent }: { packId: string; agent?: Agent }) {
  const router = useRouter();
  const [name, setName] = useState(agent?.name ?? "");
  const [description, setDescription] = useState(agent?.description ?? "");
  const [systemPrompt, setSystemPrompt] = useState(agent?.system_prompt ?? "");
  const [model, setModel] = useState(agent?.model ?? "inherit");
  const [tools, setTools] = useState((agent?.tools ?? []).join(", "));
  const [status, setStatus] = useState(agent?.status ?? "draft");
  const [selected, setSelected] = useState<string[]>((agent?.skills ?? []).map((s) => s.id));
  const [targets, setTargets] = useState<string[]>(agent?.platforms ?? ["claude"]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.listSkills(packId).then(setSkills);
    api.platforms().then(setPlatforms);
  }, [packId]);

  const toggle = (list: string[], id: string) =>
    list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const payload = {
      pack_id: packId,
      name,
      description,
      system_prompt: systemPrompt,
      model,
      status,
      tools: tools.split(",").map((t) => t.trim()).filter(Boolean),
      platforms: targets,
      skill_ids: selected,
    };
    try {
      const saved = agent ? await api.updateAgent(agent.id, payload) : await api.createAgent(payload);
      router.push(`/packs/${packId}/agents/${saved.id}`);
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
        title={agent ? `Sửa agent: ${agent.name}` : "Tạo agent mới"}
        subtitle="Agent = system prompt + bộ skill + công cụ được phép dùng."
        actions={
          <>
            <Button type="button" onClick={() => router.push(`/packs/${packId}/agents`)}>
              Huỷ
            </Button>
            <Button variant="primary" form="agent-form" disabled={saving || !name}>
              {saving ? "Đang lưu..." : "Lưu agent"}
            </Button>
          </>
        }
      />

      <form
        id="agent-form"
        onSubmit={submit}
        className="flex flex-col gap-6 px-8 pb-8 pt-4 xl:flex-row xl:items-start"
      >
        <div className="min-w-0 flex-1 space-y-6">
          {error ? (
            <Card className="border-rose-500/30 bg-rose-500/5 text-sm text-rose-200">{error}</Card>
          ) : null}

          <Card className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tên agent">
                <Input required value={name} onChange={(e) => setName(e.target.value)} />
              </Field>
              <Field label="Model">
                <Select value={model} onChange={(e) => setModel(e.target.value)}>
                  {MODELS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <Field label="Mô tả" hint="Dùng để nền tảng quyết định khi nào uỷ quyền cho agent này.">
              <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Công cụ" hint="Ngăn cách bằng dấu phẩy.">
                <Input value={tools} onChange={(e) => setTools(e.target.value)} placeholder="Read, Edit, Bash" />
              </Field>
              <Field label="Trạng thái">
                <Select value={status} onChange={(e) => setStatus(e.target.value)}>
                  {["draft", "published", "archived"].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          </Card>

          <Card>
            <Field label="System prompt">
              <Textarea rows={12} value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} />
            </Field>
          </Card>

          <Card>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
              Bộ skill của agent ({selected.length})
            </h3>
            <div className="grid max-h-80 gap-2 overflow-auto sm:grid-cols-2">
              {skills.map((skill) => (
                <CheckboxPill
                  key={skill.id}
                  checked={selected.includes(skill.id)}
                  onChange={() => setSelected((prev) => toggle(prev, skill.id))}
                  label={skill.name}
                  sublabel={skill.code || skill.stage}
                />
              ))}
            </div>
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
                  checked={targets.includes(platform.id)}
                  onChange={() => setTargets((prev) => toggle(prev, platform.id))}
                  label={platform.label}
                  sublabel={platform.agent_path.replace("{slug}", name || "slug")}
                />
              ))}
            </div>
          </Card>

          {agent ? <ExportPanel kind="agents" id={agent.id} platforms={targets} /> : null}
        </div>
      </form>
    </>
  );
}
