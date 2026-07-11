"use client";

import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import {
  FolderArchive,
  Search,
  Eye,
  Send,
  ShieldCheck,
  History,
  Database,
  Plus,
  FileText,
} from "lucide-react";
import { fetchEvidenceList } from "@/lib/api";

export default function EvidencePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  const [evidenceList, setEvidenceList] = useState<any[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await fetchEvidenceList({
          search: searchTerm,
          status: statusFilter,
          classification: classFilter,
        });
        setEvidenceList(data.items);
        setTotalRecords(data.total);
      } catch (err) {
        console.error("Failed to load evidence records:", err);
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(() => {
      loadData();
    }, 250);

    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter, classFilter]);

  const statusColors: Record<string, string> = {
    Registered: "bg-sky-50 text-sky-700 border-sky-200",
    InTransit: "bg-amber-50 text-amber-700 border-amber-200",
    InLab: "bg-blue-50 text-blue-700 border-blue-200",
    InCourt: "bg-violet-50 text-violet-700 border-violet-200",
    Disposed: "bg-slate-100 text-slate-600 border-slate-200",
  };

  const filteredEvidence = evidenceList;

  return (
    <div className="space-y-6">
      {/* Header section with Action Button */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border border-slate-200 bg-white p-6 rounded-2xl shadow-xs">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Directory Log</p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Evidence Records Archive
          </h1>
          <p className="text-xs text-slate-500">
            Secure directory mapping cryptographic hashes and custodians for municipal and federal cases.
          </p>
        </div>

        <Link
          href="/register-evidence"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition"
        >
          <Plus className="h-4 w-4" />
          <span>Register Evidence</span>
        </Link>
      </section>

      {/* Filter and Search Bar */}
      <section className="border border-slate-200 bg-white rounded-2xl shadow-xs p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1 max-w-lg relative">
            <Search className="absolute top-3 left-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by ID, Case Reference, Officer or Description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-4 pl-10 text-xs text-slate-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 outline-none focus:border-blue-500 focus:bg-white transition"
              >
                <option value="all">All Statuses</option>
                <option value="registered">Registered</option>
                <option value="intransit">In Transit</option>
                <option value="inlab">In Laboratory</option>
                <option value="incourt">In Court</option>
                <option value="disposed">Disposed</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Classification</label>
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 outline-none focus:border-blue-500 focus:bg-white transition"
              >
                <option value="all">All Classifications</option>
                <option value="restricted">Restricted</option>
                <option value="confidential">Confidential</option>
                <option value="public">Public</option>
              </select>
            </div>
          </div>
        </div>

        {/* Directory Counter */}
        <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing <span className="font-semibold text-slate-800">{filteredEvidence.length}</span> of{" "}
            <span className="font-semibold text-slate-800">{totalRecords}</span> records
          </div>
        </div>

        {/* Evidence Table */}
        <div className="mt-6 overflow-x-auto border border-slate-100 rounded-xl">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">ID Reference</th>
                <th className="px-6 py-3.5">Case ID</th>
                <th className="px-6 py-3.5">Classification</th>
                <th className="px-6 py-3.5">Description</th>
                <th className="px-6 py-3.5">Current Custodian</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
              {filteredEvidence.length > 0 ? (
                filteredEvidence.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900 whitespace-nowrap">
                      <Link href={`/evidence/${item.id}`} className="hover:text-blue-600 transition-colors flex items-center gap-1.5">
                        <FileText className="h-4 w-4 text-slate-400" />
                        <span>{item.id}</span>
                      </Link>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-600 whitespace-nowrap">{item.caseId}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold border ${
                        item.classification === "Restricted"
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : item.classification === "Confidential"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-slate-100 text-slate-700 border-slate-200"
                      }`}>
                        {item.classification}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900 max-w-xs truncate" title={item.type}>
                      <span className="block font-semibold text-slate-900">{item.type}</span>
                      <span className="block text-[10px] text-slate-400 mt-0.5 truncate">{item.notes}</span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-600 whitespace-nowrap">{item.custodian}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${statusColors[item.status] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
                        {item.status === "InTransit" ? "In Transit" : item.status === "InLab" ? "In Laboratory" : item.status === "InCourt" ? "In Court" : item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-1.5 whitespace-nowrap">
                      <Link
                        href={`/evidence/${item.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>View</span>
                      </Link>
                      <Link
                        href={`/transfer-custody?id=${item.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition"
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span>Transfer</span>
                      </Link>
                      <Link
                        href={`/verification?id=${item.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />
                        <span>Verify</span>
                      </Link>
                      <Link
                        href={`/chain-of-custody?id=${item.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition"
                      >
                        <History className="h-3.5 w-3.5" />
                        <span>Timeline</span>
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-medium bg-slate-50/20">
                    <Database className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm">No archive items matched search filters.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
