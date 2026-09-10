export type Pack = {
  id: string;
  slug: string;
  name: string;
  description: string;
  status: string;
  source_template: string;
  platforms: string[];
  created_at: string;
  updated_at: string;
};

export type PackSummary = Pack & {
  skill_count: number;
  agent_count: number;
  workflow_count: number;
};

export type Template = {
  id: string;
  name: string;
  description: string;
  source: string;
  skill_count: number;
  skills: { slug: string; name: string; code: string; stage: string }[];
};

export type Skill = {
  id: string;
  pack_id: string;
  slug: string;
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
  tags: string[];
  platforms: string[];
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type Agent = {
  id: string;
  pack_id: string;
  slug: string;
  name: string;
  description: string;
  model: string;
  system_prompt: string;
  color: string;
  status: string;
  tools: string[];
  platforms: string[];
  config: Record<string, unknown>;
  skills: Skill[];
  created_at: string;
  updated_at: string;
};

export type NodeKind = "trigger" | "skill" | "agent" | "condition" | "tool" | "output";

export type StepNodeData = {
  label: string;
  kind: NodeKind;
  skillId?: string;
  agentId?: string;
  instruction?: string;
  condition?: string;
};

export type FlowNode = {
  id: string;
  type?: string;
  position: { x: number; y: number };
  data: StepNodeData;
};

export type FlowEdge = {
  id: string;
  source: string;
  target: string;
  label?: string;
};

export type Workflow = {
  id: string;
  pack_id: string;
  slug: string;
  name: string;
  description: string;
  status: string;
  agent_id: string | null;
  nodes: FlowNode[];
  edges: FlowEdge[];
  viewport: Record<string, number>;
  platforms: string[];
  created_at: string;
  updated_at: string;
};

export type CompileStep = {
  order: number;
  id: string;
  label: string;
  kind: string;
  kind_label: string;
  reference: string | null;
  detail: string;
  condition: string;
  next: string[];
};

export type CompileResult = {
  valid: boolean;
  steps: CompileStep[];
  warnings: string[];
  errors: string[];
  markdown: string;
};

export type Platform = {
  id: string;
  label: string;
  vendor: string;
  description: string;
  skill_path: string;
  agent_path: string;
  workflow_path: string;
  supports: string[];
  accent: string;
};

export type ExportFile = {
  path: string;
  content: string;
  platform: string;
  language: string;
  notes: string[];
};

export type ExportPreview = {
  platforms: string[];
  files: ExportFile[];
};

export type Meta = {
  stages: string[];
  priorities: string[];
  statuses: string[];
  node_kinds: { id: NodeKind; label: string; hint: string }[];
};

export type Stats = {
  packs: number;
  skills: number;
  agents: number;
  workflows: number;
  published_skills: number;
  skills_by_stage: Record<string, number>;
};
