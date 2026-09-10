import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { apiV1 } from "@/lib/api-v1";

export const dynamic = "force-dynamic";

export default async function InviteLandingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  try {
    const invite = await apiV1<{
      token: string;
      slug: string;
      displayName: string;
    }>(`/api/v1/invites/${encodeURIComponent(token)}`, { auth: false });
    redirect(`/memorial/${invite.slug}?invite=${encodeURIComponent(invite.token)}`);
  } catch (err) {
    if (isRedirectError(err)) throw err;
    redirect(`/browse?error=${encodeURIComponent("This invite link is invalid or expired.")}`);
  }
}
