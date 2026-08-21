"use client";

import { useState, useMemo, useEffect } from "react";
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
import { fetchEvidenceList, fetchEvidenceById } from "@/lib/api";

export default function ChainOfCustodyPage() {
  const [selectedId, setSelectedId] = useState("");
  const [evidenceList, setEvidenceList] = useState<any[]>([]);
  const [activeEvidence, setActiveEvidence] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await fetchEvidenceList();
        setEvidenceList(data.items);
        if (data.items.length > 0) {
          setSelectedId(data.items[0].id);
        }
      } catch (err) {
        console.error("Failed to load evidence registry:", err);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    async function loadDetail() {
      try {
        setLoading(true);
        const data = await fetchEvidenceById(selectedId);
        setActiveEvidence(data);
      } catch (err) {
        console.error("Failed to load custody events:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDetail();
  }, [selectedId]);

  const evidence = activeEvidence || {
    id: selectedId || "Syncing...",
    caseId: "...",
    classification: "Restricted",
    status: "Registered",
    custodian: "...",
    txHash: "...",
  };

  const activeTimeline = activeEvidence?.custodyEvents || [];

  const statusColors: Record<string, string> = {
    Registered: "bg-cyan-500/10 text-cyan-300 border-cyan-500/25",
    InTransit: "bg-amber-500/10 text-amber-300 border-amber-500/25",
    InLab: "bg-cyan-500/10 text-cyan-300 border-cyan-500/30",
    InCourt: "bg-violet-500/10 text-violet-300 border-violet-500/25",
    Disposed: "bg-zinc-800 text-zinc-400 border-zinc-800",
  };

  return (
    <div className="space-y-6">
      {/* Header card */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border border-zinc-800 bg-zinc-900/40 p-6 rounded-md">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600">Ledger Tracking</p>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            Chain of Custody Explorer
          </h1>
          <p className="text-xs text-zinc-500">
            Cryptographically trace evidence transfers, acceptance signatures, and status progressions.
          </p>
        </div>

        <div>
          <label className="block text-[10px] font-semibold text-zinc-600 uppercase mb-1">Select Evidence ID</label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="rounded border border-zinc-800 bg-zinc-900/40 px-3.5 py-2 text-xs font-semibold text-zinc-300 outline-none focus:border-cyan-500 focus:bg-zinc-900 transition"
          >
            {evidenceList.map((item) => (
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
          <article className="border border-zinc-800 bg-zinc-900/40 p-6 rounded-md space-y-5">
            <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider border-b border-zinc-800 pb-2">Active Target Summary</h2>
            
            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between border-b border-zinc-800 pb-2">
                <span className="text-zinc-600">Record ID</span>
                <span className="font-bold text-zinc-100">{evidence.id}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800 pb-2">
                <span className="text-zinc-600">Case ID</span>
                <span className="font-semibold text-zinc-100">{evidence.caseId}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800 pb-2">
                <span className="text-zinc-600">Classification</span>
                <span className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-bold border ${
                  evidence.classification === "Restricted"
                    ? "bg-rose-500/10 text-rose-300 border-rose-500/25"
                    : "bg-zinc-800 text-zinc-300 border-zinc-800"
                }`}>{evidence.classification}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800 pb-2">
                <span className="text-zinc-600">Current Status</span>
                <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusColors[evidence.status]}`}>
                  {evidence.status === "InTransit" ? "In Transit" : evidence.status === "InLab" ? "In Laboratory" : evidence.status === "InCourt" ? "In Court" : evidence.status}
                </span>
              </div>
              <div className="flex justify-between border-b border-zinc-800 pb-2">
                <span className="text-zinc-600">Custodian</span>
                <span className="font-semibold text-zinc-200">{evidence.custodian}</span>
              </div>
              <div>
                <span className="text-zinc-600 block mb-1">On-Chain Transaction Reference</span>
                <span className="block font-mono text-[10px] bg-zinc-900/40 border border-zinc-800 p-2 rounded-lg text-zinc-500 break-all">{evidence.txHash}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-800 flex gap-2">
              <Link
                href={`/evidence/${evidence.id}`}
                className="flex-1 inline-flex h-9 items-center justify-center gap-1.5 rounded border border-zinc-800 bg-zinc-900/40 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition"
              >
                <Database className="h-4 w-4" />
                <span>View File Card</span>
              </Link>
              <Link
                href={`/transfer-custody?id=${evidence.id}`}
                className="flex-1 inline-flex h-9 items-center justify-center gap-1.5 rounded bg-cyan-600 text-xs font-semibold text-white hover:bg-cyan-500 transition"
              >
                <Send className="h-4 w-4" />
                <span>Transfer</span>
              </Link>
            </div>
          </article>
        </section>

        {/* Vertical Timeline Card */}
        <section className="border border-zinc-800 bg-zinc-900/40 p-6 rounded-md space-y-6">
          <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider border-b border-zinc-800 pb-3 flex items-center gap-2">
            <Workflow className="h-4.5 w-4.5 text-cyan-400" />
            <span>Custody Ledger Stream</span>
          </h2>

          <div className="relative pl-8 border-l border-zinc-800 space-y-8">
            {activeTimeline.map((event: any, idx: number) => (
              <div key={idx} className="relative space-y-2">
                {/* Visual Icon Node */}
                <span className="absolute -left-[42px] top-1 flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900/40 border border-zinc-700 text-zinc-400">
                  {event.status === "Registered" ? (
                    <Database className="h-3.5 w-3.5 text-cyan-400" />
                  ) : event.status === "InTransit" ? (
                    <Clock className="h-3.5 w-3.5 text-amber-600" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  )}
                </span>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <div>
                    <span className="text-xs font-bold text-zinc-100">{event.actor}</span>
                    <span className="text-[10px] text-zinc-600 ml-1.5 font-medium">({event.department})</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-600">{new Date(event.time).toLocaleString()}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold border uppercase tracking-wider ${statusColors[event.status]}`}>
                    {event.status}
                  </span>
                  <span className="text-xs font-semibold text-zinc-200">{event.action}</span>
                </div>

                <p className="text-xs text-zinc-500 leading-relaxed bg-zinc-800/40 border border-zinc-800 p-3 rounded">
                  {event.note}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-[10px] font-mono text-zinc-600">
                  <span className="flex items-center gap-1">
                    <Compass className="h-3 w-3 text-zinc-600" />
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
