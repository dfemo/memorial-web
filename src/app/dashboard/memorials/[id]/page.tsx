import { redirect } from "next/navigation";

/** Legacy NextAuth manage route — send users to the platform manage page. */
export default async function LegacyManageMemorialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/memorial/manage/${id}`);
}
