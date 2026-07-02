"use client";

import { useMemo, useState } from "react";
import { FiDownload, FiFileText, FiFilter } from "react-icons/fi";
import { auditLogs } from "@/lib/dapp-data";

type FilterState = {
  actor: string;
  action: string;
  status: string;
};

function downloadCsv(rows: typeof auditLogs) {
  const header = ["time", "actor", "action", "status", "detail"];
  const csv = [
    header.join(","),
    ...rows.map((row) =>
      header.map((key) => `"${row[key as keyof typeof row]}"`).join(","),
    ),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "audit-report.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export default function AuditReportPage() {
  const [filters, setFilters] = useState<FilterState>({ actor: "", action: "", status: "" });

  const filtered = useMemo(
    () =>
      auditLogs.filter((row) => {
        const matchesActor =
          !filters.actor || row.actor.toLowerCase().includes(filters.actor.toLowerCase());
        const matchesAction =
          !filters.action || row.action.toLowerCase().includes(filters.action.toLowerCase());
        const matchesStatus =
          !filters.status || row.status.toLowerCase().includes(filters.status.toLowerCase());

        return matchesActor && matchesAction && matchesStatus;
      }),
    [filters],
  );

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-5">
          <p className="text-sm text-slate-400">Total log entries</p>
          <p className="mt-3 text-3xl font-semibold text-white">{auditLogs.length}</p>
        </div>
        <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-5">
          <p className="text-sm text-slate-400">Filtered results</p>
          <p className="mt-3 text-3xl font-semibold text-white">{filtered.length}</p>
        </div>
        <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-5">
          <p className="text-sm text-slate-400">Export format</p>
          <p className="mt-3 text-3xl font-semibold text-white">CSV</p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <aside className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-6">
          <div className="flex items-center gap-3">
            <FiFilter className="text-cyan-300" />
            <div>
              <h2 className="text-xl font-semibold text-white">Filters</h2>
              <p className="mt-1 text-sm text-slate-400">
                Narrow the audit trail before exporting.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {[
              ["Actor", "actor"],
              ["Action", "action"],
              ["Status", "status"],
            ].map(([label, key]) => (
              <label key={label} className="block">
                <span className="text-sm text-slate-300">{label}</span>
                <input
                  value={filters[key as keyof FilterState]}
                  onChange={(event) =>
                    setFilters({ ...filters, [key]: event.target.value })
                  }
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-cyan-300/30"
                  placeholder={`Filter by ${label.toLowerCase()}`}
                />
              </label>
            ))}
          </div>

          <button
            type="button"
            onClick={() => downloadCsv(filtered)}
            className="mt-6 flex w-full items-center justify-center gap-3 rounded-2xl bg-cyan-400 px-5 py-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
          >
            <FiDownload />
            Export filtered CSV
          </button>
        </aside>

        <article className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-6">
          <div className="flex items-center gap-3">
            <FiFileText className="text-cyan-300" />
            <div>
              <h2 className="text-xl font-semibold text-white">Audit log</h2>
              <p className="mt-1 text-sm text-slate-400">
                Reviewable event stream for operations and compliance.
              </p>
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-[1.25rem] border border-white/10">
            <table className="min-w-full divide-y divide-white/10 text-left text-sm">
              <thead className="bg-white/5 text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Time</th>
                  <th className="px-4 py-3 font-medium">Actor</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 bg-slate-950/60 text-slate-200">
                {filtered.map((row) => (
                  <tr key={`${row.time}-${row.actor}-${row.action}`} className="hover:bg-white/5">
                    <td className="px-4 py-4 text-slate-400">{row.time}</td>
                    <td className="px-4 py-4">{row.actor}</td>
                    <td className="px-4 py-4">{row.action}</td>
                    <td className="px-4 py-4">
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-400">{row.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </div>
  );
}