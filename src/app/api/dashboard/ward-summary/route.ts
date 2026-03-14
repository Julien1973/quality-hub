import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get all departments with their latest submission
  const departments = await prisma.department.findMany({
    include: {
      submissions: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          agent: { select: { name: true } },
          form: { select: { name: true } },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const wardSummary = departments.map((dept) => {
    const latestSubmission = dept.submissions[0];
    let data: Record<string, unknown> = {};
    if (latestSubmission) {
      try {
        data = JSON.parse(latestSubmission.data);
      } catch {
        // skip
      }
    }

    return {
      department: dept.name,
      block: dept.block,
      category: dept.category,
      hasData: !!latestSubmission,
      lastUpdated: latestSubmission?.createdAt || null,
      updatedBy: latestSubmission?.agent?.name || null,
      bedsAvailable: data.bedsAvailable ?? null,
      bedCapacity: data.bedCapacity ?? null,
      staffing: data.staffing ?? null,
      issues: data.issues || data.departmentalIssues || null,
      pendingAdmissions: data.pendingAdmissions ?? data.pendingTotal ?? null,
      pendingDischarges: data.pendingDischarges ?? null,
    };
  });

  return NextResponse.json(wardSummary);
}
