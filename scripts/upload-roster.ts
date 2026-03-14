import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";
import { parseRosterText } from "../src/lib/roster-parser";

const prisma = new PrismaClient();

async function main() {
  const pdfPath = process.argv[2] || "/Users/sean/Library/Mobile Documents/com~apple~CloudDocs/Amended HO & SMO March  2026 Roster - 13.03.2026.pdf";

  console.log("Reading PDF:", pdfPath);

  // Use Python to extract text from PDF
  const pythonScript = `
import PyPDF2, sys, json
reader = PyPDF2.PdfReader(sys.argv[1])
text = ""
for page in reader.pages:
    t = page.extract_text()
    if t:
        text += t + "\\n"
print(text)
`;
  const text = execSync(`python3 -c '${pythonScript}' "${pdfPath}"`, {
    maxBuffer: 10 * 1024 * 1024,
  }).toString();

  console.log("Extracted text length:", text.length);

  const parsed = parseRosterText(text);

  console.log("\nDepartments found:", parsed.departments.length);
  console.log("Schedules found:", parsed.schedules.length);
  console.log("Month:", parsed.month);

  const totalStaff = parsed.departments.reduce(
    (sum, d) => sum + d.roles.reduce((rs, r) => rs + r.staff.length, 0),
    0
  );
  console.log("Total staff:", totalStaff);

  for (const d of parsed.departments) {
    const count = d.roles.reduce((s, r) => s + r.staff.length, 0);
    console.log(`  - ${d.name} (${count} staff, ${d.roles.length} roles)`);
  }

  if (parsed.schedules.length > 0) {
    console.log("\nSchedules:");
    for (const s of parsed.schedules) {
      console.log(`  - ${s.department}: ${s.schedule.length} days`);
    }
  }

  // Deactivate existing
  await prisma.roster.updateMany({
    where: { isActive: true },
    data: { isActive: false },
  });

  // Insert
  await prisma.roster.create({
    data: {
      name: "HO & SMO March 2026 Roster",
      month: parsed.month || "2026-03",
      data: JSON.stringify(parsed),
      uploadedBy: "admin",
      isActive: true,
    },
  });

  console.log("\nRoster saved to database!");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
