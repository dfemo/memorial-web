import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { createPlatformJwt, platformFetch } from "@/lib/platform";

export const metadata = { title: "Vendor registration" };

async function registerVendor(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const token = await createPlatformJwt({
    sub: session.user.id,
    email: session.user.email || "",
    role: "VENDOR",
    name: session.user.name,
  });

  const payload = {
    externalUserId: session.user.id,
    email: session.user.email,
    contactName: session.user.name,
    businessName: String(formData.get("businessName") || ""),
    category: String(formData.get("category") || "FUNERAL_HOME"),
    description: String(formData.get("description") || ""),
    serviceArea: String(formData.get("serviceArea") || ""),
    pricingNotes: String(formData.get("pricingNotes") || ""),
    phone: String(formData.get("phone") || ""),
  };

  await platformFetch("/api/vendors/register", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });

  redirect("/dashboard/vendor?registered=1");
}

export default async function VendorRegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");
  const sp = await searchParams;

  return (
    <div className="dash-shell">
      <h1 style={{ fontFamily: "var(--font-display)" }}>Vendor registration</h1>
      <p style={{ color: "var(--muted)" }}>
        Push your business details for families to discover and request. Admins approve
        listings before they appear publicly.
      </p>
      {sp.registered && (
        <p className="panel" style={{ color: "var(--accent)" }}>
          Registration submitted — pending admin approval.
        </p>
      )}
      <div className="panel">
        <form className="form-stack" action={registerVendor}>
          <label>
            Business name
            <input name="businessName" required />
          </label>
          <label>
            Category
            <select name="category" defaultValue="FUNERAL_HOME">
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
            Description
            <textarea name="description" />
          </label>
          <label>
            Service area
            <input name="serviceArea" placeholder="City, region, or nationwide" />
          </label>
          <label>
            Pricing notes
            <textarea name="pricingNotes" placeholder="Packages, starting prices..." />
          </label>
          <label>
            Phone
            <input name="phone" />
          </label>
          <button className="btn btn-solid" type="submit">
            Submit for approval
          </button>
        </form>
      </div>
    </div>
  );
}
