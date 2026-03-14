"use client";

import { useEffect, useState } from "react";
import { Bed, Users, AlertCircle, CheckCircle2, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface WardData {
  department: string;
  block: string | null;
  category: string | null;
  hasData: boolean;
  lastUpdated: string | null;
  updatedBy: string | null;
  bedsAvailable: number | null;
  bedCapacity: number | null;
  staffing: string | null;
  issues: string | null;
  pendingAdmissions: number | null;
  pendingDischarges: number | null;
}

export default function WardSummary() {
  const [wards, setWards] = useState<WardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/ward-summary")
      .then((res) => res.json())
      .then(setWards)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-gray-200 rounded w-48" />
          <div className="h-4 bg-gray-100 rounded w-full" />
          <div className="h-4 bg-gray-100 rounded w-full" />
        </div>
      </div>
    );
  }

  const wardDepts = wards.filter((w) => w.category === "Ward" && w.bedsAvailable !== null);
  const totalBeds = wardDepts.reduce((sum, w) => sum + (Number(w.bedCapacity) || 0), 0);
  const totalAvailable = wardDepts.reduce((sum, w) => sum + (Number(w.bedsAvailable) || 0), 0);
  const occupancyRate = totalBeds > 0 ? Math.round(((totalBeds - totalAvailable) / totalBeds) * 100) : 0;

  const staffingIssues = wards.filter(
    (w) => w.staffing && !w.staffing.match(/^sufficient/i)
  );
  const issueWards = wards.filter(
    (w) => w.issues && !String(w.issues).match(/^(nil|none|n\/a|nil reported|nil new|nil at)/i)
  );
  const noDataDepts = wards.filter((w) => !w.hasData);

  return (
    <div className="space-y-6">
      {/* Hospital At-a-Glance */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Hospital At-a-Glance</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <Bed className="h-6 w-6 text-blue-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-blue-700">{totalAvailable}</p>
            <p className="text-xs text-blue-500">Beds Available</p>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-700">{occupancyRate}%</p>
            <p className="text-xs text-purple-500">Occupancy Rate</p>
          </div>
          <div className="text-center p-3 bg-amber-50 rounded-lg">
            <AlertCircle className="h-6 w-6 text-amber-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-amber-700">{staffingIssues.length}</p>
            <p className="text-xs text-amber-500">Staffing Issues</p>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <p className="text-2xl font-bold text-red-700">{issueWards.length}</p>
            <p className="text-xs text-red-500">Depts with Issues</p>
          </div>
        </div>
      </div>

      {/* Ward Status Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Ward & Department Status</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 font-medium text-gray-500">Department</th>
                <th className="text-center py-2 px-3 font-medium text-gray-500">Beds</th>
                <th className="text-center py-2 px-3 font-medium text-gray-500">Staffing</th>
                <th className="text-center py-2 px-3 font-medium text-gray-500">Issues</th>
                <th className="text-right py-2 px-3 font-medium text-gray-500">Updated</th>
              </tr>
            </thead>
            <tbody>
              {wards.map((ward) => (
                <tr key={ward.department} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2.5 px-3">
                    <span className="font-medium text-gray-900">{ward.department}</span>
                    {ward.block && (
                      <span className="text-xs text-gray-400 ml-1">({ward.block})</span>
                    )}
                  </td>
                  <td className="text-center py-2.5 px-3">
                    {ward.bedsAvailable !== null ? (
                      <span className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                        Number(ward.bedsAvailable) === 0
                          ? "bg-red-100 text-red-700"
                          : Number(ward.bedsAvailable) <= 2
                          ? "bg-amber-100 text-amber-700"
                          : "bg-green-100 text-green-700"
                      )}>
                        {ward.bedsAvailable}/{ward.bedCapacity}
                      </span>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                  <td className="text-center py-2.5 px-3">
                    {ward.staffing ? (
                      ward.staffing.match(/^sufficient/i) ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500 mx-auto" />
                      )
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                  <td className="text-center py-2.5 px-3">
                    {ward.issues && !String(ward.issues).match(/^(nil|none|n\/a|nil reported|nil new|nil at)/i) ? (
                      <AlertCircle className="h-4 w-4 text-amber-500 mx-auto" />
                    ) : ward.hasData ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                  <td className="text-right py-2.5 px-3">
                    {ward.lastUpdated ? (
                      <div className="flex items-center justify-end gap-1 text-xs text-gray-400">
                        <Clock className="h-3 w-3" />
                        {new Date(ward.lastUpdated).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-300">No data</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
