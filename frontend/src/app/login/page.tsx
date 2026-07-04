"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  FiArrowRight,
  FiCheckCircle,
  FiLock,
  FiShield,
  FiUserCheck,
} from "react-icons/fi";
import { useAuth } from "@/components/auth-provider";
import { getAuthErrorMessage, signInWithEmailPassword } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
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

    if (!email.trim() || !password.trim()) {
      setError("Enter both email and password.");
      return;
    }

    setIsSubmitting(true);

    try {
      await signInWithEmailPassword(email, password);
      router.replace("/dashboard");
    } catch (caughtError) {
      setError(getAuthErrorMessage(caughtError));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 text-center shadow-2xl shadow-slate-950/40 backdrop-blur-xl">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
            <FiShield className="animate-pulse" />
          </div>
          <h1 className="mt-4 text-2xl font-semibold text-white">Loading secure session</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Restoring your Firebase Authentication state.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.15),transparent_42%),linear-gradient(180deg,rgba(2,6,23,0.2),rgba(2,6,23,0.72))]" />
      <section className="relative mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100">
            <FiShield />
            Secure Firebase authentication
          </div>
          <h1 className="mt-8 max-w-xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Sign in to the evidence operations portal.
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">
            Use your Firebase Email/Password account to access the dashboard, custody tools,
            and audit workflows. Admin accounts are created manually in the Firebase Console.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              [FiCheckCircle, "Persistent session"],
              [FiUserCheck, "Admin-only access"],
              [FiLock, "Protected dashboard"],
            ].map(([Icon, label]) => (
              <div
                key={label as string}
                className="rounded-3xl border border-white/10 bg-slate-950/60 p-4"
              >
                <Icon className="text-2xl text-cyan-300" />
                <p className="mt-4 text-sm text-slate-300">{label as string}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-2xl shadow-slate-950/40 backdrop-blur-xl">
          <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Login</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Welcome back</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Enter your admin credentials to continue to the dashboard.
            </p>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <label className="block">
                <span className="text-sm text-slate-300">Email</span>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/30"
                  placeholder="admin@company.com"
                />
              </label>

              <label className="block">
                <span className="text-sm text-slate-300">Password</span>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/30"
                  placeholder="••••••••"
                />
              </label>

              {error ? (
                <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-cyan-400 px-5 py-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? "Signing in..." : "Login"}
                <FiArrowRight />
              </button>
            </form>
          </div>

          <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-300">
            <span className="block text-xs uppercase tracking-[0.2em] text-slate-500">
              Access policy
            </span>
            <p className="mt-2">
              Only authenticated users can reach the dashboard. Sessions persist across refreshes
              through Firebase local persistence.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}