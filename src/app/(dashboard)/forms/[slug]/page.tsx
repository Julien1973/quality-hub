import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import DynamicForm from "@/components/DynamicForm";
import { ArrowLeft, Building2 } from "lucide-react";
import Link from "next/link";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function FormPage({ params }: Props) {
  const { slug } = await params;

  const form = await prisma.formTemplate.findUnique({
    where: { slug },
    include: {
      department: { select: { id: true, name: true, block: true } },
    },
  });

  if (!form) return notFound();

  const fields = JSON.parse(form.fields);

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/forms"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Forms
      </Link>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h1 className="text-xl font-bold text-gray-900">{form.name}</h1>
        <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
          <Building2 className="h-4 w-4" />
          <span>{form.department.name}</span>
          {form.department.block && (
            <span className="text-gray-400">- {form.department.block}</span>
          )}
        </div>
        {form.description && (
          <p className="text-sm text-gray-400 mt-2">{form.description}</p>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <DynamicForm
          formId={form.id}
          departmentId={form.department.id}
          formName={form.name}
          fields={fields}
        />
      </div>
    </div>
  );
}
