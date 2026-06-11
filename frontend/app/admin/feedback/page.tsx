"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useUser } from "@auth0/nextjs-auth0/client";
import { redirect } from "next/navigation";
import { useFeedback } from "@/app/hooks/useFeedback";
import { useRole } from "@/app/hooks/useRole";

const PRIORITY_OPTIONS = ["", "low", "medium", "high"];
const TYPE_OPTIONS = ["", "bug", "feature", "improvement", "other"];
const SORT_BY_OPTIONS = [
  { value: "createdAt", label: "Date" },
  { value: "priority", label: "Priority" },
  { value: "type", label: "Type" },
];

function PriorityBadge({ priority }: { priority: string }) {
  const styles: Record<string, string> = {
    low: "bg-gray-200 text-gray-800",
    medium: "bg-amber-200 text-amber-900",
    high: "bg-red-200 text-red-900",
  };
  const style = styles[priority] ?? "bg-indigo-100 text-indigo-900";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${style}`}
    >
      {priority}
    </span>
  );
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function truncate(str: string, max: number) {
  if (!str) return "";
  return str.length <= max ? str : str.slice(0, max) + "…";
}

export default function AdminFeedbackPage() {
  const { user, isLoading: userLoading } = useUser();
  const { role, isLoadingRole } = useRole();
  const isAdmin = role === "admin";

  useEffect(() => {
    if (!userLoading && !isLoadingRole && (!user || !isAdmin)) {
      redirect("/dashboard");
    }
  }, [user, userLoading, isLoadingRole, isAdmin]);

  const [type, setType] = useState("");
  const [priority, setPriority] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useFeedback(
    page,
    15,
    sortBy,
    sortOrder,
    type,
    priority,
    isAdmin,
  );

  return userLoading || isLoadingRole ? (
    <div>Loading...</div>
  ) : isAdmin ? (
    <div className="p-4 md:p-6 backdrop-blur-sm min-h-screen w-full">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-xl font-semibold text-indigo-900">Feedback</h1>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 font-medium px-4 h-10 rounded-xl cursor-pointer border border-indigo-300 bg-indigo-100/70 text-indigo-900 hover:bg-indigo-500 hover:text-white transition-colors duration-200 w-fit"
          >
            ← Back to dashboard
          </Link>
        </div>

        <div className="bg-white/80 backdrop-blur border border-indigo-200 rounded-xl shadow-md overflow-hidden">
          {/* Filters and sort */}
          <div className="p-4 border-b border-indigo-100 flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2">
              <span className="text-sm font-medium text-indigo-900">Type</span>
              <select
                value={type}
                onChange={(e) => {
                  setType(e.target.value);
                  setPage(1);
                }}
                className="rounded-lg border border-indigo-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                <option value="">All</option>
                {TYPE_OPTIONS.filter(Boolean).map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2">
              <span className="text-sm font-medium text-indigo-900">
                Priority
              </span>
              <select
                value={priority}
                onChange={(e) => {
                  setPriority(e.target.value);
                  setPage(1);
                }}
                className="rounded-lg border border-indigo-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                <option value="">All</option>
                {PRIORITY_OPTIONS.filter(Boolean).map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2">
              <span className="text-sm font-medium text-indigo-900">
                Sort by
              </span>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
                className="rounded-lg border border-indigo-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                {SORT_BY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() =>
                setSortOrder((o) => (o === "asc" ? "desc" : "asc"))
              }
              className="inline-flex items-center gap-2 font-medium px-3 py-2 rounded-lg border border-indigo-300 bg-indigo-100/70 text-indigo-900 hover:bg-indigo-500 hover:text-white transition-colors text-sm"
            >
              {sortOrder === "asc" ? "↑ Asc" : "↓ Desc"}
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-8 text-center text-indigo-700">
                Loading feedback…
              </div>
            ) : error ? (
              <div className="p-8 text-center text-red-600">
                Failed to load feedback. Try again.
              </div>
            ) : data?.feedback.length === 0 ? (
              <div className="p-8 text-center text-indigo-600">
                No feedback matches your filters.
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-indigo-200 bg-indigo-50/50">
                    <th className="px-4 py-3 text-sm font-medium text-indigo-900">
                      Email
                    </th>
                    <th className="px-4 py-3 text-sm font-medium text-indigo-900">
                      Type
                    </th>
                    <th className="px-4 py-3 text-sm font-medium text-indigo-900">
                      Subject
                    </th>
                    <th className="px-4 py-3 text-sm font-medium text-indigo-900 hidden sm:table-cell">
                      Message
                    </th>
                    <th className="px-4 py-3 text-sm font-medium text-indigo-900">
                      Priority
                    </th>
                    <th className="px-4 py-3 text-sm font-medium text-indigo-900">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data?.feedback.map((row) => (
                    <tr
                      key={row._id}
                      className="border-b border-indigo-100 hover:bg-indigo-50/30 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm text-indigo-900">
                        {row.email}
                      </td>
                      <td className="px-4 py-3 text-sm capitalize text-indigo-800">
                        {row.type}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-indigo-900 max-w-[180px] truncate">
                        {row.subject}
                      </td>
                      <td className="px-4 py-3 text-sm text-indigo-700 hidden sm:table-cell max-w-[200px]">
                        {truncate(row.message, 60)}
                      </td>
                      <td className="px-4 py-3">
                        <PriorityBadge priority={row.priority} />
                      </td>
                      <td className="px-4 py-3 text-sm text-indigo-700 whitespace-nowrap">
                        {formatDate(row.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {(data?.total ?? 0) > 1 && (
            <div className="p-4 border-t border-indigo-100 flex items-center justify-between flex-wrap gap-2">
              <p className="text-sm text-indigo-700">
                Showing page {page} of {data?.total ?? 0} ({data?.total ?? 0}{" "}
                total)
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="inline-flex items-center justify-center px-3 py-2 rounded-lg border border-indigo-300 bg-white text-indigo-900 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setPage((p) => Math.min(data?.total ?? 0, p + 1))
                  }
                  disabled={
                    page >= (data?.total ?? 0) || (data?.total ?? 0) === 0
                  }
                  className="inline-flex items-center justify-center px-3 py-2 rounded-lg border border-indigo-300 bg-white text-indigo-900 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  ) : (
    <div>You are not authorized to access this page</div>
  );
}
