"use client";

import Link from "next/link";
import {
  Shield,
  Upload,
  Database,
  Workflow,
  Send,
  ShieldCheck,
  BarChart3,
} from "lucide-react";

const features = [
  {
    title: "Analytics Dashboard",
    description: "Operational throughput metrics, transit counts, laboratory backlogs, and recent ledger activity at a glance.",
    icon: BarChart3,
  },
  {
    title: "Guided Intake Register",
    description: "Log case information, attach digital files, calculate client-side SHA-256 signatures, and anchor the registry.",
    icon: Upload,
  },
  {
    title: "Evidence Archives",
    description: "Searchable compliance log of all registered digital evidence files, current custodians, and verification entries.",
    icon: Database,
  },
  {
    title: "Chain of Custody Ledger",
    description: "Chronologically trace every single handoff, acceptance time, and node block verification on the network.",
    icon: Workflow,
  },
  {
    title: "Secure Transfer Handover",
    description: "Transfer custody to a validated recipient using MetaMask transaction signatures and justification logging.",
    icon: Send,
  },
  {
    title: "Integrity Verification Center",
    description: "Compare candidate files directly with the decentralized blockchain registry to identify potential tampering.",
    icon: ShieldCheck,
  },
];

export default function Home() {
  return (
    <main className="relative min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between">
      {/* Subtle grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-35 pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-10 border-b border-slate-200 bg-white shadow-xs">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
              <Shield className="h-5 w-5" />
            </div>
            <span className="font-semibold text-slate-900 tracking-tight">
              Blockchain Chain of Custody
            </span>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition"
          >
            Access Admin Console
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 text-center space-y-8 flex-1 flex flex-col justify-center">
        <div className="space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-semibold text-blue-700">
            <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            Active Network Node: Sepolia testnet
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Decentralized Evidence Management
          </h1>
          <p className="text-lg leading-relaxed text-slate-500 max-w-2xl mx-auto">
            A secure DApp where law enforcement agencies, forensic laboratories, courts, and legal teams register, transfer, verify, and audit evidence. Actions are permanently anchored on the blockchain to guarantee absolute integrity.
          </p>
        </div>

        <div className="flex justify-center">
          <Link
            href="/login"
            className="inline-flex h-12 items-center justify-center rounded-xl bg-blue-600 px-8 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
          >
            Launch DApp Console
          </Link>
        </div>

        {/* Directory Cards (Static features) */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 pt-8">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.title}
                className="group relative flex flex-col justify-between border border-slate-200 bg-white p-6 rounded-2xl shadow-xs transition"
              >
                <div className="space-y-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 text-blue-600 border border-slate-100 transition">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-base font-semibold text-slate-900">{feature.title}</h2>
                    <p className="mt-2 text-xs leading-relaxed text-slate-500">{feature.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-200 bg-white py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-400">
          <p>© 2026 Blockchain Chain of Custody. Certified DApp Ledger System. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
