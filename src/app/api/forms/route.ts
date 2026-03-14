import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const forms = await prisma.formTemplate.findMany({
    where: { isActive: true },
    include: {
      department: { select: { name: true, block: true, category: true } },
      _count: { select: { submissions: true } },
    },
    orderBy: { department: { name: "asc" } },
  });

  return NextResponse.json(forms);
}
