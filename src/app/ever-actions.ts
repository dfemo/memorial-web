"use server";

import { redirect } from "next/navigation";
import { apiV1, setAuthCookies, clearAuthCookies, type ApiUser } from "@/lib/api-v1";

export async function registerAction(formData: FormData) {
  const body = {
    firstName: String(formData.get("firstName") || ""),
    lastName: String(formData.get("lastName") || ""),
    email: String(formData.get("email") || ""),
    password: String(formData.get("password") || ""),
  };
  const res = await apiV1<{
    accessToken: string;
    refreshToken: string;
    user: ApiUser;
  }>("/api/v1/auth/register", {
    method: "POST",
    auth: false,
    body: JSON.stringify(body),
  });
  await setAuthCookies(res.accessToken, res.refreshToken);
  redirect("/dashboard");
}

export async function loginAction(formData: FormData) {
  const body = {
    email: String(formData.get("email") || ""),
    password: String(formData.get("password") || ""),
  };
  const res = await apiV1<{
    accessToken: string;
    refreshToken: string;
    user: ApiUser;
  }>("/api/v1/auth/login", {
    method: "POST",
    auth: false,
    body: JSON.stringify(body),
  });
  await setAuthCookies(res.accessToken, res.refreshToken);
  redirect("/dashboard");
}

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
  const memorial = await apiV1<{ id: string; slug: string }>("/api/v1/memorials", {
    method: "POST",
    body: JSON.stringify(body),
  });
  redirect(`/memorial/${memorial.slug}`);
}
