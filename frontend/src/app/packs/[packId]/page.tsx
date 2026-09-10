import { redirect } from "next/navigation";

export default async function PackIndexPage({
  params,
}: {
  params: Promise<{ packId: string }>;
}) {
  const { packId } = await params;
  redirect(`/packs/${packId}/skills`);
}
