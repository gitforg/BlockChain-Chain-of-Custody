"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  FiActivity,
  FiArrowRight,
  FiFileText,
  FiLayers,
  FiSearch,
  FiShield,
  FiUploadCloud,
} from "react-icons/fi";
import { portalRoutes } from "@/lib/dapp-data";

const iconByLabel: Record<string, typeof FiActivity> = {
  Dashboard: FiLayers,
  "Register Evidence": FiUploadCloud,
  "Evidence Detail": FiFileText,
  "Transfer Custody": FiArrowRight,
  "Audit Report": FiSearch,
};

export function PortalShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const currentRoute =
    portalRoutes.find(
      (route) => pathname === route.href || pathname.startsWith(`${route.href}/`),
    ) ?? portalRoutes[0];
  const CurrentIcon = iconByLabel[currentRoute.label] ?? FiActivity;

  return (
    <div className="min-h-screen px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] w-full max-w-7xl gap-4 lg:grid-cols-[290px_minmax(0,1fr)]">
        <aside className="rounded-[1.75rem] border border-white/10 bg-slate-950/70 p-5 shadow-2xl shadow-slate-950/40 backdrop-blur-xl">
          <div className="flex items-center gap-3 rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400 text-slate-950">
              <FiShield />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Chain of Custody</p>
              <p className="text-xs text-slate-400">Evidence control portal</p>
            </div>
          </div>

          <nav className="mt-6 space-y-2">
            {portalRoutes.map((route) => {
              const Icon = iconByLabel[route.label] ?? FiActivity;
              const isActive =
                pathname === route.href || pathname.startsWith(`${route.href}/`);

              return (
                <Link
                  key={route.href}
                  href={route.href}
                  className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition ${
                    isActive
                      ? "border-cyan-300/30 bg-cyan-400/10 text-white"
                      : "border-transparent bg-transparent text-slate-300 hover:border-white/10 hover:bg-white/5"
                  }`}
                >
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                      isActive ? "bg-cyan-400 text-slate-950" : "bg-white/5 text-cyan-300"
                    }`}
                  >
                    <Icon />
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-semibold">{route.label}</span>
                    <span className="block text-xs text-slate-400">{route.summary}</span>
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-gradient-to-br from-cyan-400/10 to-emerald-400/5 p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Session</p>
            <p className="mt-2 text-sm font-semibold text-white">0x7A9B...4C21</p>
            <p className="mt-1 text-sm text-slate-300">Compliance Admin</p>
          </div>
        </aside>

        <section className="rounded-[1.75rem] border border-white/10 bg-white/5 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl">
          <header className="flex flex-col gap-4 border-b border-white/10 px-6 py-5 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.22em] text-slate-300">
                <CurrentIcon className="text-cyan-300" />
                {currentRoute.label}
              </div>
              <h1 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">
                {currentRoute.label}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                {currentRoute.summary}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-300">
                <span className="block text-xs uppercase tracking-[0.2em] text-slate-500">
                  Wallet
                </span>
                Connected via MetaMask
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-300">
                <span className="block text-xs uppercase tracking-[0.2em] text-slate-500">
                  Network
                </span>
                Sepolia testnet
              </div>
            </div>
          </header>
          <div className="p-6 lg:p-8">{children}</div>
        </section>
      </div>
    </div>
  );
}