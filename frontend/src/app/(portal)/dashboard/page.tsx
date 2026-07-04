"use client";

import Link from "next/link";
import { FiArrowRight, FiClock, FiFileText, FiLayers, FiUploadCloud } from "react-icons/fi";
import { useAuth } from "@/components/auth-provider";

const workflowActions = [
  {
    href: "/register-evidence",
    title: "Register evidence",
    description: "Start a new intake record and attach the supporting files.",
    icon: FiUploadCloud,
  },
  {
    href: "/transfer-custody",
    title: "Transfer custody",
    description: "Prepare a handoff and sign the transfer transaction.",
    icon: FiArrowRight,
  },
  {
    href: "/audit-report",
    title: "Audit report",
    description: "Review the event log and export a compliance report.",
    icon: FiFileText,
  },
  {
    href: "/",
    title: "Portal overview",
    description: "Jump back to the main entry screen and route index.",
    icon: FiLayers,
  },
];

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-gradient-to-br from-cyan-400/10 via-white/5 to-slate-950/80 p-6 shadow-2xl shadow-cyan-950/20">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Dashboard</p>
            <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
              Secure portal workspace
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              Use the dashboard to launch the core chain-of-custody workflows. No mock evidence
              rows are shown here, only live actions and the current authenticated session.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-300">
              <span className="block text-xs uppercase tracking-[0.2em] text-slate-500">User</span>
              <span className="mt-1 block truncate text-white">{user?.email ?? "Signed in"}</span>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-300">
              <span className="block text-xs uppercase tracking-[0.2em] text-slate-500">
                Session
              </span>
              <span className="mt-1 block text-white">
                {user?.metadata.lastSignInTime ? "Restored from Firebase" : "Active"}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {workflowActions.map((action) => {
          const Icon = action.icon;

          return (
            <Link
              key={action.title}
              href={action.href}
              className="group rounded-[1.5rem] border border-white/10 bg-white/5 p-5 transition duration-300 hover:-translate-y-1 hover:border-cyan-300/30 hover:bg-white/10"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/75 text-cyan-300">
                    <Icon className="text-lg" />
                  </div>
                  <h2 className="mt-4 text-xl font-semibold text-white">{action.title}</h2>
                </div>
                <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-300 transition group-hover:border-cyan-300/30 group-hover:text-white">
                  Open
                </span>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-300">{action.description}</p>
            </Link>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-5">
          <div className="flex items-center gap-3">
            <FiClock className="text-cyan-300" />
            <div>
              <h2 className="text-xl font-semibold text-white">Session status</h2>
              <p className="mt-1 text-sm text-slate-400">
                Authentication remains active while you navigate the portal.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
              <span className="block text-xs uppercase tracking-[0.2em] text-slate-500">
                Signed in as
              </span>
              <p className="mt-2 text-white">{user?.email ?? "Unknown user"}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
              <span className="block text-xs uppercase tracking-[0.2em] text-slate-500">
                Persistence
              </span>
              <p className="mt-2 text-white">Firebase local session persistence is enabled.</p>
            </div>
          </div>
        </article>

        <article className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-5">
          <h2 className="text-xl font-semibold text-white">What you can do next</h2>
          <p className="mt-1 text-sm text-slate-400">
            Every button below routes to an existing portal screen.
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {workflowActions.map((action) => (
              <Link
                key={`${action.href}-secondary`}
                href={action.href}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-300 transition hover:border-cyan-300/30 hover:bg-cyan-300/10 hover:text-white"
              >
                <span className="block font-semibold text-white">{action.title}</span>
                <span className="mt-1 block leading-6 text-slate-400">{action.description}</span>
              </Link>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}