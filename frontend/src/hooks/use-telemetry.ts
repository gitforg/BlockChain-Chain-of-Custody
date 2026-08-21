"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TARGET_CHAIN_ID, TARGET_RPC_URL, getFallbackRpcProvider } from "@/lib/chain";

export interface Telemetry {
  chain: {
    rpcUrl: string;
    registryAddress: string;
    online: boolean;
    chainId: number | null;
    blockNumber: number | null;
    contractDeployed: boolean;
    artifactPresent: boolean;
    error: string;
  };
  ipfs: { provider: string; configured: boolean; gateway: string };
  database: { online: boolean; evidenceCount: number; error: string };
  serverTime: string;
}

const INITIAL: Telemetry = {
  chain: {
    rpcUrl: TARGET_RPC_URL,
    registryAddress: "",
    online: false,
    chainId: null,
    blockNumber: null,
    contractDeployed: false,
    artifactPresent: false,
    error: "",
  },
  ipfs: { provider: "Pinata", configured: false, gateway: "" },
  database: { online: false, evidenceCount: 0, error: "" },
  serverTime: "",
};

/**
 * Live environment telemetry for the status bar.
 *
 * Block height is polled straight from the RPC (fast, no backend hop) while the
 * richer service picture comes from GET /api/health on a slower cadence.
 */
export function useTelemetry(blockPollMs = 4000, healthPollMs = 20000) {
  const [telemetry, setTelemetry] = useState<Telemetry>(INITIAL);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);

  const pollHealth = useCallback(async () => {
    try {
      const response = await fetch("/api/health");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = (await response.json()) as Telemetry;
      if (mounted.current) setTelemetry(data);
    } catch {
      if (mounted.current) {
        setTelemetry((current) => ({
          ...current,
          database: { ...current.database, online: false },
        }));
      }
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  const pollBlock = useCallback(async () => {
    try {
      const provider = getFallbackRpcProvider();
      const blockNumber = await provider.getBlockNumber();

      if (mounted.current) {
        setTelemetry((current) => ({
          ...current,
          chain: {
            ...current.chain,
            online: true,
            blockNumber,
            chainId: current.chain.chainId ?? TARGET_CHAIN_ID,
          },
        }));
      }
    } catch {
      if (mounted.current) {
        setTelemetry((current) => ({ ...current, chain: { ...current.chain, online: false } }));
      }
    }
  }, []);

  useEffect(() => {
    mounted.current = true;

    void pollHealth();
    void pollBlock();

    const healthTimer = window.setInterval(pollHealth, healthPollMs);
    const blockTimer = window.setInterval(pollBlock, blockPollMs);

    return () => {
      mounted.current = false;
      window.clearInterval(healthTimer);
      window.clearInterval(blockTimer);
    };
  }, [blockPollMs, healthPollMs, pollBlock, pollHealth]);

  return { telemetry, loading, refresh: pollHealth };
}
