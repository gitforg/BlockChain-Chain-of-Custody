"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Boxes, Database, HardDrive, Radio, Wallet } from "lucide-react";
import { useTelemetry } from "@/hooks/use-telemetry";
import { abbreviateWalletAddress, useWallet } from "@/components/wallet-provider";
import { Led } from "@/components/ui/primitives";
import { cn, truncateMiddle } from "@/lib/utils";
import type { StatusTone } from "@/lib/types";

function Segment({
  icon: Icon,
  label,
  value,
  tone,
  pulse,
  title,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  tone: StatusTone;
  pulse?: boolean;
  title?: string;
  onClick?: () => void;
}) {
  const Wrapper = onClick ? "button" : "div";

  return (
    <Wrapper
      {...(onClick ? { type: "button" as const, onClick } : {})}
      title={title}
      className={cn(
        "flex h-full items-center gap-1.5 border-r border-zinc-800 px-2.5",
        onClick && "transition hover:bg-zinc-800/70",
      )}
    >
      <Icon className="h-3 w-3 shrink-0 text-zinc-600" />
      <span className="hidden text-[10px] font-medium uppercase tracking-[0.08em] text-zinc-600 sm:inline">
        {label}
      </span>
      <Led tone={tone} pulse={pulse} />
      <span className="font-mono text-[10px] text-zinc-300">{value}</span>
    </Wrapper>
  );
}

/**
 * Sticky environment status bar pinned to the bottom of the console.
 * Everything here is live: node reachability, block height, IPFS pinning,
 * database health and the connected signer.
 */
export function TelemetryBar() {
  const { telemetry } = useTelemetry();
  const wallet = useWallet();

  const chainTone: StatusTone = telemetry.chain.online
    ? telemetry.chain.contractDeployed
      ? "verified"
      : "pending"
    : "alert";

  const rpcHost = telemetry.chain.rpcUrl.replace(/^https?:\/\//, "");

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex h-7 items-stretch border-t border-zinc-800 bg-zinc-950/95 backdrop-blur">
      <div className="flex items-center gap-1.5 border-r border-zinc-800 px-2.5">
        <Led tone={chainTone} pulse={telemetry.chain.online} />
        <span className="font-mono text-[10px] font-semibold tracking-wider text-zinc-300">
          {telemetry.chain.online ? "NODE ONLINE" : "NODE OFFLINE"}
        </span>
      </div>

      <Segment
        icon={Radio}
        label="RPC"
        tone={telemetry.chain.online ? "verified" : "alert"}
        value={
          <>
            {rpcHost}
            {telemetry.chain.chainId !== null && (
              <span className="text-zinc-600"> · chain {telemetry.chain.chainId}</span>
            )}
          </>
        }
        title={`RPC endpoint: ${telemetry.chain.rpcUrl}`}
      />

      {/* Block height — the number ticks, so animate only the digits. */}
      <div
        className="flex h-full items-center gap-1.5 border-r border-zinc-800 px-2.5"
        title="Current block height"
      >
        <Boxes className="h-3 w-3 shrink-0 text-zinc-600" />
        <span className="hidden text-[10px] font-medium uppercase tracking-[0.08em] text-zinc-600 sm:inline">
          Block
        </span>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={telemetry.chain.blockNumber ?? "pending"}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.16 }}
            className="font-mono text-[10px] text-emerald-300"
          >
            #{telemetry.chain.blockNumber ?? "—"}
          </motion.span>
        </AnimatePresence>
      </div>

      <Segment
        icon={HardDrive}
        label="IPFS"
        tone={telemetry.ipfs.configured ? "verified" : "pending"}
        value={telemetry.ipfs.configured ? `Online (${telemetry.ipfs.provider})` : "Simulated"}
        title={
          telemetry.ipfs.configured
            ? `Pinning via ${telemetry.ipfs.provider} — gateway ${telemetry.ipfs.gateway}`
            : "PINATA_JWT is not configured; CIDs are simulated."
        }
      />

      <Segment
        icon={Database}
        label="Registry"
        tone={telemetry.database.online ? "verified" : "alert"}
        value={`${telemetry.database.evidenceCount} records`}
        title="Evidence rows currently in the database"
      />

      <div className="hidden flex-1 md:block" />

      {/* Contract address, right-aligned with the signer. */}
      {telemetry.chain.registryAddress && (
        <div
          className="hidden h-full items-center gap-1.5 border-l border-zinc-800 px-2.5 lg:flex"
          title={`EvidenceRegistry: ${telemetry.chain.registryAddress}`}
        >
          <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-zinc-600">
            Registry
          </span>
          <span className="font-mono text-[10px] text-zinc-400">
            {truncateMiddle(telemetry.chain.registryAddress, 6, 4)}
          </span>
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          if (!wallet.isConnected) void wallet.connectWallet().catch(() => undefined);
          else if (!wallet.isOnTargetChain) void wallet.switchToTargetChain().catch(() => undefined);
        }}
        title={
          wallet.isConnected
            ? wallet.isOnTargetChain
              ? `Signer ${wallet.connectedAddress}`
              : "Wrong network — click to switch"
            : "Click to connect MetaMask"
        }
        className="flex h-full items-center gap-1.5 border-l border-zinc-800 px-2.5 transition hover:bg-zinc-800/70"
      >
        <Wallet className="h-3 w-3 shrink-0 text-zinc-600" />
        <Led
          tone={wallet.isConnected ? (wallet.isOnTargetChain ? "verified" : "pending") : "muted"}
          pulse={wallet.isConnected && wallet.isOnTargetChain}
        />
        <span className="font-mono text-[10px] text-zinc-300">
          {wallet.isConnected
            ? abbreviateWalletAddress(wallet.connectedAddress)
            : wallet.installed
              ? "CONNECT"
              : "NO WALLET"}
        </span>
      </button>
    </div>
  );
}
