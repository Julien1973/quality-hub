"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  ClipboardList,
  FileText,
  Users,
  AlertTriangle,
  TrendingUp,
  Clock,
} from "lucide-react";
import type { PieLabelRenderProps } from "recharts";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface DashboardData {
  totalSubmissions: number;
  todaySubmissions: number;
  totalForms: number;
  totalAgents: number;
  submissionsByDepartment: { department: string; count: number }[];
  recentSubmissions: {
    id: string;
    createdAt: string;
    agent: { name: string };
    form: { name: string };
    department: { name: string };
  }[];
  issues: {
    department: string;
    issue: string;
    date: string;
    form: string;
  }[];
}

const COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
  "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1",
];

export default function DashboardPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard?days=7")
      .then((res) => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!data) return <p className="text-gray-500">Failed to load dashboard data.</p>;

  const stats = [
    {
      name: "Today's Submissions",
      value: data.todaySubmissions,
      icon: TrendingUp,
      color: "bg-blue-500",
    },
    {
      name: "This Week",
      value: data.totalSubmissions,
      icon: FileText,
      color: "bg-green-500",
    },
    {
      name: "Active Forms",
      value: data.totalForms,
      icon: ClipboardList,
      color: "bg-purple-500",
    },
    {
      name: "Active Agents",
      value: data.totalAgents,
      icon: Users,
      color: "bg-orange-500",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Welcome back, {session?.user?.name}. Here&apos;s your quality overview.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.name}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-xl`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart - Submissions by Department */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Submissions by Department</h2>
          {data.submissionsByDepartment.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.submissionsByDepartment} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="department" type="category" width={120} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-center py-12">No submissions yet this week</p>
          )}
        </div>

        {/* Pie Chart - Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Department Distribution</h2>
          {data.submissionsByDepartment.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.submissionsByDepartment}
                  dataKey="count"
                  nameKey="department"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, value }: PieLabelRenderProps) => `${name || ""}: ${value || 0}`}
                  labelLine={false}
                >
                  {data.submissionsByDepartment.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-center py-12">No data to display</p>
          )}
        </div>
      </div>

      {/* Issues & Recent Submissions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Issues */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-gray-900">Reported Issues</h2>
          </div>
          {data.issues.length > 0 ? (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {data.issues.map((issue, i) => (
                <div key={i} className="border-l-4 border-amber-400 pl-3 py-2">
                  <p className="text-sm font-medium text-gray-900">{issue.department}</p>
                  <p className="text-sm text-gray-600 mt-0.5">{issue.issue.substring(0, 150)}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(issue.date).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">No issues reported this week</p>
          )}
        </div>

        {/* Recent Submissions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-gray-900">Recent Submissions</h2>
          </div>
          {data.recentSubmissions.length > 0 ? (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {data.recentSubmissions.map((sub) => (
                <div key={sub.id} className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-blue-700">
                      {sub.agent.name.split(" ").map((n) => n[0]).join("")}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{sub.form.name}</p>
                    <p className="text-xs text-gray-500">
                      {sub.agent.name} &middot; {sub.department.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(sub.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">No submissions yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
