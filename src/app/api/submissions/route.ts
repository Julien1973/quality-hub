import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { formId, departmentId, data, date, reportTime, preparedBy } = body;

  const submission = await prisma.submission.create({
    data: {
      agentId: session.user.id,
      formId,
      departmentId,
      data: JSON.stringify(data),
      date: new Date(date),
      reportTime,
      preparedBy,
    },
  });

  // Update assignment status if exists
  const today = new Date(date);
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  await prisma.assignment.updateMany({
    where: {
      agentId: session.user.id,
      formId,
      date: { gte: today, lt: tomorrow },
    },
    data: { status: "COMPLETED" },
  });

  return NextResponse.json(submission, { status: 201 });
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const departmentId = searchParams.get("departmentId");
  const formId = searchParams.get("formId");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  const where: Record<string, unknown> = {};

  // Agents can only see their own submissions
  if (session.user.role === "AGENT") {
    where.agentId = session.user.id;
  }

  if (departmentId) where.departmentId = departmentId;
  if (formId) where.formId = formId;
  if (startDate || endDate) {
    where.date = {};
    if (startDate) (where.date as Record<string, unknown>).gte = new Date(startDate);
    if (endDate) (where.date as Record<string, unknown>).lte = new Date(endDate);
  }

  const [submissions, total] = await Promise.all([
    prisma.submission.findMany({
      where,
      include: {
        agent: { select: { name: true, email: true } },
        form: { select: { name: true, slug: true } },
        department: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.submission.count({ where }),
  ]);

  return NextResponse.json({ submissions, total, page, limit });
}
