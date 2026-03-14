"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { FileText, Filter, ChevronDown, ChevronUp, Eye } from "lucide-react";

interface Submission {
  id: string;
  data: string;
  date: string;
  reportTime?: string;
  preparedBy?: string;
  createdAt: string;
  agent: { name: string; email: string };
  form: { name: string; slug: string };
  department: { name: string };
}

export default function SubmissionsPage() {
  const { data: session } = useSession();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/submissions?page=${page}&limit=15`)
      .then((res) => res.json())
      .then((data) => {
        setSubmissions(data.submissions);
        setTotal(data.total);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page]);

  const totalPages = Math.ceil(total / 15);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const renderFormData = (dataStr: string) => {
    try {
      const data = JSON.parse(dataStr);
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-gray-50 rounded-lg">
          {Object.entries(data).map(([key, value]) => (
            <div key={key}>
              <span className="text-xs font-medium text-gray-500 uppercase">
                {key.replace(/([A-Z])/g, " $1").trim()}
              </span>
              <p className="text-sm text-gray-900 mt-0.5 whitespace-pre-wrap">
                {String(value || "-")}
              </p>
            </div>
          ))}
        </div>
      );
    } catch {
      return <p className="text-sm text-gray-500">Unable to display data</p>;
    }
  };

  if (loading && submissions.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Submissions</h1>
        <p className="text-gray-500 mt-1">
          {session?.user?.role === "AGENT"
            ? "View your submitted reports"
            : `All submitted reports (${total} total)`}
        </p>
      </div>

      {submissions.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No submissions yet</h3>
          <p className="text-gray-500 mt-1">Start by filling out a form from the Forms page.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {submissions.map((sub) => (
            <div
              key={sub.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
            >
              <button
                onClick={() => toggleExpand(sub.id)}
                className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="p-2 rounded-lg bg-blue-50">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{sub.form.name}</h3>
                    <p className="text-sm text-gray-500">
                      {sub.department.name} &middot; {sub.agent.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(sub.date).toLocaleDateString()} {sub.reportTime && `at ${sub.reportTime}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <Eye className="h-4 w-4" />
                  {expandedId === sub.id ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </button>

              {expandedId === sub.id && (
                <div className="px-5 pb-5 border-t border-gray-100">
                  <div className="mt-4">
                    {renderFormData(sub.data)}
                  </div>
                  {sub.preparedBy && (
                    <p className="text-xs text-gray-400 mt-3">
                      Prepared by: {sub.preparedBy}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    Submitted: {new Date(sub.createdAt).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Page {page} of {totalPages} ({total} submissions)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 disabled:opacity-50 hover:bg-gray-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 disabled:opacity-50 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
