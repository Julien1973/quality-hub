import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ParsedRoster } from "@/lib/roster-parser";
import { getStaffByDepartment, getStaffOnDuty } from "@/lib/roster-parser";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const department = req.nextUrl.searchParams.get("department") || "";
  const dayOfMonth = parseInt(req.nextUrl.searchParams.get("day") || "0");

  try {
    const roster = await prisma.roster.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    if (!roster) {
      return NextResponse.json({ staff: [], onDuty: [], hasRoster: false });
    }

    const parsed: ParsedRoster = JSON.parse(roster.data);

    // Get all staff for the department
    const allStaff = getStaffByDepartment(parsed, department);

    // Get staff on duty for specific day
    let onDuty: string[] = [];
    try {
      onDuty = dayOfMonth > 0
        ? getStaffOnDuty(parsed, department, dayOfMonth)
        : [];
    } catch {
      // Schedule data might not be perfectly structured
    }

    // Also get all staff names (for generic fields like "preparedBy")
    const allNames = parsed.departments
      .flatMap(d => d.roles.flatMap(r => r.staff.map(s => s.name)))
      .filter((name, i, arr) => arr.indexOf(name) === i)
      .sort();

    return NextResponse.json({
      staff: allStaff,
      onDuty,
      allNames,
      hasRoster: true,
    });
  } catch (err) {
    console.error("Roster staff API error:", err);
    return NextResponse.json({ staff: [], onDuty: [], hasRoster: false });
  }
}
