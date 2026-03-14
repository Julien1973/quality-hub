import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseRosterText } from "@/lib/roster-parser";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN", "SUPERVISOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const rosterName = formData.get("name") as string || "Staff Roster";
    const month = formData.get("month") as string || new Date().toISOString().slice(0, 7);

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Read PDF and extract text
    const buffer = Buffer.from(await file.arrayBuffer());
    // Dynamic import of pdf-parse
    const pdfParse = (await import("pdf-parse")).default;
    const pdfData = await pdfParse(buffer);
    const text = pdfData.text;

    // Parse the roster text
    const parsed = parseRosterText(text);

    if (parsed.departments.length === 0) {
      return NextResponse.json({ error: "Could not parse any departments from the PDF" }, { status: 400 });
    }

    // Deactivate previous rosters
    await prisma.roster.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    // Save the new roster
    const roster = await prisma.roster.create({
      data: {
        name: rosterName,
        month,
        data: JSON.stringify(parsed),
        uploadedBy: session.user.id,
        isActive: true,
      },
    });

    const totalStaff = parsed.departments.reduce(
      (sum, d) => sum + d.roles.reduce((rs, r) => rs + r.staff.length, 0),
      0
    );

    return NextResponse.json({
      id: roster.id,
      departments: parsed.departments.length,
      totalStaff,
      parsed,
    });
  } catch (err) {
    console.error("Roster upload error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to parse roster" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get the active roster
  const roster = await prisma.roster.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });

  if (!roster) {
    return NextResponse.json({ data: null });
  }

  return NextResponse.json({
    id: roster.id,
    name: roster.name,
    month: roster.month,
    data: JSON.parse(roster.data),
    createdAt: roster.createdAt,
  });
}
