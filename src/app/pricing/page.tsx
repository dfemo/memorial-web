import Link from "next/link";
import { BILLING_COPY } from "@/lib/stripe";

export const metadata = { title: "Pricing" };

export default function PricingPage() {
  const plans = [
    BILLING_COPY.FREE,
    BILLING_COPY.PREMIUM_MONTHLY,
    BILLING_COPY.PREMIUM_YEARLY,
    BILLING_COPY.LIFETIME,
  ];

  return (
    <section className="section">
      <div className="wrap">
        <h2>Simple plans for lasting remembrance</h2>
        <p className="lede">
          Start free. Upgrade when you need more media, privacy, and permanence —
          including a one-time Lifetime option.
        </p>
        <div className="pricing-grid">
          {plans.map((plan) => (
            <div key={plan.name} className="price-panel">
              <h3>{plan.name}</h3>
              <div className="amount">{plan.price}</div>
              <p>{plan.detail}</p>
              <div style={{ marginTop: "1.2rem" }}>
                <Link href="/sign-up" className="btn btn-solid">
                  Get started
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
