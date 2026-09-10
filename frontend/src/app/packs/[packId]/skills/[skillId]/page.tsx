"use client";

import { use, useEffect, useState } from "react";
import { SkillForm } from "@/components/SkillForm";
import { EmptyState } from "@/components/ui";
import { api } from "@/lib/api";
import type { Skill } from "@/lib/types";

export default function EditSkillPage({
  params,
}: {
  params: Promise<{ packId: string; skillId: string }>;
}) {
  const { packId, skillId } = use(params);
  const [skill, setSkill] = useState<Skill | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getSkill(skillId).then(setSkill).catch((e: Error) => setError(e.message));
  }, [skillId]);

  if (error)
    return (
      <div className="p-8">
        <EmptyState title="Không tải được skill" hint={error} />
      </div>
    );
  if (!skill)
    return (
      <div className="p-8">
        <EmptyState title="Đang tải..." />
      </div>
    );
  return <SkillForm packId={packId} skill={skill} />;
}
