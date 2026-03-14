import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formId = req.nextUrl.searchParams.get("formId");
  if (!formId) {
    return NextResponse.json({ error: "formId required" }, { status: 400 });
  }

  // Get the most recent submission for this form by this agent
  const previous = await prisma.submission.findFirst({
    where: {
      formId,
      agentId: session.user.id,
    },
    orderBy: { createdAt: "desc" },
    select: { data: true, createdAt: true },
  });

  if (!previous) {
    return NextResponse.json({ data: null });
  }

  return NextResponse.json({
    data: previous.data,
    createdAt: previous.createdAt,
  });
}
