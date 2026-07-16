"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  LayoutDashboard,
  FilePlus,
  Database,
  Workflow,
  Send,
  ShieldCheck,
  History,
  BarChart3,
  Settings,
  User,
  LogOut,
  Search,
  Bell,
  Shield,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { abbreviateWalletAddress, useWallet } from "@/components/wallet-provider";
import { portalRoutes } from "@/lib/dapp-data";

const iconByLabel: Record<string, any> = {
  "Dashboard": LayoutDashboard,
  "Register Evidence": FilePlus,
  "Evidence Records": Database,
  "Chain of Custody": Workflow,
  "Transfer Evidence": Send,
  "Verification": ShieldCheck,
  "Audit Logs": History,
  "Reports": BarChart3,
  "Settings": Settings,
};

export function PortalShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const wallet = useWallet();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, router, user]);

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      await logout();
      router.replace("/login");
    } finally {
      setIsSigningOut(false);
    }
  }

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const query = searchQuery.trim();
    if (!query) return;

    router.push(`/evidence?search=${encodeURIComponent(query)}`);
    setIsMobileMenuOpen(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-6 py-10">
        <div className="w-full max-w-md border border-slate-200 bg-white p-8 text-center shadow-md rounded-2xl">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Shield className="animate-pulse h-6 w-6" />
          </div>
          <h1 className="mt-4 text-lg font-semibold text-slate-900">Establishing Session</h1>
          <p className="mt-2 text-sm text-slate-500">
            Validating security keys and local persistence profiles...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-6 py-10">
        <div className="w-full max-w-md border border-slate-200 bg-white p-8 text-center shadow-md rounded-2xl">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Shield className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-lg font-semibold text-slate-900">Redirecting to Authentication</h1>
          <p className="mt-2 text-sm text-slate-500">
            You must log in to view this directory. Redirecting...
          </p>
          <Link
            href="/login"
            className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  const currentRoute =
    portalRoutes.find(
      (route) => pathname === route.href || pathname.startsWith(`${route.href}/`),
    ) ?? portalRoutes[0];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Banner Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 rounded-lg transition"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
                <Shield className="h-5 w-5" />
              </div>
              <span className="hidden sm:inline-block font-semibold text-slate-900 tracking-tight">
                Blockchain Chain of Custody
              </span>
            </Link>

            <span className="hidden md:inline-block text-slate-300">|</span>

            {/* Breadcrumbs */}
            <div className="hidden md:flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <span>Portal</span>
              <ChevronRight className="h-3 w-3" />
              <span className="text-slate-800">{currentRoute.label}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Search Input */}
            <form className="relative hidden md:block" onSubmit={handleSearchSubmit}>
              <Search className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search evidence ID or Case ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 rounded-lg border border-slate-200 bg-slate-50 py-1.5 pr-3 pl-9 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:bg-white transition"
                aria-label="Search evidence records"
              />
            </form>

            {/* Notifications */}
            <button className="relative p-1.5 text-slate-500 hover:bg-slate-50 rounded-lg transition" type="button">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1.5 h-2 w-2 rounded-full bg-blue-600" />
            </button>

            <div className="hidden lg:flex items-center gap-2">
              {wallet.isConnected ? (
                <>
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span>{abbreviateWalletAddress(wallet.connectedAddress)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => void wallet.disconnectWallet()}
                    disabled={wallet.disconnecting}
                    className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
                  >
                    {wallet.disconnecting ? "Disconnecting..." : "Disconnect Wallet"}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => void wallet.connectWallet()}
                  disabled={!wallet.installed || wallet.connecting}
                  className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition disabled:opacity-50"
                >
                  {wallet.connecting ? "Connecting..." : wallet.installed ? "Connect Wallet" : "Install MetaMask"}
                </button>
              )}
            </div>

            {/* Network Badge */}
            <div className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50/60 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
              Sepolia Node
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <div className="mx-auto flex w-full max-w-7xl flex-1 items-stretch">
        {/* Desktop Sidebar Navigation */}
        <aside className="hidden lg:flex w-72 flex-col border-r border-slate-200 bg-white p-5 space-y-6">
          <nav className="flex-1 space-y-1">
            {portalRoutes.map((route) => {
              const Icon = iconByLabel[route.label] ?? Shield;
              const isActive =
                pathname === route.href || pathname.startsWith(`${route.href}/`);

              return (
                <Link
                  key={route.href}
                  href={route.href}
                  className={`group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Icon className={`h-4.5 w-4.5 ${isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-500"}`} />
                  {route.label}
                </Link>
              );
            })}
          </nav>

          {/* Admin User Info / Logout at Bottom */}
          <div className="border-t border-slate-100 pt-4 space-y-3">
            <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-200 text-slate-700">
                <User className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-900 truncate">Admin Console</p>
                <p className="text-[10px] font-medium text-slate-500 truncate">{user.email}</p>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-950 transition shadow-xs disabled:opacity-60"
            >
              <LogOut className="h-3.5 w-3.5" />
              {isSigningOut ? "Logging out..." : "Logout"}
            </button>
          </div>
        </aside>

        {/* Mobile Slide-out Menu */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden bg-slate-900/40 backdrop-blur-xs">
            <div className="w-72 bg-white p-5 flex flex-col h-full border-r border-slate-200 shadow-xl relative animate-in slide-in-from-left duration-200">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <span className="font-semibold text-slate-900">Navigation</span>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1 text-slate-500 hover:bg-slate-100 rounded-lg transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="flex-1 mt-4 space-y-1">
                {portalRoutes.map((route) => {
                  const Icon = iconByLabel[route.label] ?? Shield;
                  const isActive =
                    pathname === route.href || pathname.startsWith(`${route.href}/`);

                  return (
                    <Link
                      key={route.href}
                      href={route.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                        isActive
                          ? "bg-slate-100 text-slate-900"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <Icon className={`h-4.5 w-4.5 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                      {route.label}
                    </Link>
                  );
                })}
              </nav>

              <div className="border-t border-slate-100 pt-4 space-y-3">
                <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-200 text-slate-700">
                    <User className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-900 truncate">Admin Console</p>
                    <p className="text-[10px] font-medium text-slate-500 truncate">{user.email}</p>
                  </div>
                </div>

                <button
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-950 transition shadow-xs"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  {isSigningOut ? "Logging out..." : "Logout"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        <main className="flex-1 bg-slate-50 p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
