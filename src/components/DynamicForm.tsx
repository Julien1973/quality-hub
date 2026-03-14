"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Clock, Calendar, RotateCcw, Minus, Plus } from "lucide-react";
import type { FormField } from "@/lib/form-templates";
import StaffSelect from "./StaffSelect";

interface DynamicFormProps {
  formId: string;
  departmentId: string;
  departmentName: string;
  formName: string;
  fields: FormField[];
}

// Staff tier type matching roster-parser
type StaffTier = "ho" | "registrar" | "smo" | "consultant" | "all";

// Non-doctor staff roles — these should NOT use the doctor roster dropdown
const NON_DOCTOR_PREFIXES = [
  "rn", "ena", "ecgtech", "pca", "emt", "attendant", "cro", "clerk",
  "nurse", "porter", "security", "housekeeper", "pharmacist",
];

// Determine which staff tier a field should show (null = no staff dropdown)
function getStaffTier(fieldName: string): StaffTier | null {
  const lower = fieldName.toLowerCase();

  // Exclude non-doctor staff fields — they're not on the doctor roster
  for (const prefix of NON_DOCTOR_PREFIXES) {
    if (lower.startsWith(prefix)) return null;
  }

  // House Officers fields
  if (lower.includes("hosrostered") || lower === "hosabsent") return "ho";

  // Registrar fields
  if (lower.includes("regrostered") || lower === "regabsent") return "registrar";

  // Consultant fields
  if (lower.includes("consultant")) return "consultant";

  // First contact physician = registrar tier (SMO/Reg)
  if (lower.includes("firstcontactphysician")) return "registrar";

  // OBSGYN = registrar tier
  if (lower.includes("obsgyn")) return "registrar";

  // Generic doctor fields — show all doctors
  if (
    lower.includes("physician") ||
    lower.includes("preparedby") ||
    lower.includes("givenby") ||
    lower.includes("staffinfogiven") ||
    lower.includes("pendingadmissionsinfo") ||
    lower.includes("infogivenby")
  ) {
    return "all";
  }

  return null;
}

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function formatTime(d: Date): string {
  return d.toTimeString().slice(0, 5);
}

