import type {
  Agent,
  CompileResult,
  ExportPreview,
  Meta,
  Pack,
  PackSummary,
  Platform,
  Skill,
  Stats,
  Template,
  Workflow,
} from "./types";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    cache: "no-store",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Request failed: ${response.status}`);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

const qs = (params: Record<string, string | string[] | undefined>) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) value.forEach((v) => search.append(key, v));
    else if (value) search.set(key, value);
  });
  const text = search.toString();
  return text ? `?${text}` : "";
};

export const api = {
  platforms: () => request<Platform[]>("/platforms"),
  meta: () => request<Meta>("/meta"),
  stats: (packId?: string) => request<Stats>(`/stats${qs({ pack_id: packId })}`),

  listPacks: () => request<PackSummary[]>("/packs"),
  getPack: (id: string) => request<PackSummary>(`/packs/${id}`),
  createPack: (body: Record<string, unknown>) =>
    request<Pack>("/packs", { method: "POST", body: JSON.stringify(body) }),
  updatePack: (id: string, body: Record<string, unknown>) =>
    request<Pack>(`/packs/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deletePack: (id: string) => request<void>(`/packs/${id}`, { method: "DELETE" }),
  duplicatePack: (id: string) => request<Pack>(`/packs/${id}/duplicate`, { method: "POST" }),
  listTemplates: () => request<Template[]>("/packs/templates"),

  listSkills: (packId: string, params: Record<string, string | undefined> = {}) =>
    request<Skill[]>(`/skills${qs({ pack_id: packId, ...params })}`),
  getSkill: (id: string) => request<Skill>(`/skills/${id}`),
  createSkill: (body: Partial<Skill>) =>
    request<Skill>("/skills", { method: "POST", body: JSON.stringify(body) }),
  updateSkill: (id: string, body: Partial<Skill>) =>
    request<Skill>(`/skills/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteSkill: (id: string) => request<void>(`/skills/${id}`, { method: "DELETE" }),
  duplicateSkill: (id: string) =>
    request<Skill>(`/skills/${id}/duplicate`, { method: "POST" }),

  listAgents: (packId: string) => request<Agent[]>(`/agents${qs({ pack_id: packId })}`),
  getAgent: (id: string) => request<Agent>(`/agents/${id}`),
  createAgent: (body: Record<string, unknown>) =>
    request<Agent>("/agents", { method: "POST", body: JSON.stringify(body) }),
  updateAgent: (id: string, body: Record<string, unknown>) =>
    request<Agent>(`/agents/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteAgent: (id: string) => request<void>(`/agents/${id}`, { method: "DELETE" }),

  listWorkflows: (packId: string) =>
    request<Workflow[]>(`/workflows${qs({ pack_id: packId })}`),
  getWorkflow: (id: string) => request<Workflow>(`/workflows/${id}`),
  createWorkflow: (body: Record<string, unknown>) =>
    request<Workflow>("/workflows", { method: "POST", body: JSON.stringify(body) }),
  updateWorkflow: (id: string, body: Record<string, unknown>) =>
    request<Workflow>(`/workflows/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteWorkflow: (id: string) => request<void>(`/workflows/${id}`, { method: "DELETE" }),
  compileWorkflow: (id: string) =>
    request<CompileResult>(`/workflows/${id}/compile`, { method: "POST" }),
  validateDraft: (body: Record<string, unknown>) =>
    request<CompileResult>("/workflows/validate", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  previewSkill: (id: string, platforms: string[]) =>
    request<ExportPreview>(`/exports/skills/${id}${qs({ platforms })}`),
  previewAgent: (id: string, platforms: string[]) =>
    request<ExportPreview>(`/exports/agents/${id}${qs({ platforms })}`),
  previewWorkflow: (id: string, platforms: string[]) =>
    request<ExportPreview>(`/exports/workflows/${id}${qs({ platforms })}`),

  downloadBundle: async (body: Record<string, unknown>) => {
    const response = await fetch(`${API_URL}/exports/bundle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(await response.text());
    return response.blob();
  },
};
