"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  FiActivity,
  FiArrowRight,
  FiFileText,
  FiLogOut,
  FiLayers,
  FiSearch,
  FiShield,
  FiUser,
  FiUploadCloud,
} from "react-icons/fi";
import { useAuth } from "@/components/auth-provider";
import { signOutUser } from "@/lib/auth";
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
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, router, user]);

  async function handleSignOut() {
    setIsSigningOut(true);

    try {
      await signOutUser();
      router.replace("/login");
    } finally {
      setIsSigningOut(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 py-10">
        <div className="w-full max-w-md rounded-[1.75rem] border border-white/10 bg-slate-950/80 p-6 text-center shadow-2xl shadow-slate-950/40 backdrop-blur-xl">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
            <FiShield className="animate-pulse" />
          </div>
          <h1 className="mt-4 text-xl font-semibold text-white">Checking your session</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Loading authentication state before opening the portal.
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 py-10">
        <div className="w-full max-w-md rounded-[1.75rem] border border-white/10 bg-slate-950/80 p-6 text-center shadow-2xl shadow-slate-950/40 backdrop-blur-xl">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
            <FiShield className="animate-pulse" />
          </div>
          <h1 className="mt-4 text-xl font-semibold text-white">Redirecting to login</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            You need an authenticated session to access this portal.
          </p>
          <Link
            href="/login"
            className="mt-5 inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:border-cyan-300/30 hover:bg-cyan-300/10"
          >
            Go to login
          </Link>
        </div>
      </div>
    );
  }

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
            <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-white">
              <FiUser className="text-cyan-300" />
              <span className="truncate">{user.email ?? "Authenticated user"}</span>
            </div>
            <p className="mt-1 text-sm text-slate-300">
              {user.metadata.lastSignInTime
                ? `Last sign-in: ${user.metadata.lastSignInTime}`
                : "Session restored with local persistence"}
            </p>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:border-cyan-300/30 hover:bg-cyan-300/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FiLogOut />
              {isSigningOut ? "Signing out..." : "Log out"}
            </button>
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
                {user.email ?? "Signed in with Firebase Auth"}
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-300">
                <span className="block text-xs uppercase tracking-[0.2em] text-slate-500">
                  Network
                </span>
                Authenticated session
              </div>
            </div>
          </header>
          <div className="p-6 lg:p-8">{children}</div>
        </section>
      </div>
    </div>
  );
}