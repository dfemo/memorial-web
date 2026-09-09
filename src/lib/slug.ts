import slugify from "slugify";
import { prisma } from "@/lib/prisma";

export async function uniqueMemorialSlug(firstName: string, lastName: string) {
  const base =
    slugify(`${firstName}-${lastName}`, { lower: true, strict: true }) || "memorial";
  let slug = base;
  let i = 1;
  while (await prisma.memorial.findUnique({ where: { slug } })) {
    slug = `${base}-${i++}`;
  }
  return slug;
}
