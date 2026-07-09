"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Workflow,
  Search,
  Compass,
  Clock,
  User,
  ShieldAlert,
  ArrowRight,
  Database,
  CheckCircle2,
  Send,
} from "lucide-react";
import { recentEvidence, custodyTimeline } from "@/lib/dapp-data";

export default function ChainOfCustodyPage() {
  const [selectedId, setSelectedId] = useState(recentEvidence[0]?.id || "EV-2026-0048");

  const evidence = useMemo(() => {
    return recentEvidence.find((item) => item.id === selectedId) || recentEvidence[0];
  }, [selectedId]);

  // Adjust timeline mock logs slightly depending on the item for dynamic feel
  const activeTimeline = useMemo(() => {
    if (evidence.id === "EV-2026-0048") {
      return custodyTimeline;
    }
    // Generate simple dynamic timeline for other items
    return [
      {
        actor: evidence.custodian,
        department: "Intake Division",
        action: `Registered Evidence Item ${evidence.id}`,
        time: evidence.updatedAt,
        hash: evidence.txHash,
        confirmation: "Confirmed Block #18920110",
        status: "Registered",
        note: `Initial registration. SHA-256 fingerprint generated and stored on the decentralized ledger: ${evidence.ipfsCid}`,
      }
    ];
  }, [evidence]);

  const statusColors: Record<string, string> = {
    Registered: "bg-sky-50 text-sky-700 border-sky-200",
    InTransit: "bg-amber-50 text-amber-700 border-amber-200",
    InLab: "bg-blue-50 text-blue-700 border-blue-200",
    InCourt: "bg-violet-50 text-violet-700 border-violet-200",
    Disposed: "bg-slate-100 text-slate-600 border-slate-200",
  };

  return (
    <div className="space-y-6">
      {/* Header card */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border border-slate-200 bg-white p-6 rounded-2xl shadow-xs">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Ledger Tracking</p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Chain of Custody Explorer
          </h1>
          <p className="text-xs text-slate-500">
            Cryptographically trace evidence transfers, acceptance signatures, and status progressions.
          </p>
        </div>

        <div>
          <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Select Evidence ID</label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition"
          >
            {recentEvidence.map((item) => (
              <option key={item.id} value={item.id}>
                {item.id} ({item.type.split(" ")[0]}...)
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Main timeline explorer */}
      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        {/* Selected item metadata card */}
        <section className="space-y-6">
          <article className="border border-slate-200 bg-white p-6 rounded-2xl shadow-xs space-y-5">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">Active Target Summary</h2>
            
            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between border-b border-slate-50 pb-2">
                <span className="text-slate-400">Record ID</span>
                <span className="font-bold text-slate-900">{evidence.id}</span>
              </div>
              <div className="flex justify-between border-b border-slate-50 pb-2">
                <span className="text-slate-400">Case ID</span>
                <span className="font-semibold text-slate-900">{evidence.caseId}</span>
              </div>
              <div className="flex justify-between border-b border-slate-50 pb-2">
                <span className="text-slate-400">Classification</span>
                <span className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-bold border ${
                  evidence.classification === "Restricted"
                    ? "bg-rose-50 text-rose-700 border-rose-200"
                    : "bg-slate-100 text-slate-700 border-slate-200"
                }`}>{evidence.classification}</span>
              </div>
              <div className="flex justify-between border-b border-slate-50 pb-2">
                <span className="text-slate-400">Current Status</span>
                <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusColors[evidence.status]}`}>
                  {evidence.status === "InTransit" ? "In Transit" : evidence.status === "InLab" ? "In Laboratory" : evidence.status === "InCourt" ? "In Court" : evidence.status}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-50 pb-2">
                <span className="text-slate-400">Custodian</span>
                <span className="font-semibold text-slate-800">{evidence.custodian}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-1">On-Chain Transaction Reference</span>
                <span className="block font-mono text-[10px] bg-slate-50 border border-slate-150 p-2 rounded-lg text-slate-500 break-all">{evidence.txHash}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-150 flex gap-2">
              <Link
                href={`/evidence/${evidence.id}`}
                className="flex-1 inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                <Database className="h-4 w-4" />
                <span>View File Card</span>
              </Link>
              <Link
                href={`/transfer-custody?id=${evidence.id}`}
                className="flex-1 inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-blue-600 text-xs font-semibold text-white hover:bg-blue-700 transition"
              >
                <Send className="h-4 w-4" />
                <span>Transfer</span>
              </Link>
            </div>
          </article>
        </section>

        {/* Vertical Timeline Card */}
        <section className="border border-slate-200 bg-white p-6 rounded-2xl shadow-xs space-y-6">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
            <Workflow className="h-4.5 w-4.5 text-blue-600" />
            <span>Custody Ledger Stream</span>
          </h2>

          <div className="relative pl-8 border-l border-slate-200 space-y-8">
            {activeTimeline.map((event, idx) => (
              <div key={idx} className="relative space-y-2">
                {/* Visual Icon Node */}
                <span className="absolute -left-[42px] top-1 flex h-7 w-7 items-center justify-center rounded-lg bg-white border border-slate-250 text-slate-600 shadow-sm">
                  {event.status === "Registered" ? (
                    <Database className="h-3.5 w-3.5 text-blue-600" />
                  ) : event.status === "InTransit" ? (
                    <Clock className="h-3.5 w-3.5 text-amber-600" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  )}
                </span>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <div>
                    <span className="text-xs font-bold text-slate-900">{event.actor}</span>
                    <span className="text-[10px] text-slate-400 ml-1.5 font-medium">({event.department})</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">{event.time}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold border uppercase tracking-wider ${statusColors[event.status]}`}>
                    {event.status}
                  </span>
                  <span className="text-xs font-semibold text-slate-800">{event.action}</span>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed bg-slate-50/50 border border-slate-100 p-3 rounded-xl">
                  {event.note}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-[10px] font-mono text-slate-400">
                  <span className="flex items-center gap-1">
                    <Compass className="h-3 w-3 text-slate-400" />
                    <span>Tx: {event.hash}</span>
                  </span>
                  <span className="text-emerald-600 font-semibold">{event.confirmation}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
