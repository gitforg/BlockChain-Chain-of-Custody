"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Shield, Lock, User, ArrowRight } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { getAuthErrorMessage } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [loading, router, user]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const targetEmail = email.trim();
    const targetPassword = password.trim();

    if (!targetEmail || !targetPassword) {
      setError("Please enter both email and password.");
      return;
    }

    setIsSubmitting(true);

    try {
      await login(targetEmail, targetPassword);
      router.replace("/dashboard");
    } catch (caughtError) {
      setError(getAuthErrorMessage(caughtError));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-900/40 px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-md border border-zinc-800 bg-zinc-900/40 p-8 text-center rounded-md">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded bg-cyan-500/10 text-cyan-400">
            <Shield className="h-6 w-6 animate-pulse" />
          </div>
          <h1 className="mt-4 text-base font-semibold text-zinc-100">Loading Secure Portal</h1>
          <p className="mt-2 text-xs text-zinc-500">
            Authenticating credentials and checking ledger keys...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-zinc-900/40 px-4 py-12 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

      <section className="relative w-full max-w-md space-y-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded bg-cyan-600 text-white">
            <Shield className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
              Blockchain Chain of Custody
            </h1>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
              Federal & Municipal Ledger Portal
            </p>
          </div>
          <p className="max-w-xs text-xs text-zinc-500 leading-relaxed">
            A decentralized application where law enforcement, courts, forensic laboratories, and legal teams securely track, transfer, and verify evidence using blockchain technology.
          </p>
        </div>

        <div className="border border-zinc-800 bg-zinc-900/40 p-8 rounded-md space-y-6">
          <h2 className="text-lg font-semibold text-zinc-50">Security Sign-In</h2>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative mt-2">
                <User className="absolute top-3 left-3 h-4 w-4 text-zinc-600" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded border border-zinc-800 bg-zinc-900/40 py-2.5 pr-4 pl-10 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                  placeholder="officer@agency.gov"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Password
              </label>
              <div className="relative mt-2">
                <Lock className="absolute top-3 left-3 h-4 w-4 text-zinc-600" />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded border border-zinc-800 bg-zinc-900/40 py-2.5 pr-4 pl-10 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="rounded border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-xs text-rose-300 font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded bg-cyan-600 px-4 py-3 text-sm font-semibold text-white hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isSubmitting ? "Verifying..." : "Access Console"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}