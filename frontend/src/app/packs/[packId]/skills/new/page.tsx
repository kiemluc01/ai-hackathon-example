"use client";

import { use } from "react";
import { SkillForm } from "@/components/SkillForm";

export default function NewSkillPage({ params }: { params: Promise<{ packId: string }> }) {
  const { packId } = use(params);
  return <SkillForm packId={packId} />;
}
