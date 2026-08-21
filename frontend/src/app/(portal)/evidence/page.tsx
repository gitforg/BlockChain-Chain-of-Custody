"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  const [evidenceList, setEvidenceList] = useState<any[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSearchTerm(initialSearch);
  }, [initialSearch]);

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
    Registered: "bg-cyan-500/10 text-cyan-300 border-cyan-500/25",
    InTransit: "bg-amber-500/10 text-amber-300 border-amber-500/25",
    InLab: "bg-cyan-500/10 text-cyan-300 border-cyan-500/30",
    InCourt: "bg-violet-500/10 text-violet-300 border-violet-500/25",
    Disposed: "bg-zinc-800 text-zinc-400 border-zinc-800",
  };

  const filteredEvidence = evidenceList;

  return (
    <div className="space-y-6">
      {/* Header section with Action Button */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border border-zinc-800 bg-zinc-900/40 p-6 rounded-md">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600">Directory Log</p>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            Evidence Records Archive
          </h1>
          <p className="text-xs text-zinc-500">
            Secure directory mapping cryptographic hashes and custodians for municipal and federal cases.
          </p>
        </div>

        <Link
          href="/register-evidence"
          className="inline-flex h-10 items-center justify-center gap-2 rounded bg-cyan-600 px-4 text-xs font-semibold text-white hover:bg-cyan-500 transition"
        >
          <Plus className="h-4 w-4" />
          <span>Register Evidence</span>
        </Link>
      </section>

      {/* Filter and Search Bar */}
      <section className="border border-zinc-800 bg-zinc-900/40 rounded-md p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1 max-w-lg relative">
            <Search className="absolute top-3 left-3 h-4 w-4 text-zinc-600" />
            <input
              type="text"
              placeholder="Search by ID, Case Reference, Officer or Description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded border border-zinc-800 bg-zinc-900/40 py-2.5 pr-4 pl-10 text-xs text-zinc-200 outline-none focus:border-cyan-500 focus:bg-zinc-900 focus:ring-1 focus:ring-cyan-500 transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-zinc-600 uppercase mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs font-medium text-zinc-400 outline-none focus:border-cyan-500 focus:bg-zinc-900 transition"
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
              <label className="block text-[10px] font-semibold text-zinc-600 uppercase mb-1">Classification</label>
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="rounded border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs font-medium text-zinc-400 outline-none focus:border-cyan-500 focus:bg-zinc-900 transition"
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
        <div className="mt-4 flex items-center justify-between text-xs text-zinc-500">
          <div>
            Showing <span className="font-semibold text-zinc-200">{filteredEvidence.length}</span> of{" "}
            <span className="font-semibold text-zinc-200">{totalRecords}</span> records
          </div>
        </div>

        {/* Evidence Table */}
        <div className="mt-6 overflow-x-auto border border-zinc-800 rounded">
          <table className="min-w-full divide-y divide-zinc-800 text-left text-xs">
            <thead className="bg-zinc-900/40 text-zinc-500 font-semibold uppercase tracking-wider">
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
            <tbody className="divide-y divide-zinc-800 bg-zinc-900/40 text-zinc-300">
              {filteredEvidence.length > 0 ? (
                filteredEvidence.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="px-6 py-4 font-bold text-zinc-100 whitespace-nowrap">
                      <Link href={`/evidence/${item.id}`} className="hover:text-cyan-400 transition-colors flex items-center gap-1.5">
                        <FileText className="h-4 w-4 text-zinc-600" />
                        <span>{item.id}</span>
                      </Link>
                    </td>
                    <td className="px-6 py-4 font-medium text-zinc-400 whitespace-nowrap">{item.caseId}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold border ${
                        item.classification === "Restricted"
                          ? "bg-rose-500/10 text-rose-300 border-rose-500/25"
                          : item.classification === "Confidential"
                          ? "bg-amber-500/10 text-amber-300 border-amber-500/25"
                          : "bg-zinc-800 text-zinc-300 border-zinc-800"
                      }`}>
                        {item.classification}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-zinc-100 max-w-xs truncate" title={item.type}>
                      <span className="block font-semibold text-zinc-100">{item.type}</span>
                      <span className="block text-[10px] text-zinc-600 mt-0.5 truncate">{item.notes}</span>
                    </td>
                    <td className="px-6 py-4 font-medium text-zinc-400 whitespace-nowrap">{item.custodian}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${statusColors[item.status] || "bg-zinc-800 text-zinc-400 border-zinc-800"}`}>
                        {item.status === "InTransit" ? "In Transit" : item.status === "InLab" ? "In Laboratory" : item.status === "InCourt" ? "In Court" : item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-1.5 whitespace-nowrap">
                      <Link
                        href={`/evidence/${item.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900/40 px-2 py-1 text-[11px] font-semibold text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800 transition"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>View</span>
                      </Link>
                      <Link
                        href={`/transfer-custody?id=${item.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900/40 px-2 py-1 text-[11px] font-semibold text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800 transition"
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span>Transfer</span>
                      </Link>
                      <Link
                        href={`/verification?id=${item.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900/40 px-2 py-1 text-[11px] font-semibold text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800 transition"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />
                        <span>Verify</span>
                      </Link>
                      <Link
                        href={`/chain-of-custody?id=${item.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900/40 px-2 py-1 text-[11px] font-semibold text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800 transition"
                      >
                        <History className="h-3.5 w-3.5" />
                        <span>Timeline</span>
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-600 font-medium bg-zinc-800/40">
                    <Database className="h-8 w-8 mx-auto text-zinc-700 mb-2" />
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
