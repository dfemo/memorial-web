import Link from "next/link";

export const metadata = { title: "Pricing" };

const plans = [
  {
    name: "Free",
    price: "$0",
    detail: "Create a memorial, guestbook, and core photo gallery.",
  },
  {
    name: "Premium",
    price: "Coming soon",
    detail: "More media, invite-only privacy, and richer storytelling.",
  },
  {
    name: "Lifetime",
    price: "Coming soon",
    detail: "One payment for lasting permanence — payment providers pluggable.",
  },
];

export default function PricingPage() {
  return (
    <section className="section">
      <div className="wrap">
        <h2>Simple plans for lasting remembrance</h2>
        <p className="lede">
          Start free today. Premium and Lifetime are designed for when you need more space and
          privacy — without locking you to a single payment vendor.
        </p>
        <div className="card-grid">
          {plans.map((p) => (
            <div key={p.name} className="soft-card">
              <h3>{p.name}</h3>
              <p style={{ fontSize: "1.5rem", margin: "0.3rem 0 0.8rem" }}>{p.price}</p>
              <p>{p.detail}</p>
              <Link href="/create" className="btn btn-solid" style={{ marginTop: "1rem" }}>
                Get started
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
