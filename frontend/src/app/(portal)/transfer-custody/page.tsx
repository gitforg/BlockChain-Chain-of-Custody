"use client";

import { useState } from "react";
import { FiArrowRight, FiCheckCircle, FiUsers } from "react-icons/fi";
import { transferRecipients } from "@/lib/dapp-data";

export default function TransferCustodyPage() {
  const [recipientIndex, setRecipientIndex] = useState(0);
  const [status, setStatus] = useState<"idle" | "signing" | "signed">("idle");

  const recipient = transferRecipients[recipientIndex];

  async function signTransaction() {
    setStatus("signing");
    await new Promise((resolve) => setTimeout(resolve, 600));
    setStatus("signed");
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <section className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-6">
        <div className="flex items-center gap-3">
          <FiUsers className="text-cyan-300" />
          <div>
            <h2 className="text-xl font-semibold text-white">Select recipient</h2>
            <p className="mt-1 text-sm text-slate-400">
              Choose the wallet that will receive custody of the evidence item.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {transferRecipients.map((entry, index) => {
            const active = recipientIndex === index;

            return (
              <button
                key={entry.wallet}
                type="button"
                onClick={() => setRecipientIndex(index)}
                className={`w-full rounded-2xl border p-4 text-left transition ${
                  active
                    ? "border-cyan-300/30 bg-cyan-400/10"
                    : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-white">{entry.name}</p>
                    <p className="mt-1 text-sm text-slate-400">{entry.role}</p>
                  </div>
                  <span className="rounded-full border border-white/10 bg-slate-950/60 px-3 py-1 text-xs text-cyan-200">
                    {entry.wallet}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <aside className="space-y-6">
        <section className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-6">
          <h3 className="text-lg font-semibold text-white">Transaction summary</h3>
          <div className="mt-5 grid gap-4 text-sm">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Evidence</p>
              <p className="mt-2 text-white">EV-2048</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Recipient</p>
              <p className="mt-2 text-white">{recipient.name}</p>
              <p className="mt-1 text-slate-400">{recipient.wallet}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Authorization</p>
              <p className="mt-2 text-slate-300">
                Two signers required, one signer provided locally.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={signTransaction}
            className="mt-6 flex w-full items-center justify-center gap-3 rounded-2xl bg-cyan-400 px-5 py-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
          >
            {status === "signing" ? "Signing..." : "Sign transfer transaction"}
            <FiArrowRight />
          </button>

          {status === "signed" ? (
            <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
              <div className="flex items-center gap-2">
                <FiCheckCircle /> Transfer signed and queued for confirmation.
              </div>
            </div>
          ) : null}
        </section>

        <section className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-6">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Signed payload</p>
          <p className="mt-3 break-all rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-mono text-sm text-cyan-200">
            0x55db2f...e8c1
          </p>
        </section>
      </aside>
    </div>
  );
}