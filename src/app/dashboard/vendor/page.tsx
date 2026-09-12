import Link from "next/link";
import { redirect } from "next/navigation";
import {
  addPortfolioAction,
  deletePortfolioAction,
  lodgeComplaintAction,
  registerVendorAction,
  requestPaymentAction,
  respondToRequestAction,
  updateVendorProfileAction,
} from "@/app/vendor-actions";
import { getAccessToken } from "@/lib/api-v1";
import {
  fetchMyVendor,
  fetchVendorComplaints,
  fetchVendorPayments,
  fetchVendorRequests,
  type Accreditation,
  type PortfolioItem,
  type ServiceRequest,
  type Vendor,
  type VendorComplaint,
  type VendorPayment,
} from "@/lib/vendor-api";
import { formatMoney } from "@/lib/currencies";

export const metadata = { title: "Vendor dashboard" };
export const dynamic = "force-dynamic";

const TABS = [
  { id: "profile", label: "Profile" },
  { id: "portfolio", label: "Portfolio" },
  { id: "requests", label: "Service requests" },
  { id: "payments", label: "Payment resolutions" },
  { id: "accreditations", label: "Accreditations" },
] as const;

const PAYMENT_SUB = [
  { id: "history", label: "Payment history" },
  { id: "request", label: "Request payment" },
  { id: "complaint", label: "Lodge complaint" },
] as const;

const CATEGORIES = [
  "FUNERAL_HOME",
  "FLORIST",
  "CEMETERY",
  "CELEBRANT",
  "CATERING",
  "TRANSPORT",
  "OTHER",
];

