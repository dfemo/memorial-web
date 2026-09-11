import Link from "next/link";
import { redirect } from "next/navigation";
import { getAccessToken } from "@/lib/api-v1";
import { getPublicSiteConfig } from "@/lib/site-config";

export const metadata = { title: "Vendors" };
export const dynamic = "force-dynamic";

export default async function VendorsPage() {
  const config = await getPublicSiteConfig();
  if (!config.showVendorDirectory) redirect("/");

  const token = await getAccessToken();
  const vendors = config.vendors;
  const apiDown = config.source === "fallback";

  return (
    <section className="section">
      <div className="wrap">
        <h2>{config.vendorsTitle}</h2>
        <p className="lede">{config.vendorsLede}</p>
        <p style={{ marginBottom: "1.5rem" }}>
          {token ? (
            <>
              <Link href="/dashboard/vendor" className="btn btn-solid">
                Vendor dashboard
              </Link>{" "}
              <Link href="/dashboard/requests/new" className="btn btn-outline">
                Request a service
              </Link>
            </>
          ) : (
            <>
              <Link href="/sign-up?as=vendor" className="btn btn-solid">
                Sign up as a vendor
              </Link>{" "}
              <Link href="/sign-in?next=/dashboard/vendor" className="btn btn-outline">
                Vendor sign in
              </Link>
            </>
          )}
        </p>
        {apiDown && (
          <div className="panel" style={{ marginBottom: "1rem" }}>
            <p style={{ margin: 0, color: "var(--muted)" }}>
              Connect PLATFORM_API_URL to load the live vendor directory.
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
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.8rem" }}>
                <Link href={`/vendors/${v.id}`} className="btn btn-outline">
                  View profile
                </Link>
                {token && (
                  <Link href={`/dashboard/requests/new?vendorId=${v.id}`} className="btn btn-solid">
                    Request
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
