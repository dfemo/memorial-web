"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth, signIn } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS } from "@/lib/plans";
import { uniqueMemorialSlug } from "@/lib/slug";
import { getPriceId, stripe } from "@/lib/stripe";

const signUpSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function registerUser(formData: FormData): Promise<void> {
  const parsed = signUpSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) redirect("/sign-up?error=invalid");

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) redirect("/sign-up?error=exists");

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  await prisma.user.create({
    data: {
      name: parsed.data.name,
      email,
      passwordHash,
      role: "CLIENT",
    },
  });

  await signIn("credentials", {
    email,
    password: parsed.data.password,
    redirectTo: "/dashboard",
  });
}

export async function loginUser(formData: FormData): Promise<void> {
  try {
    await signIn("credentials", {
      email: String(formData.get("email") || "").toLowerCase(),
      password: String(formData.get("password") || ""),
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) redirect("/sign-in?error=credentials");
    throw error;
  }
}

const memorialSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  birthDate: z.string().optional(),
  deathDate: z.string().optional(),
  biography: z.string().optional(),
  serviceInfo: z.string().optional(),
  theme: z.string().optional(),
  privacy: z.enum(["PUBLIC", "UNLISTED", "PRIVATE"]).optional(),
  accessPassword: z.string().optional(),
});

export async function createMemorial(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const parsed = memorialSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    birthDate: formData.get("birthDate") || undefined,
    deathDate: formData.get("deathDate") || undefined,
    biography: formData.get("biography") || undefined,
    serviceInfo: formData.get("serviceInfo") || undefined,
    theme: formData.get("theme") || "serene",
    privacy: formData.get("privacy") || "PUBLIC",
    accessPassword: formData.get("accessPassword") || undefined,
  });
  if (!parsed.success) redirect("/dashboard?error=invalid");

  const slug = await uniqueMemorialSlug(parsed.data.firstName, parsed.data.lastName);
  const memorial = await prisma.memorial.create({
    data: {
      slug,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      birthDate: parsed.data.birthDate ? new Date(parsed.data.birthDate) : null,
      deathDate: parsed.data.deathDate ? new Date(parsed.data.deathDate) : null,
      biography: parsed.data.biography,
      serviceInfo: parsed.data.serviceInfo,
      theme: parsed.data.theme || "serene",
      privacy: parsed.data.privacy === "PRIVATE" ? "PUBLIC" : parsed.data.privacy || "PUBLIC",
      accessPassword: parsed.data.accessPassword || null,
      ownerId: session.user.id,
      members: {
        create: { userId: session.user.id, role: "EDITOR" },
      },
    },
  });

  redirect(`/dashboard/memorials/${memorial.id}`);
}

export async function updateMemorial(memorialId: string, formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const memorial = await prisma.memorial.findFirst({
    where: {
      id: memorialId,
      OR: [
        { ownerId: session.user.id },
        { members: { some: { userId: session.user.id, role: "EDITOR" } } },
      ],
    },
  });
  if (!memorial) redirect("/dashboard");

  const parsed = memorialSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    birthDate: formData.get("birthDate") || undefined,
    deathDate: formData.get("deathDate") || undefined,
    biography: formData.get("biography") || undefined,
    serviceInfo: formData.get("serviceInfo") || undefined,
    theme: formData.get("theme") || memorial.theme,
    privacy: formData.get("privacy") || memorial.privacy,
    accessPassword: formData.get("accessPassword") || undefined,
  });
  if (!parsed.success) redirect(`/dashboard/memorials/${memorialId}?error=invalid`);

  const limits = PLAN_LIMITS[memorial.plan];
  let privacy = parsed.data.privacy || memorial.privacy;
  if (privacy === "PRIVATE" && !limits.privatePrivacy) {
    privacy = "UNLISTED";
  }

  await prisma.memorial.update({
    where: { id: memorialId },
    data: {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      birthDate: parsed.data.birthDate ? new Date(parsed.data.birthDate) : null,
      deathDate: parsed.data.deathDate ? new Date(parsed.data.deathDate) : null,
      biography: parsed.data.biography,
      serviceInfo: parsed.data.serviceInfo,
      theme: parsed.data.theme,
      privacy,
      accessPassword: parsed.data.accessPassword || null,
      coverImageUrl: String(formData.get("coverImageUrl") || memorial.coverImageUrl || "") || null,
    },
  });

  revalidatePath(`/memorials/${memorial.slug}`);
  revalidatePath(`/dashboard/memorials/${memorialId}`);
}

export async function addTribute(slug: string, formData: FormData): Promise<void> {
  const session = await auth();
  const body = String(formData.get("body") || "").trim();
  const authorName =
    String(formData.get("authorName") || "").trim() || session?.user?.name || "Guest";

  if (!body) redirect(`/memorials/${slug}?error=empty`);

  const memorial = await prisma.memorial.findUnique({ where: { slug } });
  if (!memorial) redirect("/");
  if (memorial.privacy === "PRIVATE" && !session?.user) {
    redirect(`/memorials/${slug}?error=auth`);
  }

  await prisma.tribute.create({
    data: {
      memorialId: memorial.id,
      authorId: session?.user?.id,
      authorName,
      body,
    },
  });

  revalidatePath(`/memorials/${slug}`);
}

