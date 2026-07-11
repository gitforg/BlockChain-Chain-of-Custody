const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  const users = [
    {
      email: "admin@evidencechain.com",
      username: "admin",
      role: "Administrator",
    },
    {
      email: "forensics@evidencechain.com",
      username: "forensics",
      role: "Forensic Lab",
    },
    {
      email: "officer@evidencechain.com",
      username: "officer",
      role: "Intake Officer",
    },
    {
      email: "court@evidencechain.com",
      username: "court",
      role: "Court Clerk",
    },
    {
      email: "officer.vance@evidencechain.com",
      username: "vance",
      role: "Intake Officer",
    },
    {
      email: "analyst.croft@evidencechain.com",
      username: "croft",
      role: "Forensic Lab",
    },
    {
      email: "clerk.lee@evidencechain.com",
      username: "lee",
      role: "Court Clerk",
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: { role: user.role, username: user.username },
      create: user,
    });
  }

  console.log(`✅ Successfully seeded ${users.length} users.`);
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
