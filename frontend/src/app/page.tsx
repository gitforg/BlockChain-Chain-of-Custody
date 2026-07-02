import Link from "next/link";
import {
  FiArrowRight,
  FiCheckSquare,
  FiFileText,
  FiLayers,
  FiShield,
  FiUpload,
} from "react-icons/fi";

const screens = [
  {
    title: "Login",
    href: "/login",
    description:
      "Connect MetaMask, detect the wallet, and assign a role before entering the portal.",
    icon: FiShield,
  },
  {
    title: "Dashboard",
    href: "/dashboard",
    description:
      "View evidence throughput, active custodians, and the newest chain activity.",
    icon: FiLayers,
  },
  {
    title: "Register Evidence",
    href: "/register-evidence",
    description:
      "Capture metadata, upload files, and generate a fingerprint in a guided form.",
    icon: FiUpload,
  },
  {
    title: "Evidence Detail",
    href: "/evidence/EV-2048",
    description:
      "Inspect the custody timeline, QR code, and hash verifier for a single item.",
    icon: FiFileText,
  },
  {
    title: "Transfer Custody",
    href: "/transfer-custody",
    description:
      "Choose a recipient, review the payload, and sign the transfer transaction.",
    icon: FiArrowRight,
  },
  {
    title: "Audit Report",
    href: "/audit-report",
    description:
      "Filter event logs and export a clean audit package for reviewers.",
    icon: FiCheckSquare,
  },
];

export default function Home() {
  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8 sm:px-8 lg:px-10">
      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl">
        <div className="grid gap-10 px-6 py-8 md:grid-cols-[1.25fr_0.75fr] md:px-10 md:py-12">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-100">
              <span className="h-2 w-2 rounded-full bg-cyan-300" />
              Step 4 frontend for a blockchain chain-of-custody workflow
            </div>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
                A complete DApp UI for evidence intake, custody transfer, and audit review.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-300">
                This frontend gives you the full operator flow: connect a wallet, register evidence, inspect custody history, sign transfers, and export audit logs.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center rounded-full bg-cyan-400 px-6 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
              >
                Open Login
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex h-12 items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 text-sm font-semibold text-white transition hover:border-cyan-300/40 hover:bg-cyan-300/10"
              >
                View Dashboard
              </Link>
            </div>
          </div>
          <div className="grid gap-4 rounded-[1.75rem] border border-white/10 bg-slate-950/70 p-5">
            <div className="flex items-center justify-between rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
              <span>Network</span>
              <span>Sepolia</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Wallet</p>
                <p className="mt-2 text-lg font-semibold text-white">Connected</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Role</p>
                <p className="mt-2 text-lg font-semibold text-white">Compliance</p>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-400/15 to-sky-500/5 p-4">
              <p className="text-sm text-slate-300">Prototype actions supported</p>
              <div className="mt-3 grid gap-2 text-sm text-slate-100">
                <span>MetaMask login and role assignment</span>
                <span>Evidence intake with file upload</span>
                <span>Custody timeline, QR preview, and hash verification</span>
                <span>Transfer signing and audit export</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {screens.map((screen) => {
          const Icon = screen.icon;

          return (
            <Link
              key={screen.title}
              href={screen.href}
              className="group rounded-[1.5rem] border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-cyan-300/30 hover:bg-white/10"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/75 text-cyan-300">
                    <Icon className="text-lg" />
                  </div>
                  <h2 className="mt-4 text-xl font-semibold text-white">{screen.title}</h2>
                </div>
                <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-300">
                  Open
                </span>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-300">{screen.description}</p>
            </Link>
          );
        })}
      </section>
    </main>
  );
}