export async function addMedia(memorialId: string, formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const memorial = await prisma.memorial.findFirst({
    where: {
      id: memorialId,
      OR: [
        { ownerId: session.user.id },
        { members: { some: { userId: session.user.id, role: "EDITOR" } } },
      ],
    },
    include: { media: true },
  });
  if (!memorial) redirect("/dashboard");

  const type = String(formData.get("type") || "PHOTO") as "PHOTO" | "VIDEO" | "MUSIC" | "COVER";
  const url = String(formData.get("url") || "").trim();
  const caption = String(formData.get("caption") || "").trim() || null;
  if (!url) redirect(`/dashboard/memorials/${memorialId}?error=url`);

  const limits = PLAN_LIMITS[memorial.plan];
  const photoCount = memorial.media.filter((m) => m.type === "PHOTO").length;
  const videoCount = memorial.media.filter((m) => m.type === "VIDEO").length;
  const musicCount = memorial.media.filter((m) => m.type === "MUSIC").length;

  if (type === "PHOTO" && photoCount >= limits.photos) {
    redirect(`/dashboard/memorials/${memorialId}?error=photo-limit`);
  }
  if (type === "VIDEO" && videoCount >= limits.videos) {
    redirect(`/dashboard/memorials/${memorialId}?error=video-plan`);
  }
  if (type === "MUSIC" && musicCount >= limits.music) {
    redirect(`/dashboard/memorials/${memorialId}?error=music-plan`);
  }

  if (type === "COVER") {
    await prisma.memorial.update({
      where: { id: memorialId },
      data: { coverImageUrl: url },
    });
  }

  await prisma.memorialMedia.create({
    data: {
      memorialId,
      type,
      url,
      caption,
      sortOrder: memorial.media.length,
    },
  });

  revalidatePath(`/dashboard/memorials/${memorialId}`);
  revalidatePath(`/memorials/${memorial.slug}`);
}

export async function inviteCollaborator(memorialId: string, formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const email = String(formData.get("email") || "")
    .toLowerCase()
    .trim();
  const role = String(formData.get("role") || "EDITOR") as "EDITOR" | "VIEWER";
  if (!email) redirect(`/dashboard/memorials/${memorialId}?error=email`);

  const memorial = await prisma.memorial.findFirst({
    where: { id: memorialId, ownerId: session.user.id },
  });
  if (!memorial) redirect("/dashboard");

  const receiver = await prisma.user.findUnique({ where: { email } });

  await prisma.memorialInvite.create({
    data: {
      memorialId,
      email,
      role,
      senderId: session.user.id,
      receiverId: receiver?.id,
      status: receiver ? "ACCEPTED" : "PENDING",
    },
  });

  if (receiver) {
    await prisma.memorialMember.upsert({
      where: {
        memorialId_userId: { memorialId, userId: receiver.id },
      },
      create: { memorialId, userId: receiver.id, role },
      update: { role },
    });
  }

  revalidatePath(`/dashboard/memorials/${memorialId}`);
}

export async function startCheckout(
  memorialId: string,
  planKey: "PREMIUM_MONTHLY" | "PREMIUM_YEARLY" | "LIFETIME",
): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const memorial = await prisma.memorial.findFirst({
    where: { id: memorialId, ownerId: session.user.id },
  });
  if (!memorial) redirect("/dashboard");

  if (!stripe) {
    // Dev fallback: apply plan without Stripe
    const plan = planKey === "LIFETIME" ? "LIFETIME" : "PREMIUM";
    await prisma.memorial.update({
      where: { id: memorialId },
      data: { plan },
    });
    revalidatePath(`/dashboard/memorials/${memorialId}`);
    redirect(`/dashboard/memorials/${memorialId}?upgraded=1`);
  }

  const priceId = getPriceId(planKey);
  if (!priceId) redirect(`/dashboard/memorials/${memorialId}?error=price`);

  let customerId = (
    await prisma.user.findUnique({ where: { id: session.user.id } })
  )?.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: session.user.email || undefined,
      name: session.user.name || undefined,
      metadata: { userId: session.user.id },
    });
    customerId = customer.id;
    await prisma.user.update({
      where: { id: session.user.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const mode = planKey === "LIFETIME" ? "payment" : "subscription";
  const checkout = await stripe.checkout.sessions.create({
    customer: customerId,
    mode,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.AUTH_URL}/dashboard/memorials/${memorialId}?upgraded=1`,
    cancel_url: `${process.env.AUTH_URL}/dashboard/memorials/${memorialId}`,
    metadata: {
      memorialId,
      planKey,
      userId: session.user.id,
    },
  });

  if (!checkout.url) redirect(`/dashboard/memorials/${memorialId}?error=checkout`);
  redirect(checkout.url);
}
