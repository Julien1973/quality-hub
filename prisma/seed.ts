import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { departmentTemplates } from "../src/lib/form-templates";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create default users
  const adminPassword = await hash("admin123", 12);
  const supervisorPassword = await hash("super123", 12);
  const agentPassword = await hash("agent123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@sghosp.com" },
    update: {},
    create: {
      name: "System Admin",
      email: "admin@sghosp.com",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  const supervisor = await prisma.user.upsert({
    where: { email: "supervisor@sghosp.com" },
    update: {},
    create: {
      name: "Quality Supervisor",
      email: "supervisor@sghosp.com",
      password: supervisorPassword,
      role: "SUPERVISOR",
    },
  });

  // Create sample agents
  const agents = [];
  const agentNames = [
    "Taron Singh",
    "Sarah Khan",
    "James Ali",
    "Maria Baptiste",
    "Devon Charles",
  ];

  for (const name of agentNames) {
    const email = name.toLowerCase().replace(/\s+/g, ".") + "@sghosp.com";
    const agent = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        name,
        email,
        password: agentPassword,
        role: "AGENT",
      },
    });
    agents.push(agent);
  }

  // Create departments and form templates
  for (const template of departmentTemplates) {
    const department = await prisma.department.upsert({
      where: { name: template.department },
      update: {},
      create: {
        name: template.department,
        block: template.block,
        category: template.category,
      },
    });

    for (const form of template.forms) {
      await prisma.formTemplate.upsert({
        where: { slug: form.slug },
        update: {
          fields: JSON.stringify(form.fields),
        },
        create: {
          name: form.name,
          slug: form.slug,
          description: form.description,
          departmentId: department.id,
          fields: JSON.stringify(form.fields),
        },
      });
    }
  }

  console.log("Seeding complete!");
  console.log(`Created ${agentNames.length} agents, 1 supervisor, 1 admin`);
  console.log(`Created ${departmentTemplates.length} departments with form templates`);
  console.log("\nDefault credentials:");
  console.log("  Admin:      admin@sghosp.com / admin123");
  console.log("  Supervisor: supervisor@sghosp.com / super123");
  console.log("  Agents:     <name>@sghosp.com / agent123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
