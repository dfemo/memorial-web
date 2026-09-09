import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getPublicSiteConfig } from "@/lib/site-config";

export const metadata = { title: "Vendors" };

export default async function VendorsPage() {
  const config = await getPublicSiteConfig();
  if (!config.showVendorDirectory) redirect("/");

  let session = null;
  try {
    session = await auth();
  } catch {
    /* ignore */
  }

  const vendors = config.vendors;
  const apiDown = config.source === "fallback";

  return (
    <section className="section">
      <div className="wrap">
        <h2>{config.vendorsTitle}</h2>
        <p className="lede">{config.vendorsLede}</p>
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
              Connect PLATFORM_API_URL to load the live vendor directory and admin-managed copy.
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
