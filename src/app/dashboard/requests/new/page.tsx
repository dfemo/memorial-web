import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createPlatformJwt, platformFetch } from "@/lib/platform";

export const metadata = { title: "New service request" };

async function createRequest(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const token = await createPlatformJwt({
    sub: session.user.id,
    email: session.user.email || "",
    role: session.user.role,
    name: session.user.name,
  });

  const payload = {
    externalUserId: session.user.id,
    clientEmail: session.user.email,
    clientName: session.user.name,
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

  await platformFetch("/api/requests", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });

  redirect("/dashboard/requests");
}

export default async function NewRequestPage({
  searchParams,
}: {
  searchParams: Promise<{ memorialId?: string; vendorId?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  const sp = await searchParams;

  const memorials = await prisma.memorial.findMany({
    where: { ownerId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });

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
                  {m.firstName} {m.lastName}
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
              <input name="budget" placeholder="$500–$1,000" />
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
