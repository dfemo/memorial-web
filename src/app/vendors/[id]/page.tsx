import Link from "next/link";
import { notFound } from "next/navigation";
import { addAccreditationAction, resendVerificationAction } from "@/app/vendor-actions";
import { apiV1, getAccessToken, type ApiUser } from "@/lib/api-v1";
import { platformFetch } from "@/lib/platform";
import type { Accreditation, PortfolioItem, Vendor } from "@/lib/vendor-api";

export const dynamic = "force-dynamic";

export default async function VendorDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    accredited?: string;
    error?: string;
    verifySent?: string;
  }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const res = await platformFetch(`/api/vendors/${id}`, { revalidate: false });
  if (!res.ok) notFound();
  const data = (await res.json()) as {
    vendor: Vendor;
    portfolio: PortfolioItem[];
    accreditations: Accreditation[];
    avgRating?: number;
    ratingCount?: number;
  };

  const v = data.vendor;
  const avg = data.avgRating ?? 0;
  const count = data.ratingCount ?? data.accreditations.length;
  const action = addAccreditationAction.bind(null, v.id);

  const token = await getAccessToken();
  let me: ApiUser | null = null;
  if (token) {
    try {
      me = await apiV1<ApiUser>("/api/v1/auth/me", { token });
    } catch {
      me = null;
    }
  }

  return (
    <div className="narrow-shell">
      <p>
        <Link href="/vendors">← Vendor directory</Link>
      </p>
      <span className="badge">{v.category}</span>
      <h1 style={{ fontFamily: "var(--font-display)" }}>{v.businessName}</h1>
      <p style={{ color: "var(--muted)" }}>{v.serviceArea}</p>
      {count > 0 ? (
        <p>
          <strong>{avg.toFixed(1)}</strong> / 5 · {count} accreditation{count === 1 ? "" : "s"}
        </p>
      ) : (
        <p style={{ color: "var(--muted)" }}>No ratings yet</p>
      )}
      <p style={{ whiteSpace: "pre-wrap" }}>{v.description}</p>
      {v.pricingNotes && (
        <p style={{ color: "var(--muted)" }}>
          <strong>Pricing:</strong> {v.pricingNotes}
        </p>
      )}

      <div className="cta-row" style={{ margin: "1rem 0" }}>
        <Link href={`/dashboard/requests/new?vendorId=${v.id}`} className="btn btn-solid">
          Request this vendor
        </Link>
      </div>

      {sp.accredited && (
        <p role="status" className="soft-card" style={{ color: "var(--accent)" }}>
          Thank you — your verified rating was saved.
        </p>
      )}
      {sp.verifySent && (
        <p role="status" className="soft-card" style={{ color: "var(--accent)" }}>
          Verification email sent. Check your inbox.
        </p>
      )}
      {sp.error && (
        <p role="alert" className="soft-card" style={{ color: "#7a2e2e" }}>
          {sp.error}
        </p>
      )}

      <section className="soft-card">
        <h2 style={{ fontFamily: "var(--font-display)", marginTop: 0 }}>Portfolio</h2>
        {data.portfolio.map((item) => (
          <article key={item.id} style={{ marginBottom: "1rem" }}>
            <h3 style={{ fontFamily: "var(--font-display)", marginBottom: 0 }}>{item.title}</h3>
            <p>{item.description}</p>
            {item.mediaUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.mediaUrl}
                alt={item.title}
                style={{ maxWidth: "100%", borderRadius: "0.5rem" }}
              />
            )}
          </article>
        ))}
        {data.portfolio.length === 0 && (
          <p style={{ color: "var(--muted)", margin: 0 }}>No portfolio items yet.</p>
        )}
      </section>

      <section className="soft-card" style={{ marginTop: "1.25rem" }}>
        <h2 style={{ fontFamily: "var(--font-display)", marginTop: 0 }}>
          Accreditations & ratings
        </h2>
        {data.accreditations.map((a) => (
          <div className="list-row" key={a.id}>
            <div>
              <strong>{a.viewerName || "Verified user"}</strong> · {a.rating}/5
              <div style={{ color: "var(--muted)", fontSize: "0.9rem" }}>{a.comment}</div>
            </div>
          </div>
        ))}
        {data.accreditations.length === 0 && (
          <p style={{ color: "var(--muted)" }}>Be the first verified visitor to leave a rating.</p>
        )}

        <h3 style={{ fontFamily: "var(--font-display)" }}>Rate this vendor</h3>
        {!me ? (
          <p style={{ color: "var(--muted)" }}>
            Ratings are limited to signed-in, email-verified users to prevent spam.{" "}
            <Link href={`/sign-in?next=${encodeURIComponent(`/vendors/${v.id}`)}`}>Sign in</Link>
            {" · "}
            <Link href={`/sign-up?next=${encodeURIComponent(`/vendors/${v.id}`)}`}>Create account</Link>
          </p>
        ) : !me.emailVerified ? (
          <div>
            <p style={{ color: "var(--muted)" }}>
              Verify your email ({me.email}) before leaving a rating.
            </p>
            <form action={resendVerificationAction}>
              <input type="hidden" name="next" value={`/vendors/${v.id}`} />
              <button className="btn btn-solid" type="submit">
                Resend verification email
              </button>
            </form>
          </div>
        ) : (
          <form className="form-stack" action={action}>
            <p style={{ color: "var(--muted)", margin: 0 }}>
              Rating as <strong>{me.firstName} {me.lastName}</strong> (verified)
            </p>
            <label>
              Rating
              <select name="rating" defaultValue="5">
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n} star{n === 1 ? "" : "s"}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Comment
              <textarea name="comment" placeholder="Share your experience with this vendor" />
            </label>
            <button className="btn btn-solid" type="submit">
              Submit accreditation
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
