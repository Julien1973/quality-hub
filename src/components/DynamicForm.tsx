"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { FormField } from "@/lib/form-templates";

interface DynamicFormProps {
  formId: string;
  departmentId: string;
  formName: string;
  fields: FormField[];
}

export default function DynamicForm({ formId, departmentId, formName, fields }: DynamicFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<Record<string, string | number>>(() => {
    const initial: Record<string, string | number> = {};
    for (const field of fields) {
      if (field.type !== "section" && field.defaultValue !== undefined) {
        initial[field.name] = field.defaultValue;
      }
    }
    return initial;
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (name: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formId,
          departmentId,
          data: formData,
          date: new Date().toISOString(),
          reportTime: formData.reportTime || undefined,
          preparedBy: formData.preparedBy || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit");
      }

      setSuccess(true);
      setTimeout(() => router.push("/forms"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
          <div className="text-green-600 text-5xl mb-4">&#10003;</div>
          <h2 className="text-xl font-semibold text-green-800 mb-2">Submitted Successfully</h2>
          <p className="text-green-600">Your {formName} report has been recorded.</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {fields.map((field) => {
        if (field.type === "section") {
          return (
            <div key={field.name} className="pt-6 pb-2 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">{field.label}</h3>
            </div>
          );
        }

        return (
          <div key={field.name}>
            <label
              htmlFor={field.name}
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>

            {field.type === "textarea" ? (
              <textarea
                id={field.name}
                name={field.name}
                value={formData[field.name] ?? ""}
                onChange={(e) => handleChange(field.name, e.target.value)}
                placeholder={field.placeholder}
                required={field.required}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            ) : field.type === "select" ? (
              <select
                id={field.name}
                name={field.name}
                value={formData[field.name] ?? ""}
                onChange={(e) => handleChange(field.name, e.target.value)}
                required={field.required}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="">Select...</option>
                {field.options?.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : field.type === "number" ? (
              <input
                id={field.name}
                name={field.name}
                type="number"
                value={formData[field.name] ?? ""}
                onChange={(e) => handleChange(field.name, e.target.value ? Number(e.target.value) : "")}
                placeholder={field.placeholder}
                required={field.required}
                min={0}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            ) : (
              <input
                id={field.name}
                name={field.name}
                type="text"
                value={formData[field.name] ?? ""}
                onChange={(e) => handleChange(field.name, e.target.value)}
                placeholder={field.placeholder}
                required={field.required}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            )}
          </div>
        );
      })}

      <div className="pt-4 border-t border-gray-200">
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? "Submitting..." : "Submit Report"}
        </button>
      </div>
    </form>
  );
}
