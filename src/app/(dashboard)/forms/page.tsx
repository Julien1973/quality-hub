"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ClipboardList,
  Building2,
  FileText,
  Search,
} from "lucide-react";

interface FormTemplate {
  id: string;
  name: string;
  slug: string;
  description: string;
  department: { name: string; block: string; category: string };
  _count: { submissions: number };
}

export default function FormsPage() {
  const [forms, setForms] = useState<FormTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    fetch("/api/forms")
      .then((res) => res.json())
      .then(setForms)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const categories = ["all", ...Array.from(new Set(forms.map((f) => f.department.category)))];

  const filtered = forms.filter((f) => {
    const matchesSearch =
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.department.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || f.department.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Group by department category
  const grouped = filtered.reduce<Record<string, FormTemplate[]>>((acc, form) => {
    const cat = form.department.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(form);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Data Collection Forms</h1>
        <p className="text-gray-500 mt-1">Select a form to fill out your daily report</p>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search forms or departments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                categoryFilter === cat
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              {cat === "all" ? "All" : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Form Cards grouped by category */}
      {Object.entries(grouped).map(([category, categoryForms]) => (
        <div key={category}>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            {category}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryForms.map((form) => (
              <Link
                key={form.id}
                href={`/forms/${form.slug}`}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md hover:border-blue-300 transition-all group"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-colors">
                    <ClipboardList className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                      {form.name}
                    </h3>
                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                      <Building2 className="h-3 w-3" />
                      <span>{form.department.name}</span>
                      {form.department.block && (
                        <span className="text-gray-400">({form.department.block})</span>
                      )}
                    </div>
                    {form.description && (
                      <p className="text-xs text-gray-400 mt-2 line-clamp-2">{form.description}</p>
                    )}
                    <div className="flex items-center gap-1 mt-3 text-xs text-gray-400">
                      <FileText className="h-3 w-3" />
                      <span>{form._count.submissions} submissions</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          No forms match your search criteria
        </div>
      )}
    </div>
  );
}
