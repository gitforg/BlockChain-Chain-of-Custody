"use client";

import { useCallback, useEffect, useState } from "react";
import {
  TARGET_CHAIN_ID,
  TARGET_RPC_URL,
  describeWalletError,
  getRegistryAddress,
  getTargetChainName,
} from "@/lib/chain";

type Row = { label: string; value: string; ok: boolean | null; hint?: string };

/**
 * Standalone MetaMask diagnostics. Deliberately outside the (portal) group so it
 * needs no login and cannot be blocked by the auth guard.
 */
export default function WalletDebugPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [log, setLog] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const append = useCallback((line: string) => {
    setLog((current) => [...current, `${new Date().toLocaleTimeString()}  ${line}`]);
  }, []);

  const scan = useCallback(async () => {
    const eth = (window as any).ethereum;
    const next: Row[] = [];

    next.push({
      label: "Page origin",
      value: window.location.origin,
      ok: /^https:|^http:\/\/localhost|^http:\/\/127\.0\.0\.1/.test(window.location.origin),
      hint: "MetaMask and crypto.subtle behave best on localhost or https. A LAN IP such as 192.168.x.x can break both.",
    });

    next.push({
      label: "Secure context",
      value: String(window.isSecureContext),
      ok: window.isSecureContext,
      hint: "Must be true for crypto.subtle file hashing.",
    });

    next.push({
      label: "window.ethereum present",
      value: eth ? "yes" : "NO",
      ok: Boolean(eth),
      hint: "If NO: MetaMask is not installed, is disabled for this site, or this browser profile has no extension.",
    });

    next.push({
      label: "ethereum.isMetaMask",
      value: eth ? String(Boolean(eth.isMetaMask)) : "n/a",
      ok: eth ? Boolean(eth.isMetaMask) : null,
      hint: "If false, another wallet extension has taken over window.ethereum.",
    });

    const providers = eth?.providers;
    next.push({
      label: "Competing providers",
      value: Array.isArray(providers)
        ? `${providers.length} (${providers
            .map((p: any) =>
              p?.isMetaMask ? "MetaMask" : p?.isCoinbaseWallet ? "Coinbase" : p?.isPhantom ? "Phantom" : "unknown",
            )
            .join(", ")})`
        : "single provider",
      ok: null,
    });

    if (eth) {
      try {
        const chainHex = await eth.request({ method: "eth_chainId" });
        const chainNum = Number.parseInt(chainHex, 16);
        next.push({
          label: "MetaMask chain id",
          value: `${chainNum} (${chainHex})`,
          ok: chainNum === TARGET_CHAIN_ID,
          hint: `App expects ${TARGET_CHAIN_ID}. Use the Connect button below — it will add/switch the network.`,
        });
      } catch (error) {
        next.push({ label: "MetaMask chain id", value: describeWalletError(error), ok: false });
      }

      try {
        const accounts: string[] = await eth.request({ method: "eth_accounts" });
        next.push({
          label: "Authorised accounts",
          value: accounts.length ? accounts.join(", ") : "none (not connected yet)",
          ok: accounts.length > 0,
          hint: "Empty is normal before you click Connect. If it stays empty after connecting, MetaMask is locked.",
        });
      } catch (error) {
        next.push({ label: "Authorised accounts", value: describeWalletError(error), ok: false });
      }
    }

    next.push({ label: "Expected network", value: `${getTargetChainName()} (${TARGET_CHAIN_ID})`, ok: null });
    next.push({ label: "Expected RPC", value: TARGET_RPC_URL, ok: null });
    next.push({ label: "Registry address", value: getRegistryAddress(), ok: null });

    // Can the browser reach the chain and the backend directly?
    try {
      const res = await fetch(TARGET_RPC_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", method: "eth_chainId", params: [], id: 1 }),
      });
      const body = await res.json();
      next.push({
        label: "Hardhat node reachable",
        value: `chain ${Number.parseInt(body.result, 16)}`,
        ok: Number.parseInt(body.result, 16) === TARGET_CHAIN_ID,
      });
    } catch (error: any) {
      next.push({
        label: "Hardhat node reachable",
        value: `NO - ${error.message}`,
        ok: false,
        hint: "Run: cd contracts && npx hardhat node",
      });
    }

    try {
      const res = await fetch("/api/stats");
      next.push({
        label: "Backend reachable",
        value: res.ok ? `yes (HTTP ${res.status})` : `HTTP ${res.status}`,
        ok: res.ok,
        hint: "Run: cd backend && npm run dev",
      });
    } catch (error: any) {
      next.push({ label: "Backend reachable", value: `NO - ${error.message}`, ok: false });
    }

    setRows(next);
  }, []);

  useEffect(() => {
    append("Scanning...");
    void scan().then(() => append("Scan complete."));

    const onInit = () => {
      append("ethereum#initialized fired (MetaMask injected late) - rescanning");
      void scan();
    };
    window.addEventListener("ethereum#initialized", onInit);
    return () => window.removeEventListener("ethereum#initialized", onInit);
  }, [append, scan]);

  async function handleConnect() {
    setBusy(true);
    append("Requesting eth_requestAccounts ...");

    try {
      const { connectWallet, ensureTargetNetwork } = await import("@/lib/chain");
      const result = await connectWallet();
      append(`Connected: ${result.address} on chain ${result.chainId}`);

      await ensureTargetNetwork();
      append(`Network confirmed as ${getTargetChainName()}.`);
      append("SUCCESS - wallet is usable. Registration should work now.");
    } catch (error: any) {
      append(`FAILED: ${error?.message || String(error)}`);
      append(`raw code: ${JSON.stringify((error as any)?.code ?? "none")}`);
    } finally {
      setBusy(false);
      void scan();
    }
  }

  return (
    <main className="min-h-screen bg-zinc-900/40 p-6 text-zinc-200">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-bold text-zinc-100">MetaMask Diagnostics</h1>
          <p className="text-sm text-zinc-500">
            No login required. Every check below runs in your browser.
          </p>
        </header>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
          <table className="w-full text-left text-sm">
            <tbody className="divide-y divide-zinc-800">
              {rows.map((row) => (
                <tr key={row.label} className="align-top">
                  <td className="w-56 py-2.5 pr-4 font-medium text-zinc-400">{row.label}</td>
                  <td className="py-2.5">
                    <span
                      className={`font-mono text-xs break-all ${
                        row.ok === false
                          ? "text-rose-700"
                          : row.ok === true
                            ? "text-emerald-700"
                            : "text-zinc-300"
                      }`}
                    >
                      {row.ok === false ? "✗ " : row.ok === true ? "✓ " : ""}
                      {row.value}
                    </span>
                    {row.ok === false && row.hint && (
                      <p className="mt-1 text-xs text-zinc-500">{row.hint}</p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleConnect}
            disabled={busy}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyan-500 disabled:opacity-50"
          >
            {busy ? "Connecting..." : "Test Connect"}
          </button>
          <button
            type="button"
            onClick={() => void scan()}
            className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-5 py-2.5 text-sm font-semibold text-zinc-300 hover:bg-slate-50"
          >
            Rescan
          </button>
        </div>

        <section className="rounded-2xl border border-zinc-800 bg-slate-900 p-5">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-600">
            Event log
          </h2>
          <pre className="overflow-x-auto text-xs leading-relaxed text-zinc-800 whitespace-pre-wrap">
            {log.join("\n") || "(empty)"}
          </pre>
        </section>
      </div>
    </main>
  );
}
