import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST(request: Request) {
  if (!stripe) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const memorialId = session.metadata?.memorialId;
    const planKey = session.metadata?.planKey;
    if (memorialId && planKey) {
      const plan = planKey === "LIFETIME" ? "LIFETIME" : "PREMIUM";
      await prisma.memorial.update({
        where: { id: memorialId },
        data: {
          plan,
          stripeSubId:
            typeof session.subscription === "string" ? session.subscription : null,
        },
      });
    }
  }

  return NextResponse.json({ received: true });
}