export default function DynamicForm({ formId, departmentId, departmentName, formName, fields }: DynamicFormProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [formData, setFormData] = useState<Record<string, string | number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loadingPrevious, setLoadingPrevious] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  // Roster staff data
  const [staffNames, setStaffNames] = useState<string[]>([]);
  const [groupedStaff, setGroupedStaff] = useState<Record<string, string[]>>({});
  const [onDutyNames, setOnDutyNames] = useState<string[]>([]);
  const [hasRoster, setHasRoster] = useState(false);

  // Initialize form with smart defaults
  const initializeForm = useCallback(() => {
    const initial: Record<string, string | number> = {};
    const now = new Date();

    for (const field of fields) {
      if (field.type === "section") continue;

      if (field.type === "date") {
        initial[field.name] = formatDate(now);
      } else if (field.type === "time") {
        initial[field.name] = formatTime(now);
      } else if (
        (field.name === "preparedBy" || field.name === "infoGivenBy") &&
        session?.user?.name
      ) {
        initial[field.name] = session.user.name;
      } else if (field.defaultValue !== undefined) {
        initial[field.name] = field.defaultValue;
      }
    }
    return initial;
  }, [fields, session]);

  useEffect(() => {
    setFormData(initializeForm());
  }, [initializeForm]);

  // Load roster staff
  useEffect(() => {
    const dayOfMonth = new Date().getDate();
    fetch(`/api/roster/staff?department=${encodeURIComponent(departmentName)}&day=${dayOfMonth}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.hasRoster) {
          setHasRoster(true);
          // Use allNames for generic staff fields, department staff for department-specific
          const deptStaffNames = data.staff?.map((s: { name: string }) => s.name) || [];
          const allNames = data.allNames || [];
          // Combine dept + all for a comprehensive list
          setStaffNames([...new Set([...deptStaffNames, ...allNames])].sort());
          setOnDutyNames(data.onDuty || []);
          // Store grouped staff by tier
          if (data.grouped) {
            setGroupedStaff(data.grouped);
          }
        }
      })
      .catch(() => {});
  }, [departmentName]);

  // Check if previous submission exists
  useEffect(() => {
    fetch(`/api/submissions/previous?formId=${formId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.data) setHasPrevious(true);
      })
      .catch(() => {});
  }, [formId]);

  const loadPrevious = async () => {
    setLoadingPrevious(true);
    try {
      const res = await fetch(`/api/submissions/previous?formId=${formId}`);
      const result = await res.json();
      if (result.data) {
        const prev = JSON.parse(result.data);
        const now = new Date();
        const merged = { ...prev };
        for (const field of fields) {
          if (field.type === "date") merged[field.name] = formatDate(now);
          else if (field.type === "time") merged[field.name] = formatTime(now);
        }
        setFormData(merged);
      }
    } catch {
      // ignore
    } finally {
      setLoadingPrevious(false);
    }
  };

  const handleChange = (name: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNumberStep = (name: string, step: number) => {
    setFormData((prev) => {
      const current = Number(prev[name]) || 0;
      const next = Math.max(0, current + step);
      return { ...prev, [name]: next };
    });
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
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-5">
      {/* Top toolbar */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 bg-blue-50 rounded-lg p-3">
        <Calendar className="h-3.5 w-3.5 text-blue-500" />
        <span>{new Date().toLocaleDateString("en-TT", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
        <span className="text-gray-300">|</span>
        <Clock className="h-3.5 w-3.5 text-blue-500" />
        <span>Auto-filled</span>
        {hasRoster && (
          <>
            <span className="text-gray-300">|</span>
            <span className="text-green-600 font-medium">Roster loaded</span>
          </>
        )}
        {hasPrevious && (
          <button
            type="button"
            onClick={loadPrevious}
            disabled={loadingPrevious}
            className="ml-auto inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-blue-200 text-blue-600 rounded-md hover:bg-blue-50 transition-colors text-xs font-medium"
          >
            <RotateCcw className="h-3 w-3" />
            {loadingPrevious ? "Loading..." : "Copy Previous"}
          </button>
        )}
      </div>

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

        // Use staff dropdown for staff-name fields when roster is loaded
        const tier = getStaffTier(field.name);
        const useStaffDropdown = hasRoster && (field.type === "text" || field.type === "textarea") && tier !== null;

        // Get the right staff list for this field's tier
        let fieldStaffNames = staffNames;
        if (useStaffDropdown && tier !== "all") {
          const tierNames = groupedStaff[tier] || [];
          // For registrar tier, also include SMOs (they're often grouped)
          if (tier === "registrar") {
            fieldStaffNames = [...new Set([...tierNames, ...(groupedStaff["smo"] || [])])].sort();
          } else if (tier === "consultant") {
            // Consultants may also include SMOs
            fieldStaffNames = [...new Set([...tierNames, ...(groupedStaff["smo"] || [])])].sort();
          } else {
            fieldStaffNames = tierNames.sort();
          }
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

            {useStaffDropdown ? (
              <StaffSelect
                id={field.name}
                value={String(formData[field.name] ?? "")}
                onChange={(val) => handleChange(field.name, val)}
                staffNames={fieldStaffNames}
                defaultNames={onDutyNames}
                placeholder={field.placeholder || "Search staff..."}
                required={field.required}
              />
            ) : field.type === "date" ? (
              <input
                id={field.name}
                name={field.name}
                type="date"
                value={String(formData[field.name] ?? "")}
                onChange={(e) => handleChange(field.name, e.target.value)}
                required={field.required}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            ) : field.type === "time" ? (
              <input
                id={field.name}
                name={field.name}
                type="time"
                value={String(formData[field.name] ?? "")}
                onChange={(e) => handleChange(field.name, e.target.value)}
                required={field.required}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            ) : field.type === "textarea" ? (
              <div>
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
                <div className="flex gap-1.5 mt-1">
                  {["Nil", "N/A", "Nil reported"].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleChange(field.name, val)}
                      className="px-2 py-0.5 text-xs bg-gray-100 text-gray-500 rounded hover:bg-gray-200 transition-colors"
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            ) : field.type === "select" ? (
              <select
                id={field.name}
                name={field.name}
                value={formData[field.name] ?? ""}
                onChange={(e) => handleChange(field.name, e.target.value)}
                required={field.required}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="">Select...</option>
                {field.options?.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : field.type === "number" ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleNumberStep(field.name, -1)}
                  className="flex-shrink-0 w-10 h-10 flex items-center justify-center border border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 active:bg-gray-200 transition-colors"
                  aria-label={`Decrease ${field.label}`}
                >
                  <Minus className="h-4 w-4 text-gray-600" />
                </button>
                <input
                  id={field.name}
                  name={field.name}
                  type="number"
                  value={formData[field.name] ?? ""}
                  onChange={(e) => handleChange(field.name, e.target.value ? Number(e.target.value) : "")}
                  placeholder={field.placeholder}
                  required={field.required}
                  min={0}
                  className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-center"
                />
                <button
                  type="button"
                  onClick={() => handleNumberStep(field.name, 1)}
                  className="flex-shrink-0 w-10 h-10 flex items-center justify-center border border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 active:bg-gray-200 transition-colors"
                  aria-label={`Increase ${field.label}`}
                >
                  <Plus className="h-4 w-4 text-gray-600" />
                </button>
              </div>
            ) : (
              <div>
                <input
                  id={field.name}
                  name={field.name}
                  type="text"
                  value={formData[field.name] ?? ""}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  required={field.required}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
                {(field.name.toLowerCase().includes("absent") ||
                  field.name.toLowerCase().includes("issue")) && (
                  <div className="flex gap-1.5 mt-1">
                    {["Nil", "N/A"].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handleChange(field.name, val)}
                        className="px-2 py-0.5 text-xs bg-gray-100 text-gray-500 rounded hover:bg-gray-200 transition-colors"
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                )}
              </div>
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
