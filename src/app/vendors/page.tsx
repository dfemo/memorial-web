import Link from "next/link";
import { auth } from "@/auth";
import { createPlatformJwt, platformFetch } from "@/lib/platform";

type Vendor = {
  id: number;
  businessName: string;
  category: string;
  description?: string;
  serviceArea?: string;
  pricingNotes?: string;
  status: string;
};

export const metadata = { title: "Vendors" };

export default async function VendorsPage() {
  const session = await auth();
  let vendors: Vendor[] = [];
  let apiDown = false;

  try {
    const token = session?.user
      ? await createPlatformJwt({
          sub: session.user.id,
          email: session.user.email || "",
          role: session.user.role,
          name: session.user.name,
        })
      : undefined;
    const res = await platformFetch("/api/vendors/public", { token });
    if (res.ok) vendors = await res.json();
    else apiDown = true;
  } catch {
    apiDown = true;
  }

  return (
    <section className="section">
      <div className="wrap">
        <h2>Trusted funeral vendors</h2>
        <p className="lede">
          Browse approved providers — florists, funeral homes, celebrants, and more.
          Share request notes so they know exactly what you need.
        </p>
        {session?.user && (
          <p style={{ marginBottom: "1.5rem" }}>
            <Link href="/dashboard/vendor" className="btn btn-solid">
              Register as a vendor
            </Link>{" "}
            <Link href="/dashboard/requests/new" className="btn btn-outline">
              Request a service
            </Link>
          </p>
        )}
        {apiDown && (
          <div className="panel" style={{ marginBottom: "1rem" }}>
            <p style={{ margin: 0, color: "var(--muted)" }}>
              Vendor directory will appear when the platform API is running on port 8080.
            </p>
          </div>
        )}
        <div className="pricing-grid">
          {vendors.map((v) => (
            <div key={v.id} className="price-panel">
              <span className="badge">{v.category}</span>
              <h3 style={{ marginTop: "0.6rem" }}>{v.businessName}</h3>
              <p>{v.description || "Professional funeral services."}</p>
              {v.serviceArea && (
                <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
                  Serves: {v.serviceArea}
                </p>
              )}
              {session?.user && (
                <Link
                  href={`/dashboard/requests/new?vendorId=${v.id}`}
                  className="btn btn-outline"
                  style={{ marginTop: "0.8rem" }}
                >
                  Request this vendor
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
