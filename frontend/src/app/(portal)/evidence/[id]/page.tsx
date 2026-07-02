"use client";

import { useMemo, useState } from "react";
import { FiCheckCircle, FiCopy, FiSearch } from "react-icons/fi";
import { custodyTimeline } from "@/lib/dapp-data";
import { QrCode } from "@/components/qr-code";

type EvidenceDetailPageProps = {
  params: { id: string };
};

const expectedHash =
  "0x7c2b9f6d2a4e8b1c9f0d3e5a1b8f4c2d7e9a6f0b1c4d8e2f6a9b3c7d1e5f2a4b";

export default function EvidenceDetailPage({ params }: EvidenceDetailPageProps) {
  const [hashInput, setHashInput] = useState(expectedHash);
  const [result, setResult] = useState<"idle" | "match" | "mismatch">("idle");

  const isMatch = useMemo(
    () => hashInput.trim().toLowerCase() === expectedHash.toLowerCase(),
    [hashInput],
  );

  function verifyHash() {
    setResult(isMatch ? "match" : "mismatch");
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <section className="space-y-6">
        <article className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm text-slate-400">Evidence record</p>
              <h2 className="mt-2 text-3xl font-semibold text-white">{params.id}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Laptop seizure package linked to a custody chain with multiple signer approvals.
              </p>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:border-cyan-300/30 hover:bg-cyan-300/10"
            >
              <FiCopy />
              Copy hash
            </button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              ["Status", "Verified"],
              ["Owner", "Forensics Lab"],
              ["Chain", "Sepolia"],
              ["Signer count", "3 of 3"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
                <p className="mt-2 text-lg font-semibold text-white">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-[1.25rem] border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">On-chain hash</p>
            <p className="mt-2 break-all font-mono text-cyan-200">{expectedHash}</p>
          </div>
        </article>

        <article className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold text-white">Custody timeline</h3>
              <p className="mt-1 text-sm text-slate-400">
                Every transfer and review event recorded for this item.
              </p>
            </div>
            <FiCheckCircle className="text-2xl text-emerald-300" />
          </div>
          <div className="mt-5 space-y-4">
            {custodyTimeline.map((event, index) => (
              <div
                key={`${event.time}-${index}`}
                className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 md:grid-cols-[160px_minmax(0,1fr)]"
              >
                <div className="text-sm text-slate-400">{event.time}</div>
                <div>
                  <p className="text-sm font-semibold text-white">{event.actor}</p>
                  <p className="mt-1 text-sm text-cyan-200">{event.action}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{event.note}</p>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <aside className="space-y-6">
        <QrCode value={`${params.id}:${expectedHash}`} label={`Evidence ${params.id}`} />

        <section className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-6">
          <div className="flex items-center gap-3">
            <FiSearch className="text-cyan-300" />
            <h3 className="text-lg font-semibold text-white">Hash verifier</h3>
          </div>
          <label className="mt-4 block">
            <span className="text-sm text-slate-300">Paste a candidate hash</span>
            <textarea
              value={hashInput}
              onChange={(event) => setHashInput(event.target.value)}
              className="mt-2 min-h-32 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-mono text-sm text-white outline-none focus:border-cyan-300/30"
            />
          </label>
          <button
            type="button"
            onClick={verifyHash}
            className="mt-4 w-full rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
          >
            Verify integrity
          </button>
          <div
            className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
              result === "match"
                ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
                : result === "mismatch"
                  ? "border-rose-400/20 bg-rose-400/10 text-rose-100"
                  : "border-white/10 bg-white/5 text-slate-300"
            }`}
          >
            {result === "match"
              ? "Hash matches the custody record."
              : result === "mismatch"
                ? "Hash does not match the custody record."
                : "Run the verifier to confirm integrity."}
          </div>
        </section>
      </aside>
    </div>
  );
}