import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@luhyf.local" },
    update: {},
    create: {
      email: "admin@luhyf.local",
      name: "Platform Admin",
      passwordHash,
      role: "ADMIN",
    },
  });

  const client = await prisma.user.upsert({
    where: { email: "family@luhyf.local" },
    update: {},
    create: {
      email: "family@luhyf.local",
      name: "Alex Family",
      passwordHash,
      role: "CLIENT",
    },
  });

  await prisma.memorial.upsert({
    where: { slug: "jordan-ellis" },
    update: {},
    create: {
      slug: "jordan-ellis",
      firstName: "Jordan",
      lastName: "Ellis",
      biography:
        "Jordan loved mornings by the water, jazz records, and gathering neighbors for long conversations.",
      serviceInfo: "Celebration of life — Saturday 2pm at Riverside Chapel.",
      theme: "serene",
      privacy: "PUBLIC",
      plan: "PREMIUM",
      featured: true,
      ownerId: client.id,
      coverImageUrl:
        "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1600&q=80",
      members: { create: { userId: client.id, role: "EDITOR" } },
    },
  });

  console.log("Seeded", { admin: admin.email, client: client.email });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
