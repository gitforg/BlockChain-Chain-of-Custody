"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  FiCheckCircle,
  FiLogIn,
  FiShield,
  FiUsers,
  FiXCircle,
} from "react-icons/fi";

const roles = [
  {
    id: "investigator",
    title: "Investigator",
    description: "Register evidence and follow active cases.",
  },
  {
    id: "compliance",
    title: "Compliance Admin",
    description: "Approve transfers and export audit reports.",
  },
  {
    id: "auditor",
    title: "Auditor",
    description: "Review custody history and verify hashes.",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [wallet, setWallet] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState("compliance");
  const [status, setStatus] = useState("Connect your MetaMask wallet to begin.");
  const [isConnecting, setIsConnecting] = useState(false);

  async function connectWallet() {
    if (
      typeof window === "undefined" ||
      !(window as Window & { ethereum?: { request: (args: { method: string }) => Promise<string[]> } }).ethereum
    ) {
      setStatus("MetaMask is not available in this browser.");
      return;
    }

    setIsConnecting(true);
    setStatus("Requesting wallet access...");

    try {
      const accounts = await (
        window as Window & {
          ethereum: { request: (args: { method: string }) => Promise<string[]> };
        }
      ).ethereum.request({
        method: "eth_requestAccounts",
      });

      setWallet(accounts[0] ?? null);
      setStatus("Wallet connected. Role verified locally.");
    } catch {
      setStatus("Wallet connection was rejected.");
    } finally {
      setIsConnecting(false);
    }
  }

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100">
            <FiShield />
            Wallet-based access control
          </div>
          <h1 className="mt-8 max-w-xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Sign in with MetaMask and pick the role you will operate as.
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">
            The frontend keeps login local for now, but it still mirrors the intended flow: wallet connection, role assignment, and handoff to the evidence portal.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-4">
              <FiCheckCircle className="text-2xl text-emerald-300" />
              <p className="mt-4 text-sm text-slate-300">Wallet validation</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-4">
              <FiUsers className="text-2xl text-cyan-300" />
              <p className="mt-4 text-sm text-slate-300">Role assignment</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-4">
              <FiLogIn className="text-2xl text-sky-300" />
              <p className="mt-4 text-sm text-slate-300">Portal entry</p>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-2xl shadow-slate-950/40 backdrop-blur-xl">
          <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Wallet</p>
            <div className="mt-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-slate-400">Current account</p>
                <p className="text-lg font-semibold text-white">{wallet ?? "Not connected"}</p>
              </div>
              {wallet ? (
                <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-100">
                  Connected
                </span>
              ) : (
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                  Waiting
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={connectWallet}
            disabled={isConnecting}
            className="mt-4 flex w-full items-center justify-center gap-3 rounded-2xl bg-cyan-400 px-5 py-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isConnecting ? "Connecting..." : "Connect MetaMask"}
          </button>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {roles.map((role) => {
              const active = selectedRole === role.id;

              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setSelectedRole(role.id)}
                  className={`rounded-2xl border px-4 py-4 text-left transition ${
                    active
                      ? "border-cyan-300/30 bg-cyan-400/10"
                      : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-white">{role.title}</span>
                    {active ? (
                      <FiCheckCircle className="text-cyan-300" />
                    ) : (
                      <FiXCircle className="text-slate-500" />
                    )}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{role.description}</p>
                </button>
              );
            })}
          </div>

          <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-300">
            <span className="block text-xs uppercase tracking-[0.2em] text-slate-500">
              Status
            </span>
            <p className="mt-2">{status}</p>
            {wallet ? (
              <p className="mt-2 text-emerald-200">
                Assigned role: {roles.find((role) => role.id === selectedRole)?.title}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="mt-6 w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-semibold text-white transition hover:border-cyan-300/30 hover:bg-cyan-300/10"
          >
            Enter workspace
          </button>
        </div>
      </section>
    </main>
  );
}