import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const memorial = await prisma.memorial.findUnique({ where: { slug } });
  if (!memorial) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const form = await request.formData();
  const password = String(form.get("password") || "");
  if (!memorial.accessPassword || password !== memorial.accessPassword) {
    return NextResponse.redirect(
      new URL(`/memorials/${slug}?error=password`, request.url),
    );
  }

  const jar = await cookies();
  jar.set(`memorial_access_${memorial.id}`, "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return NextResponse.redirect(new URL(`/memorials/${slug}`, request.url));
}
