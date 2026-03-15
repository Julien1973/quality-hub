import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ParsedRoster, StaffMember } from "@/lib/roster-parser";
import { getStaffByDepartment, getStaffByDepartmentGrouped, getStaffOnDuty } from "@/lib/roster-parser";

// Match a short/last name from the schedule against the full staff list
function matchName(shortName: string, staffList: StaffMember[]): string | null {
  const lower = shortName.toLowerCase().trim();
  if (lower.length < 2) return null;
  for (const s of staffList) {
    const parts = s.name.split(" ");
    const lastName = parts[parts.length - 1].toLowerCase();
    if (lastName === lower || s.name.toLowerCase().includes(lower)) {
      return s.name;
    }
  }
  return null;
}

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

    // Get staff grouped by tier (ho, registrar, smo, consultant)
    const grouped = getStaffByDepartmentGrouped(parsed, department);

    // Get staff on duty for specific day
    let onDuty: string[] = [];
    try {
      onDuty = dayOfMonth > 0
        ? getStaffOnDuty(parsed, department, dayOfMonth)
        : [];
    } catch {
      // Schedule data might not be perfectly structured
    }

    // Cross-reference on-duty names with tier-classified staff to get on-duty by role
    const onDutyByTier: Record<string, string[]> = {
      ho: [],
      registrar: [],
      smo: [],
      consultant: [],
      other: [],
    };

    for (const dutyName of onDuty) {
      let matched = false;
      // Check each tier
      for (const tier of ["ho", "registrar", "smo", "consultant"] as const) {
        const tierMatch = matchName(dutyName, grouped[tier]);
        if (tierMatch) {
          if (!onDutyByTier[tier].includes(tierMatch)) {
            onDutyByTier[tier].push(tierMatch);
          }
          matched = true;
          break;
        }
      }
      if (!matched) {
        // Check "other" tier or just add to other
        const otherMatch = matchName(dutyName, grouped.other);
        if (otherMatch) {
          if (!onDutyByTier.other.includes(otherMatch)) {
            onDutyByTier.other.push(otherMatch);
          }
        } else {
          // Unmatched — add raw name to other
          if (!onDutyByTier.other.includes(dutyName)) {
            onDutyByTier.other.push(dutyName);
          }
        }
      }
    }

    // Also get all staff names (for generic fields like "preparedBy")
    const allNames = parsed.departments
      .flatMap(d => d.roles.flatMap(r => r.staff.map(s => s.name)))
      .filter((name, i, arr) => arr.indexOf(name) === i)
      .sort();

    return NextResponse.json({
      staff: allStaff,
      grouped: {
        ho: grouped.ho.map(s => s.name),
        registrar: grouped.registrar.map(s => s.name),
        smo: grouped.smo.map(s => s.name),
        consultant: grouped.consultant.map(s => s.name),
      },
      onDuty,
      onDutyByTier,
      allNames,
      hasRoster: true,
    });
  } catch (err) {
    console.error("Roster staff API error:", err);
    return NextResponse.json({ staff: [], onDuty: [], hasRoster: false });
  }
}
