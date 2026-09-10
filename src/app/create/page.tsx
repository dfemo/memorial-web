import Link from "next/link";
import { redirect } from "next/navigation";
import { createMemorialAction } from "@/app/ever-actions";
import { getAccessToken, getRefreshToken } from "@/lib/api-v1";

export const metadata = { title: "Create a memorial" };
export const dynamic = "force-dynamic";

export default async function CreateMemorialPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const token = await getAccessToken();
  const refresh = await getRefreshToken();
  if (!token && refresh) {
    redirect(`/api/session/refresh?next=${encodeURIComponent("/create")}`);
  }
  if (!token) redirect("/sign-in?next=/create");
  const sp = await searchParams;

  return (
    <div className="narrow-shell">
      <h1 style={{ fontFamily: "var(--font-display)" }}>Create a memorial</h1>
      <p style={{ color: "var(--muted)" }}>
        A guided flow to publish a peaceful place for remembrance. You can refine details anytime.
      </p>
      {sp.error && (
        <p role="alert" style={{ color: "#7a2e2e", marginBottom: "1rem" }}>
          {sp.error}
        </p>
      )}
      <div className="wizard-steps">
        <span className="on">1 Basics</span>
        <span className="on">2 Photos</span>
        <span className="on">3 Story</span>
        <span className="on">4 Privacy</span>
        <span className="on">5 Publish</span>
      </div>
      <div className="soft-card">
        <form className="form-stack" action={createMemorialAction}>
          <div style={{ display: "grid", gap: "0.9rem", gridTemplateColumns: "1fr 1fr 1fr" }}>
            <label>
              First name
              <input name="firstName" required />
            </label>
            <label>
              Middle
              <input name="middleName" />
            </label>
            <label>
              Last name
              <input name="lastName" required />
            </label>
          </div>
          <div style={{ display: "grid", gap: "0.9rem", gridTemplateColumns: "1fr 1fr" }}>
            <label>
              Date of birth
              <input name="dateOfBirth" type="date" />
            </label>
            <label>
              Date of passing
              <input name="dateOfDeath" type="date" />
            </label>
          </div>
          <label>
            Profile photo URL
            <input name="profilePhotoUrl" placeholder="https://..." />
          </label>
          <label>
            Cover photo URL
            <input name="coverPhotoUrl" placeholder="https://..." />
          </label>
          <label>
            Life story
            <textarea name="biography" placeholder="Share who they were..." />
          </label>
          <label>
            Service information
            <textarea name="serviceInfo" />
          </label>
          <label>
            Location
            <input name="location" />
          </label>
          <label>
            Privacy
            <select name="privacyLevel" defaultValue="PUBLIC">
              <option value="PUBLIC">Public</option>
              <option value="INVITE_ONLY">Invite only</option>
              <option value="PRIVATE">Private</option>
            </select>
          </label>
          <input type="hidden" name="publish" value="true" />
          <button className="btn btn-solid" type="submit">
            Publish memorial
          </button>
        </form>
      </div>
      <p style={{ marginTop: "1rem" }}>
        <Link href="/dashboard">Back to dashboard</Link>
      </p>
    </div>
  );
}
