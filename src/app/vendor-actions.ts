"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { getAccessToken } from "@/lib/api-v1";
import { normalizeCurrency } from "@/lib/currencies";
import { platformFetch } from "@/lib/platform";

async function requireToken() {
  const token = await getAccessToken();
  if (!token) redirect("/sign-in?next=/dashboard/vendor");
  return token;
}

export async function registerVendorAction(formData: FormData) {
  try {
    const token = await requireToken();
    const payload = {
      email: String(formData.get("email") || ""),
      contactName: String(formData.get("contactName") || ""),
      businessName: String(formData.get("businessName") || ""),
      category: String(formData.get("category") || "FUNERAL_HOME"),
      description: String(formData.get("description") || ""),
      serviceArea: String(formData.get("serviceArea") || ""),
      pricingNotes: String(formData.get("pricingNotes") || ""),
      phone: String(formData.get("phone") || ""),
    };
    const res = await platformFetch("/api/vendors/register", {
      method: "POST",
      token,
      body: JSON.stringify(payload),
      revalidate: false,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      redirect(
        `/dashboard/vendor?tab=profile&error=${encodeURIComponent((body as { error?: string }).error || "Registration failed")}`,
      );
    }
    revalidatePath("/dashboard/vendor");
    redirect("/dashboard/vendor?tab=profile&registered=1");
  } catch (err) {
    if (isRedirectError(err)) throw err;
    redirect(`/dashboard/vendor?error=${encodeURIComponent("Registration failed")}`);
  }
}

export async function updateVendorProfileAction(formData: FormData) {
  try {
    const token = await requireToken();
    const payload = {
      email: String(formData.get("email") || ""),
      contactName: String(formData.get("contactName") || ""),
      businessName: String(formData.get("businessName") || ""),
      category: String(formData.get("category") || "FUNERAL_HOME"),
      description: String(formData.get("description") || ""),
      serviceArea: String(formData.get("serviceArea") || ""),
      pricingNotes: String(formData.get("pricingNotes") || ""),
      phone: String(formData.get("phone") || ""),
    };
    const res = await platformFetch("/api/vendors/me", {
      method: "PATCH",
      token,
      body: JSON.stringify(payload),
      revalidate: false,
    });
    if (!res.ok) {
      redirect(`/dashboard/vendor?tab=profile&error=${encodeURIComponent("Could not save profile")}`);
    }
    revalidatePath("/dashboard/vendor");
    redirect("/dashboard/vendor?tab=profile&saved=1");
  } catch (err) {
    if (isRedirectError(err)) throw err;
    redirect(`/dashboard/vendor?tab=profile&error=${encodeURIComponent("Could not save profile")}`);
  }
}

export async function addPortfolioAction(formData: FormData) {
  try {
    const token = await requireToken();
    const res = await platformFetch("/api/vendors/me/portfolio", {
      method: "POST",
      token,
      body: JSON.stringify({
        title: String(formData.get("title") || ""),
        description: String(formData.get("description") || ""),
        mediaUrl: String(formData.get("mediaUrl") || ""),
      }),
      revalidate: false,
    });
    if (!res.ok) {
      redirect(`/dashboard/vendor?tab=portfolio&error=${encodeURIComponent("Could not add portfolio item")}`);
    }
    revalidatePath("/dashboard/vendor");
    redirect("/dashboard/vendor?tab=portfolio&saved=1");
  } catch (err) {
    if (isRedirectError(err)) throw err;
    redirect(`/dashboard/vendor?tab=portfolio&error=${encodeURIComponent("Could not add portfolio item")}`);
  }
}

export async function deletePortfolioAction(itemId: number) {
  try {
    const token = await requireToken();
    await platformFetch(`/api/vendors/me/portfolio/${itemId}`, {
      method: "DELETE",
      token,
      revalidate: false,
    });
    revalidatePath("/dashboard/vendor");
    redirect("/dashboard/vendor?tab=portfolio");
  } catch (err) {
    if (isRedirectError(err)) throw err;
    redirect(`/dashboard/vendor?tab=portfolio&error=${encodeURIComponent("Could not delete item")}`);
  }
}

export async function respondToRequestAction(requestId: number, formData: FormData) {
  try {
    const token = await requireToken();
    const res = await platformFetch(`/api/requests/${requestId}/respond`, {
      method: "PATCH",
      token,
      body: JSON.stringify({
        response: String(formData.get("response") || ""),
        quoteAmount: Number(formData.get("quoteAmount") || 0) || null,
        status: String(formData.get("status") || "QUOTED"),
      }),
      revalidate: false,
    });
    if (!res.ok) {
      redirect(`/dashboard/vendor?tab=requests&error=${encodeURIComponent("Could not respond")}`);
    }
    revalidatePath("/dashboard/vendor");
    redirect("/dashboard/vendor?tab=requests&saved=1");
  } catch (err) {
    if (isRedirectError(err)) throw err;
    redirect(`/dashboard/vendor?tab=requests&error=${encodeURIComponent("Could not respond")}`);
  }
}

export async function requestPaymentAction(formData: FormData) {
  try {
    const token = await requireToken();
    const res = await platformFetch("/api/vendor/payments/request", {
      method: "POST",
      token,
      body: JSON.stringify({
        description: String(formData.get("description") || ""),
        amount: Number(formData.get("amount") || 0),
        currency: normalizeCurrency(formData.get("currency")),
        requestId: formData.get("requestId") ? Number(formData.get("requestId")) : null,
      }),
      revalidate: false,
    });
    if (!res.ok) {
      redirect(
        `/dashboard/vendor?tab=payments&sub=request&error=${encodeURIComponent("Payment request failed")}`,
      );
    }
    revalidatePath("/dashboard/vendor");
    redirect("/dashboard/vendor?tab=payments&sub=history&saved=1");
  } catch (err) {
    if (isRedirectError(err)) throw err;
    redirect(
      `/dashboard/vendor?tab=payments&sub=request&error=${encodeURIComponent("Payment request failed")}`,
    );
  }
}

export async function lodgeComplaintAction(formData: FormData) {
  try {
    const token = await requireToken();
    const res = await platformFetch("/api/complaints", {
      method: "POST",
      token,
      body: JSON.stringify({
        vendorId: Number(formData.get("vendorId") || 0),
        subject: String(formData.get("subject") || ""),
        details: String(formData.get("details") || ""),
        fromEmail: String(formData.get("fromEmail") || ""),
        fromName: String(formData.get("fromName") || ""),
        paymentId: formData.get("paymentId") ? Number(formData.get("paymentId")) : null,
        requestId: formData.get("requestId") ? Number(formData.get("requestId")) : null,
      }),
      revalidate: false,
    });
    if (!res.ok) {
      redirect(
        `/dashboard/vendor?tab=payments&sub=complaint&error=${encodeURIComponent("Could not lodge complaint")}`,
      );
    }
    revalidatePath("/dashboard/vendor");
    redirect("/dashboard/vendor?tab=payments&sub=complaint&saved=1");
  } catch (err) {
    if (isRedirectError(err)) throw err;
    redirect(
      `/dashboard/vendor?tab=payments&sub=complaint&error=${encodeURIComponent("Could not lodge complaint")}`,
    );
  }
}

export async function addAccreditationAction(vendorId: number, formData: FormData) {
  try {
    const token = await getAccessToken();
    if (!token) {
      redirect(`/sign-in?next=${encodeURIComponent(`/vendors/${vendorId}`)}`);
    }
    const res = await platformFetch(`/api/vendors/${vendorId}/accreditations`, {
      method: "POST",
      token,
      body: JSON.stringify({
        rating: Number(formData.get("rating") || 5),
        comment: String(formData.get("comment") || ""),
      }),
      revalidate: false,
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      const message =
        body.error ||
        (res.status === 403
          ? "Verify your email before leaving a rating"
          : "Could not submit accreditation");
      redirect(`/vendors/${vendorId}?error=${encodeURIComponent(message)}`);
    }
    revalidatePath(`/vendors/${vendorId}`);
    revalidatePath("/vendors");
    redirect(`/vendors/${vendorId}?accredited=1`);
  } catch (err) {
    if (isRedirectError(err)) throw err;
    redirect(`/vendors/${vendorId}?error=${encodeURIComponent("Could not submit accreditation")}`);
  }
}

export async function resendVerificationAction(formData: FormData) {
  const next = String(formData.get("next") || "/dashboard");
  const safeNext = next.startsWith("/") ? next : "/dashboard";
  try {
    const token = await getAccessToken();
    if (!token) redirect(`/sign-in?next=${encodeURIComponent(safeNext)}`);
    const res = await platformFetch("/api/v1/auth/resend-verification", {
      method: "POST",
      token,
      body: "{}",
      revalidate: false,
    });
    if (!res.ok) {
      redirect(`${safeNext}?error=${encodeURIComponent("Could not resend verification email")}`);
    }
    redirect(`${safeNext}?verifySent=1`);
  } catch (err) {
    if (isRedirectError(err)) throw err;
    redirect(`${safeNext}?error=${encodeURIComponent("Could not resend verification email")}`);
  }
}
