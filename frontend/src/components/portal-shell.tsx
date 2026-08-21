"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  Database,
  FilePlus,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Send,
  Settings,
  Shield,
  ShieldCheck,
  Workflow,
  X,
} from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { abbreviateWalletAddress, useWallet } from "@/components/wallet-provider";
import { CommandPaletteProvider, useCommandPalette } from "@/components/console/command-palette";
import { TelemetryBar } from "@/components/console/telemetry-bar";
import { ToastProvider } from "@/components/ui/toast";
import { ConsoleButton, Led, Skeleton } from "@/components/ui/primitives";
import { portalRoutes } from "@/lib/dapp-data";
import { cn } from "@/lib/utils";

const ICON_BY_LABEL: Record<string, React.ComponentType<{ className?: string }>> = {
  Dashboard: LayoutDashboard,
  "Register Evidence": FilePlus,
  "Evidence Records": Database,
  "Chain of Custody": Workflow,
  "Transfer Evidence": Send,
  Verification: ShieldCheck,
  "Audit Logs": History,
  Reports: BarChart3,
  Settings: Settings,
};

/* -------------------------------------------------------------------------- */
/* Navigation                                                                 */
/* -------------------------------------------------------------------------- */

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-0.5 p-2">
      {portalRoutes.map((route) => {
        const Icon = ICON_BY_LABEL[route.label] ?? Shield;
        const isActive = pathname === route.href || pathname.startsWith(`${route.href}/`);

        return (
          <Link
            key={route.href}
            href={route.href}
            onClick={onNavigate}
            title={route.summary}
            className={cn(
              "group relative flex items-center gap-2.5 rounded px-2.5 py-1.5 text-xs transition",
              isActive ? "text-zinc-100" : "text-zinc-500 hover:bg-zinc-800/60 hover:text-zinc-200",
            )}
          >
            {isActive && (
              <motion.span
                layoutId="nav-active"
                className="absolute inset-0 rounded bg-zinc-800"
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
              />
            )}
            <Icon
              className={cn(
                "relative h-3.5 w-3.5 shrink-0",
                isActive ? "text-cyan-400" : "text-zinc-600 group-hover:text-zinc-400",
              )}
            />
            <span className="relative font-medium">{route.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

/* -------------------------------------------------------------------------- */
/* Header                                                                     */
/* -------------------------------------------------------------------------- */

function ConsoleHeader({ onOpenMobileNav }: { onOpenMobileNav: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const wallet = useWallet();
  const palette = useCommandPalette();
  const [signingOut, setSigningOut] = useState(false);

  const currentRoute =
    portalRoutes.find(
      (route) => pathname === route.href || pathname.startsWith(`${route.href}/`),
    ) ?? portalRoutes[0];

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await logout();
      router.replace("/login");
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-11 shrink-0 items-center gap-3 border-b border-zinc-800 bg-zinc-950/95 px-3 backdrop-blur">
      <button
        type="button"
        onClick={onOpenMobileNav}
        aria-label="Open navigation"
        className="rounded p-1 text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-200 lg:hidden"
      >
        <Menu className="h-4 w-4" />
      </button>

      <Link href="/dashboard" className="flex shrink-0 items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded border border-cyan-500/30 bg-cyan-500/10">
          <Shield className="h-3.5 w-3.5 text-cyan-400" />
        </div>
        <span className="hidden text-xs font-semibold tracking-tight text-zinc-100 sm:inline">
          CHAIN&nbsp;OF&nbsp;CUSTODY
        </span>
      </Link>

      <div className="hidden items-center gap-1.5 md:flex">
        <span className="text-zinc-700">/</span>
        <span className="font-mono text-[11px] text-zinc-400">{currentRoute.label}</span>
      </div>

      <div className="flex-1" />

      {/* Command palette trigger — the primary search affordance. */}
      <button
        type="button"
        onClick={palette.toggle}
        className="group flex h-7 items-center gap-2 rounded border border-zinc-800 bg-zinc-900 px-2 text-zinc-500 transition hover:border-zinc-700 hover:text-zinc-300"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="hidden text-[11px] sm:inline">Search evidence…</span>
        <kbd className="hidden rounded border border-zinc-800 bg-zinc-950 px-1 py-0.5 font-mono text-[9px] text-zinc-600 sm:inline">
          ⌘K
        </kbd>
      </button>

      {/* Wallet — always reachable, at every breakpoint. */}
      {wallet.isConnected ? (
        <button
          type="button"
          onClick={() =>
            wallet.isOnTargetChain
              ? undefined
              : void wallet.switchToTargetChain().catch(() => undefined)
          }
          title={wallet.isOnTargetChain ? wallet.connectedAddress : "Wrong network — click to switch"}
          className="flex h-7 items-center gap-1.5 rounded border border-zinc-800 bg-zinc-900 px-2 transition hover:border-zinc-700"
        >
          <Led tone={wallet.isOnTargetChain ? "verified" : "pending"} pulse />
          <span className="font-mono text-[10px] text-zinc-300">
            {abbreviateWalletAddress(wallet.connectedAddress)}
          </span>
        </button>
      ) : wallet.installed ? (
        <ConsoleButton
          variant="primary"
          size="xs"
          onClick={() => void wallet.connectWallet().catch(() => undefined)}
          disabled={wallet.connecting}
        >
          {wallet.connecting ? "CONNECTING…" : "CONNECT WALLET"}
        </ConsoleButton>
      ) : (
        <a
          href="https://metamask.io/download/"
          target="_blank"
          rel="noreferrer"
          className="rounded border border-amber-500/40 bg-amber-500/10 px-1.5 py-1 font-mono text-[10px] text-amber-300 transition hover:bg-amber-500/20"
        >
          INSTALL METAMASK
        </a>
      )}

      <div className="hidden items-center gap-2 border-l border-zinc-800 pl-3 sm:flex">
        <span className="max-w-[140px] truncate font-mono text-[10px] text-zinc-500">
          {user?.email}
        </span>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          title="Sign out"
          className="rounded p-1 text-zinc-600 transition hover:bg-zinc-800 hover:text-rose-300 disabled:opacity-50"
        >
          <LogOut className="h-3.5 w-3.5" />
        </button>
      </div>
    </header>
  );
}

/* -------------------------------------------------------------------------- */
/* Shell                                                                      */
/* -------------------------------------------------------------------------- */

function ShellFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const wallet = useWallet();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 pb-7">
      <ConsoleHeader onOpenMobileNav={() => setMobileNavOpen(true)} />

      {wallet.error && (
        <div className="flex items-start gap-2 border-b border-rose-500/30 bg-rose-500/10 px-3 py-1.5">
          <p className="flex-1 text-[11px] text-rose-200">{wallet.error}</p>
          <button
            type="button"
            onClick={wallet.clearError}
            aria-label="Dismiss"
            className="rounded p-0.5 text-rose-400 hover:bg-rose-500/20"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="flex flex-1 items-stretch">
        <aside className="hidden w-52 shrink-0 border-r border-zinc-800 bg-zinc-950 lg:block">
          <div className="sticky top-11">
            <NavList />
          </div>
        </aside>

        {/* Mobile drawer */}
        <AnimatePresence>
          {mobileNavOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileNavOpen(false)}
                className="fixed inset-0 z-40 bg-black/70 lg:hidden"
              />
              <motion.aside
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", stiffness: 420, damping: 38 }}
                className="fixed inset-y-0 left-0 z-50 w-60 border-r border-zinc-800 bg-zinc-950 lg:hidden"
              >
                <div className="flex h-11 items-center justify-between border-b border-zinc-800 px-3">
                  <span className="text-xs font-semibold text-zinc-200">Navigation</span>
                  <button
                    type="button"
                    onClick={() => setMobileNavOpen(false)}
                    aria-label="Close navigation"
                    className="rounded p-1 text-zinc-500 hover:bg-zinc-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <NavList onNavigate={() => setMobileNavOpen(false)} />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Route content — cross-fades instead of hard-cutting. */}
        <main className="min-w-0 flex-1">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="p-3 lg:p-4"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <TelemetryBar />
    </div>
  );
}

export function PortalShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, router, user]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-zinc-950">
        <div className="h-11 border-b border-zinc-800" />
        <div className="flex flex-1">
          <div className="hidden w-52 border-r border-zinc-800 p-2 lg:block">
            {Array.from({ length: 9 }).map((_, index) => (
              <Skeleton key={index} className="mb-1 h-7 w-full" />
            ))}
          </div>
          <div className="flex-1 space-y-3 p-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
        <div className="w-full max-w-sm rounded-md border border-zinc-800 bg-zinc-900/50 p-6 text-center">
          <Shield className="mx-auto h-6 w-6 text-cyan-400" />
          <h1 className="mt-3 text-sm font-semibold text-zinc-100">Authentication required</h1>
          <p className="mt-1 text-xs text-zinc-500">Redirecting to the sign-in portal…</p>
          <Link
            href="/login"
            className="mt-4 inline-block rounded border border-cyan-500/40 bg-cyan-500/15 px-3 py-1.5 text-xs font-medium text-cyan-200 hover:bg-cyan-500/25"
          >
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <CommandPaletteProvider>
        <ShellFrame>{children}</ShellFrame>
      </CommandPaletteProvider>
    </ToastProvider>
  );
}
