"use server";

import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { ApiError, apiV1, clearAuthCookies } from "@/lib/api-v1";

export async function logoutAction() {
  await clearAuthCookies();
  redirect("/");
}

export async function createMemorialAction(formData: FormData) {
  const privacy = String(formData.get("privacyLevel") || "PUBLIC");
  const body = {
    firstName: String(formData.get("firstName") || ""),
    middleName: String(formData.get("middleName") || "") || null,
    lastName: String(formData.get("lastName") || ""),
    dateOfBirth: String(formData.get("dateOfBirth") || "") || null,
    dateOfDeath: String(formData.get("dateOfDeath") || "") || null,
    biography: String(formData.get("biography") || "") || null,
    serviceInfo: String(formData.get("serviceInfo") || "") || null,
    location: String(formData.get("location") || "") || null,
    privacyLevel: privacy,
    profilePhotoUrl: String(formData.get("profilePhotoUrl") || "") || null,
    coverPhotoUrl: String(formData.get("coverPhotoUrl") || "") || null,
    publish: String(formData.get("publish") || "true") === "true",
  };

  try {
    const memorial = await apiV1<{ id: string; slug: string }>("/api/v1/memorials", {
      method: "POST",
      body: JSON.stringify(body),
    });
    redirect(`/memorial/${memorial.slug}`);
  } catch (err) {
    if (isRedirectError(err)) throw err;
    if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
      redirect(
        "/sign-in?next=/create&error=" +
          encodeURIComponent("Please sign in to create a memorial."),
      );
    }
    const message = err instanceof Error ? err.message : "Could not create memorial";
    redirect(`/create?error=${encodeURIComponent(message)}`);
  }
}
