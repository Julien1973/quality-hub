"use client";

import { useState, useEffect } from "react";
import { Upload, FileText, Users, CheckCircle2, Building2 } from "lucide-react";

interface RosterInfo {
  id: string;
  name: string;
  month: string;
  createdAt: string;
  data: {
    departments: {
      name: string;
      roles: { title: string; staff: { name: string; phone: string }[] }[];
    }[];
    schedules: {
      department: string;
      schedule: { day: number; staffNames: string[] }[];
    }[];
  };
}

export default function RosterPage() {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [currentRoster, setCurrentRoster] = useState<RosterInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/roster")
      .then((res) => res.json())
      .then((data) => {
        if (data.id) setCurrentRoster(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploading(true);
    setError("");
    setResult(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const res = await fetch("/api/roster", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setResult(`Roster uploaded successfully! Found ${data.departments} departments and ${data.totalStaff} staff members.`);

      // Reload current roster
      const rosterRes = await fetch("/api/roster");
      const rosterData = await rosterRes.json();
      if (rosterData.id) setCurrentRoster(rosterData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Staff Roster</h1>
        <p className="text-sm text-gray-500 mt-1">
          Upload a roster PDF to populate staff dropdowns in forms
        </p>
      </div>

      {/* Upload Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Upload className="h-5 w-5 text-blue-600" />
          Upload Roster
        </h2>

        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Roster Name
            </label>
            <input
              name="name"
              type="text"
              defaultValue={`Staff Roster - ${new Date().toLocaleString("en-US", { month: "long", year: "numeric" })}`}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Month
            </label>
            <input
              name="month"
              type="month"
              defaultValue={new Date().toISOString().slice(0, 7)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Roster PDF
            </label>
            <input
              name="file"
              type="file"
              accept=".pdf"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {result && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              {result}
            </div>
          )}

          <button
            type="submit"
            disabled={uploading}
            className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {uploading ? "Parsing PDF..." : "Upload & Parse Roster"}
          </button>
        </form>
      </div>

      {/* Current Roster Info */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-6 bg-gray-200 rounded w-48" />
            <div className="h-4 bg-gray-100 rounded w-full" />
          </div>
        </div>
      ) : currentRoster ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-600" />
              Active Roster
            </h2>
            <span className="text-xs text-gray-400">
              Uploaded {new Date(currentRoster.createdAt).toLocaleDateString()}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <Building2 className="h-5 w-5 text-blue-600 mx-auto mb-1" />
              <p className="text-xl font-bold text-blue-700">
                {currentRoster.data.departments.length}
              </p>
              <p className="text-xs text-blue-500">Departments</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <Users className="h-5 w-5 text-green-600 mx-auto mb-1" />
              <p className="text-xl font-bold text-green-700">
                {currentRoster.data.departments.reduce(
                  (sum, d) => sum + d.roles.reduce((rs, r) => rs + r.staff.length, 0),
                  0
                )}
              </p>
              <p className="text-xs text-green-500">Staff Members</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 text-center">
              <p className="text-xl font-bold text-purple-700">
                {currentRoster.data.schedules?.length || 0}
              </p>
              <p className="text-xs text-purple-500">Dept Schedules</p>
            </div>
          </div>

          {/* Department breakdown */}
          <div className="space-y-3">
            {currentRoster.data.departments.map((dept) => (
              <details key={dept.name} className="group">
                <summary className="flex items-center justify-between cursor-pointer py-2 px-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <span className="font-medium text-sm text-gray-800">{dept.name}</span>
                  <span className="text-xs text-gray-400">
                    {dept.roles.reduce((s, r) => s + r.staff.length, 0)} staff
                  </span>
                </summary>
                <div className="mt-1 pl-4 space-y-2">
                  {dept.roles.map((role) => (
                    <div key={role.title} className="text-sm">
                      <p className="font-medium text-gray-600 text-xs uppercase tracking-wide">
                        {role.title}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {role.staff.map((s) => (
                          <span
                            key={s.name}
                            className="inline-block px-2 py-0.5 bg-white border border-gray-200 rounded text-xs text-gray-700"
                          >
                            {s.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 p-8 text-center">
          <Upload className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No roster uploaded yet</p>
          <p className="text-xs text-gray-400 mt-1">
            Upload a roster PDF above to populate staff dropdowns in forms
          </p>
        </div>
      )}
    </div>
  );
}
