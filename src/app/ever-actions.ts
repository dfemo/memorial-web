"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { ApiError, apiV1, clearAuthCookies, type Memorial } from "@/lib/api-v1";

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
    const memorial = await apiV1<{ id: string; slug: string; published: boolean }>(
      "/api/v1/memorials",
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    );

    if (!memorial?.slug) {
      redirect(
        `/create?error=${encodeURIComponent("Memorial was created but no public link was returned.")}`,
      );
    }

    revalidatePath(`/memorial/${memorial.slug}`);
    revalidatePath("/browse");
    revalidatePath("/dashboard");
    revalidatePath("/");

    if (memorial.published && privacy === "PUBLIC") {
      redirect(`/memorial/${memorial.slug}`);
    }
    redirect(`/memorial/manage/${memorial.id}`);
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

export async function updateMemorialAction(memorialId: string, formData: FormData) {
  const privacy = String(formData.get("privacyLevel") || "PUBLIC");
  const published = String(formData.get("published") || "false") === "true";
  const slugInput = String(formData.get("slug") || "").trim();
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
    published,
    slug: slugInput || null,
  };

  try {
    const memorial = await apiV1<Memorial>(`/api/v1/memorials/${memorialId}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });

    revalidatePath(`/memorial/manage/${memorialId}`);
    revalidatePath(`/memorial/${memorial.slug}`);
    if (slugInput && slugInput !== memorial.slug) {
      revalidatePath(`/memorial/${slugInput}`);
    }
    revalidatePath("/browse");
    revalidatePath("/dashboard");
    revalidatePath("/");

    redirect(
      `/memorial/manage/${memorialId}?saved=1&privacy=${encodeURIComponent(memorial.privacyLevel)}&published=${memorial.published ? "1" : "0"}`,
    );
  } catch (err) {
    if (isRedirectError(err)) throw err;
    if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
      redirect(
        `/sign-in?next=${encodeURIComponent(`/memorial/manage/${memorialId}`)}&error=` +
          encodeURIComponent("Please sign in again to save changes."),
      );
    }
    const message = err instanceof Error ? err.message : "Could not save memorial";
    redirect(`/memorial/manage/${memorialId}?error=${encodeURIComponent(message)}`);
  }
}
