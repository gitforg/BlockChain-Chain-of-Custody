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
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border border-slate-200 bg-white p-6 rounded-2xl shadow-xs print:border-none print:shadow-none">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Security Ledger</p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Immutable Audit Trail
          </h1>
          <p className="text-xs text-slate-500">
            Cryptographic ledger logs of all evidence registrations, handovers, and status changes.
          </p>
        </div>

        <div className="flex items-center gap-2 print:hidden">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-950 transition shadow-xs"
          >
            <Printer className="h-4 w-4" />
            <span>Export PDF</span>
          </button>
          
          <button
            type="button"
            onClick={() => downloadCsv(filtered)}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </section>

      {/* Grid counters */}
      <section className="grid gap-4 grid-cols-3 print:hidden">
        <div className="border border-slate-200 bg-white p-5 rounded-2xl shadow-xs">
          <span className="block text-[10px] font-semibold text-slate-450 uppercase">Total Audit Logs</span>
          <span className="mt-2 block text-2xl font-extrabold text-slate-900">{logsList.length}</span>
        </div>
        <div className="border border-slate-200 bg-white p-5 rounded-2xl shadow-xs">
          <span className="block text-[10px] font-semibold text-slate-450 uppercase">Filtered Logs</span>
          <span className="mt-2 block text-2xl font-extrabold text-slate-900">{filtered.length}</span>
        </div>
        <div className="border border-slate-200 bg-white p-5 rounded-2xl shadow-xs">
          <span className="block text-[10px] font-semibold text-slate-450 uppercase">Ledger Nodes</span>
          <span className="mt-2 block text-2xl font-extrabold text-blue-600">Active</span>
        </div>
      </section>

      {/* Main filter-list panel */}
      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        {/* Filters Panel */}
        <aside className="border border-slate-200 bg-white p-5 rounded-2xl shadow-xs space-y-4 print:hidden self-start">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Filter className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Search Filters</span>
          </div>

          <div className="space-y-3.5">
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase">Evidence ID</label>
              <input
                type="text"
                placeholder="Filter by ref ID..."
                value={filters.evidenceId}
                onChange={(e) => setFilters({ ...filters, evidenceId: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase">Operator / Actor</label>
              <input
                type="text"
                placeholder="Filter by officer..."
                value={filters.actor}
                onChange={(e) => setFilters({ ...filters, actor: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase">Action Trigger</label>
              <input
                type="text"
                placeholder="Filter by action..."
                value={filters.action}
                onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase">Receipt Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-650 outline-none focus:border-blue-500 focus:bg-white transition"
              >
                <option value="">All Statuses</option>
                <option value="success">Success</option>
                <option value="flagged">Flagged</option>
              </select>
            </div>
          </div>
        </aside>

        {/* Audit Log Table */}
        <section className="border border-slate-200 bg-white rounded-2xl shadow-xs overflow-hidden print:border-none print:shadow-none">
          <div className="p-5 border-b border-slate-100 flex items-center gap-2 print:hidden">
            <History className="h-4.5 w-4.5 text-slate-400" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Blockchain Ledger Events</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Timestamp</th>
                  <th className="px-6 py-3.5">Evidence ID</th>
                  <th className="px-6 py-3.5">Action</th>
                  <th className="px-6 py-3.5">Operator</th>
                  <th className="px-6 py-3.5">Log Status</th>
                  <th className="px-6 py-3.5">Blockchain Tx Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                {filtered.length > 0 ? (
                  filtered.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-400 whitespace-nowrap">{new Date(row.time).toLocaleString()}</td>
                      <td className="px-6 py-4 font-bold text-slate-900 whitespace-nowrap">{row.evidenceId || "N/A"}</td>
                      <td className="px-6 py-4 font-semibold text-slate-900 whitespace-nowrap">{row.action}</td>
                      <td className="px-6 py-4 font-medium text-slate-600 whitespace-nowrap">{row.actor}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase ${
                          row.status === "Success" || row.status === "verified"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-[10px] text-slate-400">
                        <div className="flex items-center gap-1">
                          <LinkIcon className="h-3 w-3 text-slate-300" />
                          <span className="truncate max-w-28" title={row.txHash}>{row.txHash}</span>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium bg-slate-50/20">
                      <History className="h-8 w-8 mx-auto text-slate-300 mb-2" />
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