"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Badge, Button, Card } from "@/components/ui";
import type { ExportFile } from "@/lib/types";

type Kind = "skills" | "agents" | "workflows";

export function ExportPanel({
  kind,
  id,
  platforms,
}: {
  kind: Kind;
  id: string;
  platforms: string[];
}) {
  const [files, setFiles] = useState<ExportFile[]>([]);
  const [active, setActive] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!platforms.length) {
      setFiles([]);
      return;
    }
    const fetcher =
      kind === "skills"
        ? api.previewSkill
        : kind === "agents"
          ? api.previewAgent
          : api.previewWorkflow;

    fetcher(id, platforms)
      .then((preview) => {
        setFiles(preview.files);
        setActive(0);
        setError(null);
      })
      .catch((e: Error) => setError(e.message));
  }, [kind, id, platforms.join(",")]);

  const current = files[active];

  const copy = async () => {
    if (!current) return;
    await navigator.clipboard.writeText(current.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Xem trước file xuất
        </h3>
        {current ? (
          <Button className="px-3 py-1 text-xs" onClick={copy} type="button">
            {copied ? "Đã copy" : "Copy"}
          </Button>
        ) : null}
      </div>

      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      {!files.length && !error ? (
        <p className="text-sm text-slate-500">Chọn ít nhất một nền tảng để xem trước.</p>
      ) : null}

      {files.length ? (
        <>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {files.map((file, index) => (
              <button
                key={file.path}
                type="button"
                onClick={() => setActive(index)}
                className={`rounded-md px-2.5 py-1 text-xs transition ${
                  index === active
                    ? "bg-indigo-500/20 text-indigo-200 ring-1 ring-indigo-400/40"
                    : "bg-white/5 text-slate-400 hover:text-slate-200"
                }`}
              >
                {file.platform}
              </button>
            ))}
          </div>

          {current ? (
            <>
              <code className="mb-2 block break-all text-xs text-indigo-300">{current.path}</code>
              {current.notes.map((note) => (
                <p key={note} className="mb-2 text-xs text-slate-500">
                  {note}
                </p>
              ))}
              <pre className="max-h-80 max-w-full overflow-auto whitespace-pre rounded-lg border border-white/10 bg-black/40 p-3 text-xs leading-relaxed text-slate-300">
                {current.content}
              </pre>
            </>
          ) : null}
        </>
      ) : null}
    </Card>
  );
}

export function PlatformBadges({ platforms }: { platforms: string[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {platforms.map((p) => (
        <Badge key={p} tone="indigo">
          {p}
        </Badge>
      ))}
    </div>
  );
}
