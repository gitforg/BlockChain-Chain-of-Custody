"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import {
  FolderArchive,
  Truck,
  FlaskConical,
  Gavel,
  Trash2,
  Clock,
  CheckCircle2,
  Cpu,
  Search,
  Eye,
  Send,
  ShieldCheck,
  History,
  TrendingUp,
} from "lucide-react";
import { dashboardMetrics, recentEvidence } from "@/lib/dapp-data";

const iconMap: Record<string, any> = {
  Evidence: FolderArchive,
  Transit: Truck,
  Lab: FlaskConical,
  Court: Gavel,
  Disposed: Trash2,
  Pending: Clock,
  Verified: CheckCircle2,
  Blockchain: Cpu,
};

export default function DashboardPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const statusColors: Record<string, string> = {
    Registered: "bg-sky-50 text-sky-700 border-sky-200",
    InTransit: "bg-amber-50 text-amber-700 border-amber-200",
    InLab: "bg-blue-50 text-blue-700 border-blue-200",
    InCourt: "bg-violet-50 text-violet-700 border-violet-200",
    Disposed: "bg-slate-100 text-slate-600 border-slate-200",
  };

  const filteredEvidence = useMemo(() => {
    return recentEvidence.filter((item) => {
      const matchesSearch =
        item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.caseId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.custodian.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus =
        statusFilter === "all" || item.status.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, statusFilter]);

  return (
    <div className="space-y-8">
      {/* Redesigned Hero Section */}
      <section className="border border-slate-200 bg-white p-6 sm:p-8 rounded-2xl shadow-xs space-y-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">DApp Ledger Console</p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Evidence Chain of Custody
          </h1>
        </div>
        <p className="text-slate-500 text-sm leading-relaxed max-w-4xl">
          A decentralized application (DApp) where law enforcement agencies, forensic laboratories, courts, and legal teams securely register, transfer, verify, and audit physical and digital evidence. Every action is permanently recorded on blockchain, ensuring transparency, immutability, and tamper-proof chain of custody.
        </p>
      </section>

      {/* Grid of 8 Statistics Cards */}
      <section className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {dashboardMetrics.map((metric) => {
          const Icon = iconMap[metric.icon] || FolderArchive;

          return (
            <div key={metric.label} className="border border-slate-200 bg-white p-4 rounded-xl shadow-xs flex flex-col justify-between hover:shadow-sm transition">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-slate-500">{metric.label}</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-600 border border-slate-100">
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-2xl font-bold text-slate-950">{metric.value}</span>
                <div className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                  <TrendingUp className="h-3 w-3" />
                  <span>{metric.delta}</span>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Recent Evidence Table Control Panel */}
      <section className="border border-slate-200 bg-white rounded-2xl shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Evidence Log</h2>
            <p className="text-xs text-slate-500 mt-1">Real-time ledger listings anchored on the blockchain network.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-60 rounded-xl border border-slate-200 bg-slate-50 py-2 pr-3 pl-9 text-xs text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition"
              />
            </div>

            {/* Filter Selection */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 outline-none focus:border-blue-500 focus:bg-white transition"
            >
              <option value="all">All Statuses</option>
              <option value="registered">Registered</option>
              <option value="intransit">In Transit</option>
              <option value="inlab">In Lab</option>
              <option value="incourt">In Court</option>
              <option value="disposed">Disposed</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Evidence ID</th>
                <th className="px-6 py-3.5">Case ID</th>
                <th className="px-6 py-3.5">Evidence Type</th>
                <th className="px-6 py-3.5">Current Custodian</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Last Updated</th>
                <th className="px-6 py-3.5">Blockchain Tx</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
              {filteredEvidence.length > 0 ? (
                filteredEvidence.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">{item.id}</td>
                    <td className="px-6 py-4 font-medium text-slate-600">{item.caseId}</td>
                    <td className="px-6 py-4 font-medium text-slate-900">{item.type}</td>
                    <td className="px-6 py-4 font-medium text-slate-600">{item.custodian}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusColors[item.status] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
                        {item.status === "InTransit" ? "In Transit" : item.status === "InLab" ? "In Laboratory" : item.status === "InCourt" ? "In Court" : item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 font-medium">{item.updatedAt}</td>
                    <td className="px-6 py-4 font-mono text-[10px] text-slate-400 truncate max-w-28" title={item.txHash}>
                      {item.txHash.slice(0, 8)}...{item.txHash.slice(-6)}
                    </td>
                    <td className="px-6 py-4 text-right space-x-1.5 whitespace-nowrap">
                      <Link
                        href={`/evidence/${item.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition"
                        title="View Details"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>View</span>
                      </Link>
                      <Link
                        href={`/transfer-custody?id=${item.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition"
                        title="Transfer Custody"
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span>Transfer</span>
                      </Link>
                      <Link
                        href={`/verification?id=${item.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition"
                        title="Verify Integrity"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />
                        <span>Verify</span>
                      </Link>
                      <Link
                        href={`/chain-of-custody?id=${item.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition"
                        title="Audit History"
                      >
                        <History className="h-3.5 w-3.5" />
                        <span>Timeline</span>
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400 font-medium bg-slate-50/20">
                    <FolderArchive className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm">No evidence logs matched the filters.</p>
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