"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { api } from "@/lib/api";
import type { PackSummary } from "@/lib/types";

const TABS = [
  { segment: "skills", label: "Skills" },
  { segment: "agents", label: "Agents" },
  { segment: "workflows", label: "Workflows" },
  { segment: "export", label: "Xuất bundle" },
];

export default function PackLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ packId: string }>;
}) {
  const { packId } = use(params);
  const pathname = usePathname();
  const [pack, setPack] = useState<PackSummary | null>(null);

  useEffect(() => {
    api.getPack(packId).then(setPack).catch(() => undefined);
  }, [packId, pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      <div className="border-b border-white/10 bg-panel/40 px-8 pt-5">
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/" className="text-xs text-slate-500 hover:text-slate-300">
            ← Bộ skill
          </Link>
          <h1 className="text-lg font-semibold text-white">{pack?.name ?? "..."}</h1>
          {pack ? (
            <span className="text-xs text-slate-500">
              {pack.skill_count} skill · {pack.agent_count} agent · {pack.workflow_count} workflow
            </span>
          ) : null}
        </div>

        <nav className="mt-4 flex gap-1">
          {TABS.map((tab) => {
            const href = `/packs/${packId}/${tab.segment}`;
            const active = pathname.startsWith(href);
            return (
              <Link
                key={tab.segment}
                href={href}
                className={`rounded-t-lg border-b-2 px-4 py-2 text-sm transition ${
                  active
                    ? "border-indigo-400 text-indigo-200"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}
