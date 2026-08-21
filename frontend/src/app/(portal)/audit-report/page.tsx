"use client";

import { useMemo, useState, useEffect } from "react";
import {
  FileSpreadsheet,
  Download,
  Filter,
  History,
  Search,
  CheckCircle2,
  AlertCircle,
  Link as LinkIcon,
  Printer,
} from "lucide-react";
import { fetchAuditLogs } from "@/lib/api";

type FilterState = {
  actor: string;
  action: string;
  status: string;
  evidenceId: string;
};

function downloadCsv(rows: any[]) {
  const header = ["time", "actor", "action", "status", "evidenceId", "txHash", "detail"];
  const csv = [
    header.join(","),
    ...rows.map((row) =>
      header.map((key) => `"${row[key] || ""}"`).join(","),
    ),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "ledger-audit-report.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export default function AuditReportPage() {
  const [filters, setFilters] = useState<FilterState>({
    actor: "",
    action: "",
    status: "",
    evidenceId: "",
  });
  const [logsList, setLogsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLogs() {
      try {
        setLoading(true);
        const data = await fetchAuditLogs(filters);
        setLogsList(data);
      } catch (err) {
        console.error("Failed to load audit logs:", err);
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(() => {
      loadLogs();
    }, 200);

    return () => clearTimeout(timer);
  }, [filters]);

  const filtered = logsList;

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="space-y-6 print:bg-white print:p-0">
      {/* Header section */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border border-zinc-800 bg-zinc-900/40 p-6 rounded-md print:border-none print:shadow-none">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600">Security Ledger</p>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            Immutable Audit Trail
          </h1>
          <p className="text-xs text-zinc-500">
            Cryptographic ledger logs of all evidence registrations, handovers, and status changes.
          </p>
        </div>

        <div className="flex items-center gap-2 print:hidden">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex h-10 items-center justify-center gap-2 rounded border border-zinc-800 bg-zinc-900/40 px-4 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-zinc-50 transition"
          >
            <Printer className="h-4 w-4" />
            <span>Export PDF</span>
          </button>
          
          <button
            type="button"
            onClick={() => downloadCsv(filtered)}
            className="inline-flex h-10 items-center justify-center gap-2 rounded bg-cyan-600 px-4 text-xs font-semibold text-white hover:bg-cyan-500 transition"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </section>

      {/* Grid counters */}
      <section className="grid gap-4 grid-cols-3 print:hidden">
        <div className="border border-zinc-800 bg-zinc-900/40 p-5 rounded-md">
          <span className="block text-[10px] font-semibold text-zinc-500 uppercase">Total Audit Logs</span>
          <span className="mt-2 block text-2xl font-extrabold text-zinc-100">{logsList.length}</span>
        </div>
        <div className="border border-zinc-800 bg-zinc-900/40 p-5 rounded-md">
          <span className="block text-[10px] font-semibold text-zinc-500 uppercase">Filtered Logs</span>
          <span className="mt-2 block text-2xl font-extrabold text-zinc-100">{filtered.length}</span>
        </div>
        <div className="border border-zinc-800 bg-zinc-900/40 p-5 rounded-md">
          <span className="block text-[10px] font-semibold text-zinc-500 uppercase">Ledger Nodes</span>
          <span className="mt-2 block text-2xl font-extrabold text-cyan-400">Active</span>
        </div>
      </section>

      {/* Main filter-list panel */}
      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        {/* Filters Panel */}
        <aside className="border border-zinc-800 bg-zinc-900/40 p-5 rounded-md space-y-4 print:hidden self-start">
          <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
            <Filter className="h-4 w-4 text-cyan-400" />
            <span className="text-xs font-bold text-zinc-100 uppercase tracking-wider">Search Filters</span>
          </div>

          <div className="space-y-3.5">
            <div>
              <label className="block text-[10px] font-semibold text-zinc-600 uppercase">Evidence ID</label>
              <input
                type="text"
                placeholder="Filter by ref ID..."
                value={filters.evidenceId}
                onChange={(e) => setFilters({ ...filters, evidenceId: e.target.value })}
                className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-1.5 text-xs text-zinc-200 outline-none focus:border-cyan-500 focus:bg-zinc-900 transition"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-zinc-600 uppercase">Operator / Actor</label>
              <input
                type="text"
                placeholder="Filter by officer..."
                value={filters.actor}
                onChange={(e) => setFilters({ ...filters, actor: e.target.value })}
                className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-1.5 text-xs text-zinc-200 outline-none focus:border-cyan-500 focus:bg-zinc-900 transition"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-zinc-600 uppercase">Action Trigger</label>
              <input
                type="text"
                placeholder="Filter by action..."
                value={filters.action}
                onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-1.5 text-xs text-zinc-200 outline-none focus:border-cyan-500 focus:bg-zinc-900 transition"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-zinc-600 uppercase">Receipt Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900/40 px-2 py-1.5 text-xs text-zinc-400 outline-none focus:border-cyan-500 focus:bg-zinc-900 transition"
              >
                <option value="">All Statuses</option>
                <option value="success">Success</option>
                <option value="flagged">Flagged</option>
              </select>
            </div>
          </div>
        </aside>

        {/* Audit Log Table */}
        <section className="border border-zinc-800 bg-zinc-900/40 rounded-md overflow-hidden print:border-none print:shadow-none">
          <div className="p-5 border-b border-zinc-800 flex items-center gap-2 print:hidden">
            <History className="h-4.5 w-4.5 text-zinc-600" />
            <h2 className="text-xs font-bold text-zinc-100 uppercase tracking-wider">Blockchain Ledger Events</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-800 text-left text-xs">
              <thead className="bg-zinc-900/40 text-zinc-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Timestamp</th>
                  <th className="px-6 py-3.5">Evidence ID</th>
                  <th className="px-6 py-3.5">Action</th>
                  <th className="px-6 py-3.5">Operator</th>
                  <th className="px-6 py-3.5">Log Status</th>
                  <th className="px-6 py-3.5">Blockchain Tx Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 bg-zinc-900/40 text-zinc-300">
                {filtered.length > 0 ? (
                  filtered.map((row, idx) => (
                    <tr key={idx} className="hover:bg-zinc-800/40 transition-colors">
                      <td className="px-6 py-4 font-medium text-zinc-600 whitespace-nowrap">{new Date(row.time).toLocaleString()}</td>
                      <td className="px-6 py-4 font-bold text-zinc-100 whitespace-nowrap">{row.evidenceId || "N/A"}</td>
                      <td className="px-6 py-4 font-semibold text-zinc-100 whitespace-nowrap">{row.action}</td>
                      <td className="px-6 py-4 font-medium text-zinc-400 whitespace-nowrap">{row.actor}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase ${
                          row.status === "Success" || row.status === "verified"
                            ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/25"
                            : "bg-amber-500/10 text-amber-300 border-amber-500/25"
                        }`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-[10px] text-zinc-600">
                        <div className="flex items-center gap-1">
                          <LinkIcon className="h-3 w-3 text-zinc-700" />
                          <span className="truncate max-w-28" title={row.txHash}>{row.txHash}</span>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-zinc-600 font-medium bg-zinc-800/40">
                      <History className="h-8 w-8 mx-auto text-zinc-700 mb-2" />
                      <p className="text-sm">No ledger logs matched filtering queries.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}