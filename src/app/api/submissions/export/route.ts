import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface FormField {
  name: string;
  label: string;
  type: string;
}

/**
 * Escapes a value for safe inclusion in a CSV cell.
 * Wraps in double quotes if the value contains commas, quotes, or newlines.
 * Doubles any existing double-quote characters per RFC 4180.
 */
function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return "";

  const str = String(value);

  if (str.includes('"') || str.includes(",") || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { searchParams } = new URL(req.url);
  const departmentId = searchParams.get("departmentId");
  const formId = searchParams.get("formId");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  // Build the where clause
  const where: Record<string, unknown> = {};

  // Agents can only export their own submissions
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

  // Fetch submissions with related data
  const submissions = await prisma.submission.findMany({
    where,
    include: {
      agent: { select: { name: true, email: true } },
      form: { select: { name: true, slug: true, fields: true } },
      department: { select: { name: true } },
    },
    orderBy: { date: "desc" },
  });

  // Collect all unique form field definitions across the result set.
  // When submissions span multiple forms, we merge all fields in the order they appear.
  const fieldMap = new Map<string, string>(); // name -> label
  const fieldOrder: string[] = [];

  for (const submission of submissions) {
    try {
      const fields: FormField[] = JSON.parse(submission.form.fields);
      for (const field of fields) {
        if (!fieldMap.has(field.name)) {
          fieldMap.set(field.name, field.label);
          fieldOrder.push(field.name);
        }
      }
    } catch {
      // If field definitions can't be parsed, skip
    }
  }

  // Build CSV header row
  const staticHeaders = ["Agent Name", "Department", "Form", "Date", "Report Time", "Prepared By"];
  const dynamicHeaders = fieldOrder.map((name) => fieldMap.get(name) || name);
  const headers = [...staticHeaders, ...dynamicHeaders];

  const rows: string[] = [];
  rows.push(headers.map(escapeCsvValue).join(","));

  // Build a CSV row for each submission
  for (const submission of submissions) {
    let dataObj: Record<string, unknown> = {};
    try {
      dataObj = JSON.parse(submission.data);
    } catch {
      // If data can't be parsed, leave fields empty
    }

    const formattedDate = submission.date
      ? new Date(submission.date).toISOString().split("T")[0]
      : "";

    const staticValues = [
      submission.agent.name,
      submission.department.name,
      submission.form.name,
      formattedDate,
      submission.reportTime || "",
      submission.preparedBy || "",
    ];

    const dynamicValues = fieldOrder.map((fieldName) => {
      const value = dataObj[fieldName];

      // Handle arrays (e.g. multi-select, checkboxes)
      if (Array.isArray(value)) {
        return value.join("; ");
      }

      return value ?? "";
    });

    rows.push([...staticValues, ...dynamicValues].map(escapeCsvValue).join(","));
  }

  const csv = rows.join("\r\n");

  // Generate a descriptive filename
  const timestamp = new Date().toISOString().split("T")[0];
  const filename = `submissions-export-${timestamp}.csv`;

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