export default async function VendorDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    tab?: string;
    sub?: string;
    registered?: string;
    saved?: string;
    error?: string;
  }>;
}) {
  const token = await getAccessToken();
  if (!token) redirect("/sign-in?next=/dashboard/vendor");

  const sp = await searchParams;
  const tab = TABS.some((t) => t.id === sp.tab) ? (sp.tab as (typeof TABS)[number]["id"]) : "profile";
  const sub = PAYMENT_SUB.some((s) => s.id === sp.sub)
    ? (sp.sub as (typeof PAYMENT_SUB)[number]["id"])
    : "history";

  const me = await fetchMyVendor();
  const hasVendor = me.ok && me.data?.vendor;
  const vendor = (me.data?.vendor || null) as Vendor | null;
  const portfolio = ((me.data?.portfolio || []) as PortfolioItem[]) || [];
  const accreditations = ((me.data?.accreditations || []) as Accreditation[]) || [];

  let requests: ServiceRequest[] = [];
  let payments: VendorPayment[] = [];
  let complaints: VendorComplaint[] = [];

  if (hasVendor) {
    if (tab === "requests") {
      const r = await fetchVendorRequests();
      if (r.ok) requests = (r.data as ServiceRequest[]) || [];
    }
    if (tab === "payments") {
      const [p, c] = await Promise.all([fetchVendorPayments(), fetchVendorComplaints()]);
      if (p.ok) payments = (p.data as VendorPayment[]) || [];
      if (c.ok) complaints = (c.data as VendorComplaint[]) || [];
    }
  }

  return (
    <div className="dash-shell">
      <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", marginBottom: 0 }}>Vendor workspace</h1>
          <p style={{ color: "var(--muted)" }}>
            Get listed, manage your profile and portfolio, resolve payments, and collect accreditations.
          </p>
        </div>
        <Link href="/vendors" className="btn btn-outline">
          Public directory
        </Link>
      </div>

      {sp.error && (
        <p role="alert" className="soft-card" style={{ color: "#7a2e2e", marginTop: "1rem" }}>
          {sp.error}
        </p>
      )}
      {(sp.saved || sp.registered) && (
        <p role="status" className="soft-card" style={{ color: "var(--accent)", marginTop: "1rem" }}>
          {sp.registered ? "Registration submitted for admin approval." : "Saved."}
        </p>
      )}

      {!hasVendor ? (
        <section className="soft-card" style={{ marginTop: "1.25rem" }}>
          <h2 style={{ fontFamily: "var(--font-display)", marginTop: 0 }}>Create vendor account</h2>
          <p style={{ color: "var(--muted)" }}>
            Submit your business for listing. Admins approve before it appears publicly.
          </p>
          <VendorProfileForm action={registerVendorAction} submitLabel="Submit for approval" />
        </section>
      ) : (
        <>
          <p style={{ marginTop: "1rem" }}>
            <span className="badge">{vendor!.status}</span>{" "}
            <span className="badge">{vendor!.category}</span>{" "}
            <strong>{vendor!.businessName}</strong>
          </p>

          <nav className="tabs" style={{ marginTop: "1rem" }}>
            {TABS.map((t) => (
              <Link
                key={t.id}
                href={`/dashboard/vendor?tab=${t.id}`}
                className={tab === t.id ? "active" : ""}
              >
                {t.label}
              </Link>
            ))}
          </nav>

          {tab === "profile" && (
            <section className="soft-card" style={{ marginTop: "1rem" }}>
              <h2 style={{ fontFamily: "var(--font-display)", marginTop: 0 }}>Profile management</h2>
              <VendorProfileForm
                action={updateVendorProfileAction}
                vendor={vendor!}
                submitLabel="Save profile"
              />
            </section>
          )}

          {tab === "portfolio" && (
            <section className="soft-card" style={{ marginTop: "1rem" }}>
              <h2 style={{ fontFamily: "var(--font-display)", marginTop: 0 }}>Portfolio management</h2>
              <p style={{ color: "var(--muted)" }}>Showcase work you have completed for families.</p>
              <form className="form-stack" action={addPortfolioAction}>
                <label>
                  Title
                  <input name="title" required />
                </label>
                <label>
                  Description
                  <textarea name="description" />
                </label>
                <label>
                  Media URL
                  <input name="mediaUrl" placeholder="https://..." />
                </label>
                <button className="btn btn-solid" type="submit">
                  Add portfolio item
                </button>
              </form>
              <div style={{ marginTop: "1.25rem", display: "grid", gap: "0.75rem" }}>
                {portfolio.map((item) => (
                  <div className="list-row" key={item.id}>
                    <div>
                      <strong>{item.title}</strong>
                      <div style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
                        {item.description}
                      </div>
                    </div>
                    <form action={deletePortfolioAction.bind(null, item.id)}>
                      <button className="btn btn-ghost" type="submit">
                        Remove
                      </button>
                    </form>
                  </div>
                ))}
                {portfolio.length === 0 && (
                  <p style={{ color: "var(--muted)", margin: 0 }}>No portfolio items yet.</p>
                )}
              </div>
            </section>
          )}

          {tab === "requests" && (
            <section className="soft-card" style={{ marginTop: "1rem" }}>
              <h2 style={{ fontFamily: "var(--font-display)", marginTop: 0 }}>Service requests</h2>
              {requests.map((req) => (
                <article
                  key={req.id}
                  style={{ borderTop: "1px solid var(--line)", paddingTop: "1rem", marginTop: "1rem" }}
                >
                  <strong>{req.title}</strong> <span className="badge">{req.status}</span>
                  <p style={{ color: "var(--muted)" }}>{req.notes}</p>
                  <p style={{ fontSize: "0.9rem" }}>Client: {req.clientName || "—"}</p>
                  <form className="form-stack" action={respondToRequestAction.bind(null, req.id)}>
                    <label>
                      Response
                      <textarea name="response" defaultValue={req.vendorResponse || ""} />
                    </label>
                    <label>
                      Quote amount
                      <input
                        name="quoteAmount"
                        type="number"
                        step="0.01"
                        defaultValue={req.quoteAmount ?? ""}
                      />
                    </label>
                    <label>
                      Status
                      <select name="status" defaultValue={req.status || "QUOTED"}>
                        <option value="OPEN">Open</option>
                        <option value="QUOTED">Quoted</option>
                        <option value="ACCEPTED">Accepted</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                    </label>
                    <button className="btn btn-solid" type="submit">
                      Send response
                    </button>
                  </form>
                </article>
              ))}
              {requests.length === 0 && (
                <p style={{ color: "var(--muted)", margin: 0 }}>No requests yet.</p>
              )}
            </section>
          )}

          {tab === "payments" && (
            <section className="soft-card" style={{ marginTop: "1rem" }}>
              <h2 style={{ fontFamily: "var(--font-display)", marginTop: 0 }}>Payment resolutions</h2>
              <nav className="tabs" style={{ marginBottom: "1rem" }}>
                {PAYMENT_SUB.map((s) => (
                  <Link
                    key={s.id}
                    href={`/dashboard/vendor?tab=payments&sub=${s.id}`}
                    className={sub === s.id ? "active" : ""}
                  >
                    {s.label}
                  </Link>
                ))}
              </nav>

              {sub === "history" && (
                <div>
                  <h3 style={{ fontFamily: "var(--font-display)" }}>Payment history</h3>
                  {payments.map((p) => (
                    <div className="list-row" key={p.id}>
                      <div>
                        <strong>{formatMoney(p.amount, p.currency)}</strong>
                        <div style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
                          {p.description} · {p.kind || "ADMIN"}
                        </div>
                      </div>
                      <span className="badge">{p.status}</span>
                    </div>
                  ))}
                  {payments.length === 0 && (
                    <p style={{ color: "var(--muted)" }}>No payment records yet.</p>
                  )}
                </div>
              )}

              {sub === "request" && (
                <div>
                  <h3 style={{ fontFamily: "var(--font-display)" }}>Request payment from admin</h3>
                  <form className="form-stack" action={requestPaymentAction}>
                    <label>
                      Description
                      <input name="description" required placeholder="Lead fee / completed service…" />
                    </label>
                    <label>
                      Amount
                      <input name="amount" type="number" step="0.01" required />
                    </label>
                    <label>
                      Currency
                      <select name="currency" defaultValue="USD">
                        <option value="NGN">NGN — Nigerian Naira</option>
                        <option value="USD">USD — US Dollar</option>
                        <option value="GBP">GBP — British Pound</option>
                      </select>
                    </label>
                    <button className="btn btn-solid" type="submit">
                      Submit payment request
                    </button>
                  </form>
                </div>
              )}

              {sub === "complaint" && (
                <div>
                  <h3 style={{ fontFamily: "var(--font-display)" }}>Lodge complaint</h3>
                  <form className="form-stack" action={lodgeComplaintAction}>
                    <input type="hidden" name="vendorId" value={vendor!.id} />
                    <label>
                      Your name
                      <input name="fromName" defaultValue={vendor!.contactName || ""} />
                    </label>
                    <label>
                      Email
                      <input name="fromEmail" type="email" defaultValue={vendor!.email || ""} />
                    </label>
                    <label>
                      Subject
                      <input name="subject" required />
                    </label>
                    <label>
                      Details
                      <textarea name="details" required rows={5} />
                    </label>
                    <button className="btn btn-solid" type="submit">
                      Lodge complaint
                    </button>
                  </form>
                  <div style={{ marginTop: "1.25rem" }}>
                    <h4 style={{ fontFamily: "var(--font-display)" }}>Your complaints</h4>
                    {complaints.map((c) => (
                      <div className="list-row" key={c.id}>
                        <div>
                          <strong>{c.subject}</strong>
                          <div style={{ color: "var(--muted)", fontSize: "0.9rem" }}>{c.details}</div>
                        </div>
                        <span className="badge">{c.status}</span>
                      </div>
                    ))}
                    {complaints.length === 0 && (
                      <p style={{ color: "var(--muted)" }}>No complaints lodged.</p>
                    )}
                  </div>
                </div>
              )}
            </section>
          )}

          {tab === "accreditations" && (
            <section className="soft-card" style={{ marginTop: "1rem" }}>
              <h2 style={{ fontFamily: "var(--font-display)", marginTop: 0 }}>
                Accreditations from viewers
              </h2>
              <p style={{ color: "var(--muted)" }}>
                Families leave ratings on your public vendor page.{" "}
                <Link href={`/vendors/${vendor!.id}`}>View public profile</Link>
              </p>
              {accreditations.map((a) => (
                <div className="list-row" key={a.id}>
                  <div>
                    <strong>{a.viewerName || "Viewer"}</strong> · {a.rating}/5
                    <div style={{ color: "var(--muted)", fontSize: "0.9rem" }}>{a.comment}</div>
                  </div>
                </div>
              ))}
              {accreditations.length === 0 && (
                <p style={{ color: "var(--muted)", margin: 0 }}>No accreditations yet.</p>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}

function VendorProfileForm({
  action,
  vendor,
  submitLabel,
}: {
  action: (formData: FormData) => Promise<void>;
  vendor?: Vendor;
  submitLabel: string;
}) {
  return (
    <form className="form-stack" action={action}>
      <label>
        Business name
        <input name="businessName" required defaultValue={vendor?.businessName || ""} />
      </label>
      <div style={{ display: "grid", gap: "0.9rem", gridTemplateColumns: "1fr 1fr" }}>
        <label>
          Contact name
          <input name="contactName" defaultValue={vendor?.contactName || ""} />
        </label>
        <label>
          Email
          <input name="email" type="email" defaultValue={vendor?.email || ""} />
        </label>
      </div>
      <label>
        Category
        <select name="category" defaultValue={vendor?.category || "FUNERAL_HOME"}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c.replaceAll("_", " ")}
            </option>
          ))}
        </select>
      </label>
      <label>
        Description
        <textarea name="description" defaultValue={vendor?.description || ""} />
      </label>
      <label>
        Service area
        <input name="serviceArea" defaultValue={vendor?.serviceArea || ""} />
      </label>
      <label>
        Pricing notes
        <textarea name="pricingNotes" defaultValue={vendor?.pricingNotes || ""} />
      </label>
      <label>
        Phone
        <input name="phone" defaultValue={vendor?.phone || ""} />
      </label>
      <button className="btn btn-solid" type="submit">
        {submitLabel}
      </button>
    </form>
  );
}
