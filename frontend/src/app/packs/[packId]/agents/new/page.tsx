"use client";

import { use } from "react";
import { AgentForm } from "@/components/AgentForm";

export default function NewAgentPage({ params }: { params: Promise<{ packId: string }> }) {
  const { packId } = use(params);
  return <AgentForm packId={packId} />;
}
