import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") || "7");
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const [
    totalSubmissions,
    todaySubmissions,
    departmentCounts,
    recentSubmissions,
    totalForms,
    totalAgents,
    issueSubmissions,
  ] = await Promise.all([
    prisma.submission.count({
      where: { date: { gte: startDate } },
    }),
    prisma.submission.count({
      where: {
        date: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),
    prisma.submission.groupBy({
      by: ["departmentId"],
      where: { date: { gte: startDate } },
      _count: true,
    }),
    prisma.submission.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        agent: { select: { name: true } },
        form: { select: { name: true } },
        department: { select: { name: true } },
      },
    }),
    prisma.formTemplate.count({ where: { isActive: true } }),
    prisma.user.count({ where: { role: "AGENT" } }),
    // Get submissions with issues reported
    prisma.submission.findMany({
      where: {
        date: { gte: startDate },
      },
      select: {
        data: true,
        department: { select: { name: true } },
        date: true,
        form: { select: { name: true } },
      },
      orderBy: { date: "desc" },
    }),
  ]);

  // Process department counts
  const departments = await prisma.department.findMany({
    select: { id: true, name: true },
  });
  const deptMap = new Map(departments.map((d) => [d.id, d.name]));
  const submissionsByDepartment = departmentCounts.map((dc) => ({
    department: deptMap.get(dc.departmentId) || "Unknown",
    count: dc._count,
  }));

  // Extract issues from submissions
  const issues: { department: string; issue: string; date: string; form: string }[] = [];
  for (const sub of issueSubmissions) {
    try {
      const data = JSON.parse(sub.data);
      const issueText = data.issues || data.departmentalIssues || "";
      if (issueText && !issueText.match(/^(nil|none|n\/a|nil reported|nil new)/i)) {
        issues.push({
          department: sub.department.name,
          issue: issueText,
          date: sub.date.toISOString(),
          form: sub.form.name,
        });
      }
    } catch {
      // skip invalid JSON
    }
  }

  return NextResponse.json({
    totalSubmissions,
    todaySubmissions,
    totalForms,
    totalAgents,
    submissionsByDepartment,
    recentSubmissions,
    issues: issues.slice(0, 20),
  });
}
