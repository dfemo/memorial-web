import Link from "next/link";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { apiV1, type ApiUser, type Memorial } from "@/lib/api-v1";
import { platformFetch } from "@/lib/platform";
import { requireAccessToken } from "@/lib/require-session";

export const metadata = { title: "New service request" };
export const dynamic = "force-dynamic";

async function createRequest(formData: FormData) {
  "use server";
  try {
    const token = await requireAccessToken("/dashboard/requests/new");
    const me = await apiV1<ApiUser>("/api/v1/auth/me", { token });
    const payload = {
      externalUserId: me.id,
      clientEmail: me.email,
      clientName: `${me.firstName} ${me.lastName}`.trim(),
      memorialExternalId: String(formData.get("memorialId") || "") || null,
      vendorId: formData.get("vendorId") ? Number(formData.get("vendorId")) : null,
      title: String(formData.get("title") || ""),
      category: String(formData.get("category") || "FUNERAL_HOME"),
      notes: String(formData.get("notes") || ""),
      obtainable: String(formData.get("obtainable") || ""),
      budget: String(formData.get("budget") || ""),
      preferredDate: String(formData.get("preferredDate") || "") || null,
      location: String(formData.get("location") || ""),
    };

    const res = await platformFetch("/api/requests", {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      redirect(
        `/dashboard/requests/new?error=${encodeURIComponent("Could not create request")}`,
      );
    }
    redirect("/dashboard/requests");
  } catch (err) {
    if (isRedirectError(err)) throw err;
    redirect(`/dashboard/requests/new?error=${encodeURIComponent("Could not create request")}`);
  }
}

export default async function NewRequestPage({
  searchParams,
}: {
  searchParams: Promise<{ memorialId?: string; vendorId?: string; error?: string }>;
}) {
  await requireAccessToken("/dashboard/requests/new");
  const sp = await searchParams;

  let memorials: Memorial[] = [];
  try {
    memorials = await apiV1<Memorial[]>("/api/v1/memorials/mine");
  } catch {
    memorials = [];
  }

  return (
    <div className="dash-shell">
      <p>
        <Link href="/dashboard/requests">← Requests</Link>
      </p>
      <h1 style={{ fontFamily: "var(--font-display)" }}>Request vendor services</h1>
      <p style={{ color: "var(--muted)" }}>
        Share request notes and what is obtainable — budget, dates, location, and package
        preferences — so vendors can respond clearly.
      </p>
      {sp.error && (
        <p role="alert" className="soft-card" style={{ color: "#7a2e2e" }}>
          {sp.error}
        </p>
      )}
      <div className="panel">
        <form className="form-stack" action={createRequest}>
          <input type="hidden" name="vendorId" value={sp.vendorId || ""} />
          <label>
            Title
            <input
              name="title"
              required
              placeholder="e.g. Funeral flowers for Saturday service"
            />
          </label>
          <label>
            Related memorial
            <select name="memorialId" defaultValue={sp.memorialId || ""}>
              <option value="">None / standalone</option>
              {memorials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.displayName}
                </option>
              ))}
            </select>
          </label>
          <label>
            Category
            <select name="category" defaultValue="FLORIST">
              <option value="FUNERAL_HOME">Funeral home</option>
              <option value="FLORIST">Florist</option>
              <option value="CEMETERY">Cemetery</option>
              <option value="CELEBRANT">Celebrant</option>
              <option value="CATERING">Catering</option>
              <option value="TRANSPORT">Transport</option>
              <option value="OTHER">Other</option>
            </select>
          </label>
          <label>
            Request notes
            <textarea
              name="notes"
              required
              placeholder="Describe what you need help with..."
            />
          </label>
          <label>
            What is obtainable
            <textarea
              name="obtainable"
              required
              placeholder="Budget range, preferred packages, must-haves, constraints..."
            />
          </label>
          <div style={{ display: "grid", gap: "0.9rem", gridTemplateColumns: "1fr 1fr" }}>
            <label>
              Budget
              <input name="budget" placeholder="e.g. 500–1000 NGN / USD / GBP" />
            </label>
            <label>
              Preferred date
              <input name="preferredDate" type="date" />
            </label>
          </div>
          <label>
            Location
            <input name="location" />
          </label>
          <button className="btn btn-solid" type="submit">
            Submit request
          </button>
        </form>
      </div>
    </div>
  );
}
