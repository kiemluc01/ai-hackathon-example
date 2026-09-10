"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  addEdge,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
} from "@xyflow/react";
import { api } from "@/lib/api";
import { KIND_STYLE, StepNode } from "@/components/StepNode";
import { Badge, Button, Card, Field, Input, Select, Textarea } from "@/components/ui";
import type { Agent, CompileResult, NodeKind, Platform, Skill, Workflow } from "@/lib/types";

type StepData = {
  label: string;
  kind: NodeKind;
  skillId?: string;
  agentId?: string;
  instruction?: string;
  condition?: string;
  [key: string]: unknown;
};

const KINDS: NodeKind[] = ["trigger", "skill", "agent", "condition", "tool", "output"];
const nodeTypes = { step: StepNode };

let idCounter = 0;
const nextId = (kind: string) => `${kind}-${Date.now().toString(36)}-${idCounter++}`;

function Canvas({ packId, workflow }: { packId: string; workflow: Workflow }) {
  const router = useRouter();
  const wrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition, getViewport } = useReactFlow();

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<StepData>>(
    (workflow.nodes as unknown as Node<StepData>[]) ?? [],
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>((workflow.edges as Edge[]) ?? []);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [name, setName] = useState(workflow.name);
  const [description, setDescription] = useState(workflow.description);
  const [agentId, setAgentId] = useState(workflow.agent_id ?? "");
  const [targets, setTargets] = useState<string[]>(workflow.platforms ?? ["claude"]);

  const [skills, setSkills] = useState<Skill[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [compiled, setCompiled] = useState<CompileResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    api.listSkills(packId).then(setSkills);
    api.listAgents(packId).then(setAgents);
    api.platforms().then(setPlatforms);
  }, [packId]);

  const selected = useMemo(
    () => nodes.find((node) => node.id === selectedId) ?? null,
    [nodes, selectedId],
  );

  const onConnect = useCallback(
    (connection: Connection) =>
      setEdges((current) =>
        addEdge({ ...connection, id: `e-${connection.source}-${connection.target}` }, current),
      ),
    [setEdges],
  );

  const addNode = useCallback(
    (kind: NodeKind, position: { x: number; y: number }) => {
      const id = nextId(kind);
      setNodes((current) => [
        ...current,
        {
          id,
          type: "step",
          position,
          data: { label: KIND_STYLE[kind].label, kind } as StepData,
        },
      ]);
      setSelectedId(id);
    },
    [setNodes],
  );

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const kind = event.dataTransfer.getData("application/skill-studio-node") as NodeKind;
      if (!kind) return;
      addNode(kind, screenToFlowPosition({ x: event.clientX, y: event.clientY }));
    },
    [addNode, screenToFlowPosition],
  );

  const patchSelected = (patch: Partial<StepData>) => {
    if (!selectedId) return;
    setNodes((current) =>
      current.map((node) =>
        node.id === selectedId ? { ...node, data: { ...node.data, ...patch } } : node,
      ),
    );
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    setNodes((current) => current.filter((node) => node.id !== selectedId));
    setEdges((current) =>
      current.filter((edge) => edge.source !== selectedId && edge.target !== selectedId),
    );
    setSelectedId(null);
  };

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await api.updateWorkflow(workflow.id, {
        name,
        description,
        agent_id: agentId || null,
        platforms: targets,
        nodes,
        edges,
        viewport: getViewport(),
      });
      setCompiled(await api.compileWorkflow(workflow.id));
      setMessage("Đã lưu workflow.");
      router.refresh();
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const validate = async () => {
    setMessage(null);
    try {
      setCompiled(
        await api.validateDraft({
          pack_id: packId,
          name,
          description,
          nodes,
          edges,
          platforms: targets,
        }),
      );
    } catch (e) {
      setMessage((e as Error).message);
    }
  };

  const skillName = (id?: string) => skills.find((s) => s.id === id)?.name ?? "";

  return (
    <div className="flex h-[calc(100vh-140px)] min-h-[520px] flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-white/10 bg-panel/40 px-6 py-3">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="max-w-xs font-medium"
        />
        <Select
          value={agentId}
          onChange={(e) => setAgentId(e.target.value)}
          className="max-w-[220px]"
        >
          <option value="">— Không gắn agent —</option>
          {agents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.name}
            </option>
          ))}
        </Select>

        <div className="flex flex-wrap gap-1">
          {platforms.map((platform) => (
            <button
              key={platform.id}
              type="button"
              onClick={() =>
                setTargets((prev) =>
                  prev.includes(platform.id)
                    ? prev.filter((p) => p !== platform.id)
                    : [...prev, platform.id],
                )
              }
              className={`rounded-md px-2.5 py-1 text-xs transition ${
                targets.includes(platform.id)
                  ? "bg-indigo-500/20 text-indigo-200 ring-1 ring-indigo-400/40"
                  : "bg-white/5 text-slate-500 hover:text-slate-300"
              }`}
            >
              {platform.label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {message ? <span className="text-xs text-slate-400">{message}</span> : null}
          <Button onClick={validate}>Kiểm tra</Button>
          <Button variant="primary" onClick={save} disabled={saving}>
            {saving ? "Đang lưu..." : "Lưu"}
          </Button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Palette */}
        <div className="w-52 shrink-0 space-y-4 overflow-auto border-r border-white/10 bg-panel/30 p-4">
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Kéo vào canvas
            </h3>
            <div className="space-y-2">
              {KINDS.map((kind) => (
                <div
                  key={kind}
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData("application/skill-studio-node", kind);
                    event.dataTransfer.effectAllowed = "move";
                  }}
                  onDoubleClick={() => addNode(kind, { x: 200, y: 120 })}
                  className={`cursor-grab rounded-lg border bg-black/30 px-3 py-2 text-sm text-slate-200 transition hover:bg-white/5 active:cursor-grabbing ${KIND_STYLE[kind].ring}`}
                >
                  <span className="mr-2 text-xs">{KIND_STYLE[kind].icon}</span>
                  {KIND_STYLE[kind].label}
                </div>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-slate-600">
              Kéo thả hoặc double-click để thêm nhanh.
            </p>
          </div>

          <div className="rounded-lg border border-white/10 bg-black/20 p-3 text-[11px] text-slate-500">
            Nối các node bằng cách kéo từ chấm bên phải sang chấm bên trái của node kế tiếp.
          </div>
        </div>

        {/* Canvas */}
        <div ref={wrapper} className="min-w-0 flex-1" onDrop={onDrop} onDragOver={(e) => e.preventDefault()}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            onNodeClick={(_, node) => setSelectedId(node.id)}
            onPaneClick={() => setSelectedId(null)}
            defaultViewport={{ x: 0, y: 0, zoom: 0.85, ...(workflow.viewport ?? {}) }}
            fitView
            proOptions={{ hideAttribution: true }}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#1e293b" />
            <Controls className="!bg-panel !border-white/10" />
            <MiniMap
              pannable
              zoomable
              className="!bg-panel !border !border-white/10"
              nodeColor="#4f46e5"
              maskColor="rgba(11,16,32,0.7)"
            />
          </ReactFlow>
        </div>

        {/* Inspector */}
        <div className="w-80 shrink-0 space-y-4 overflow-auto border-l border-white/10 bg-panel/30 p-4">
          {selected ? (
            <Card className="space-y-3 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Thuộc tính node</h3>
                <Button variant="danger" className="px-2 py-1 text-xs" onClick={deleteSelected}>
                  Xoá
                </Button>
              </div>

              <Field label="Nhãn">
                <Input
                  value={(selected.data.label as string) ?? ""}
                  onChange={(e) => patchSelected({ label: e.target.value })}
                />
              </Field>

              <Field label="Loại">
                <Select
                  value={selected.data.kind}
                  onChange={(e) => patchSelected({ kind: e.target.value as NodeKind })}
                >
                  {KINDS.map((kind) => (
                    <option key={kind} value={kind}>
                      {KIND_STYLE[kind].label}
                    </option>
                  ))}
                </Select>
              </Field>

              {selected.data.kind === "skill" ? (
                <Field label="Skill được gọi">
                  <Select
                    value={(selected.data.skillId as string) ?? ""}
                    onChange={(e) => {
                      const id = e.target.value;
                      patchSelected({
                        skillId: id,
                        label: skillName(id) || (selected.data.label as string),
                      });
                    }}
                  >
                    <option value="">— Chọn skill —</option>
                    {skills.map((skill) => (
                      <option key={skill.id} value={skill.id}>
                        {skill.code ? `${skill.code} · ` : ""}
                        {skill.name}
                      </option>
                    ))}
                  </Select>
                </Field>
              ) : null}

              {selected.data.kind === "agent" ? (
                <Field label="Agent được uỷ quyền">
                  <Select
                    value={(selected.data.agentId as string) ?? ""}
                    onChange={(e) => patchSelected({ agentId: e.target.value })}
                  >
                    <option value="">— Chọn agent —</option>
                    {agents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name}
                      </option>
                    ))}
                  </Select>
                </Field>
              ) : null}

              {selected.data.kind === "condition" ? (
                <Field label="Điều kiện">
                  <Input
                    value={(selected.data.condition as string) ?? ""}
                    onChange={(e) => patchSelected({ condition: e.target.value })}
                    placeholder="vd: có test fail"
                  />
                </Field>
              ) : null}

              <Field label="Hướng dẫn cho bước này">
                <Textarea
                  rows={5}
                  value={(selected.data.instruction as string) ?? ""}
                  onChange={(e) => patchSelected({ instruction: e.target.value })}
                />
              </Field>
            </Card>
          ) : (
            <Card className="p-4">
              <h3 className="mb-2 text-sm font-semibold text-white">Thông tin workflow</h3>
              <Field label="Mô tả">
                <Textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </Field>
              <p className="mt-3 text-xs text-slate-500">
                Chọn một node trên canvas để chỉnh thuộc tính của nó.
              </p>
            </Card>
          )}

          {compiled ? (
            <Card className="p-4">
              <div className="mb-2 flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white">Kết quả kiểm tra</h3>
                <Badge tone={compiled.valid ? "green" : "rose"}>
                  {compiled.valid ? "hợp lệ" : "có lỗi"}
                </Badge>
              </div>

              {compiled.errors.map((err) => (
                <p key={err} className="text-xs text-rose-300">
                  ✕ {err}
                </p>
              ))}
              {compiled.warnings.map((warn) => (
                <p key={warn} className="text-xs text-amber-300/80">
                  ⚠ {warn}
                </p>
              ))}

              <ol className="mt-3 space-y-1.5">
                {compiled.steps.map((step) => (
                  <li key={step.id} className="text-xs text-slate-300">
                    <span className="mr-1.5 text-slate-500">{step.order}.</span>
                    <span className="text-slate-500">[{step.kind_label}]</span> {step.label}
                  </li>
                ))}
              </ol>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function WorkflowCanvas({
  packId,
  workflow,
}: {
  packId: string;
  workflow: Workflow;
}) {
  return (
    <ReactFlowProvider>
      <Canvas packId={packId} workflow={workflow} />
    </ReactFlowProvider>
  );
}
