"use client";

import { useCallback, useState, type ReactNode } from "react";
import { Check, Copy } from "lucide-react";
import { cn, copyToClipboard, truncateMiddle } from "@/lib/utils";
import type { StatusTone } from "@/lib/types";

/* -------------------------------------------------------------------------- */
/* Status LED + code badge                                                    */
/* -------------------------------------------------------------------------- */

const TONE_STYLES: Record<StatusTone, { dot: string; text: string; border: string; bg: string }> = {
  verified: {
    dot: "bg-emerald-400",
    text: "text-emerald-300",
    border: "border-emerald-500/25",
    bg: "bg-emerald-500/10",
  },
  pending: {
    dot: "bg-amber-400",
    text: "text-amber-300",
    border: "border-amber-500/25",
    bg: "bg-amber-500/10",
  },
  alert: {
    dot: "bg-rose-400",
    text: "text-rose-300",
    border: "border-rose-500/25",
    bg: "bg-rose-500/10",
  },
  info: {
    dot: "bg-cyan-400",
    text: "text-cyan-300",
    border: "border-cyan-500/25",
    bg: "bg-cyan-500/10",
  },
  muted: {
    dot: "bg-zinc-500",
    text: "text-zinc-400",
    border: "border-zinc-700",
    bg: "bg-zinc-800/60",
  },
};

/** A bare signal lamp. `pulse` marks live/active channels only. */
export function Led({
  tone = "muted",
  pulse = false,
  className,
}: {
  tone?: StatusTone;
  pulse?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("relative inline-flex h-1.5 w-1.5 shrink-0", className)}>
      <span
        className={cn(
          "inline-flex h-1.5 w-1.5 rounded-full",
          TONE_STYLES[tone].dot,
          pulse && "led-pulse",
        )}
      />
    </span>
  );
}

/** LED + monospaced code. Replaces rounded pill badges throughout. */
export function StatusBadge({
  tone = "muted",
  code,
  label,
  pulse = false,
  className,
}: {
  tone?: StatusTone;
  code: string;
  label?: string;
  pulse?: boolean;
  className?: string;
}) {
  const styles = TONE_STYLES[tone];

  return (
    <span
      title={label}
      className={cn(
        "inline-flex items-center gap-1.5 rounded border px-1.5 py-0.5",
        styles.border,
        styles.bg,
        className,
      )}
    >
      <Led tone={tone} pulse={pulse} />
      <span className={cn("font-mono text-[10px] font-semibold tracking-wider", styles.text)}>
        {code}
      </span>
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Monospaced data cell with copy affordance                                  */
/* -------------------------------------------------------------------------- */

export function MonoValue({
  value,
  truncate,
  copyable = false,
  onCopied,
  className,
  tone = "default",
}: {
  value: string;
  /** `[lead, tail]` character counts; omit to show in full. */
  truncate?: [number, number];
  copyable?: boolean;
  onCopied?: (label: string) => void;
  className?: string;
  tone?: "default" | "muted" | "accent";
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    const ok = await copyToClipboard(value);
    if (!ok) return;

    setCopied(true);
    onCopied?.(value);
    window.setTimeout(() => setCopied(false), 1400);
  }, [onCopied, value]);

  const display = truncate ? truncateMiddle(value, truncate[0], truncate[1]) : value;
  const toneClass =
    tone === "muted" ? "text-zinc-500" : tone === "accent" ? "text-cyan-300" : "text-zinc-200";

  if (!value) {
    return <span className={cn("font-mono text-xs text-zinc-600", className)}>—</span>;
  }

  if (!copyable) {
    return (
      <span title={value} className={cn("font-mono text-xs", toneClass, className)}>
        {display}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={`Copy: ${value}`}
      className={cn(
        "group inline-flex max-w-full items-center gap-1.5 rounded px-1 py-0.5 -mx-1",
        "hover:bg-zinc-800 focus:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/60",
        className,
      )}
    >
      <span className={cn("truncate font-mono text-xs", toneClass)}>{display}</span>
      {copied ? (
        <Check className="h-3 w-3 shrink-0 text-emerald-400" />
      ) : (
        <Copy className="h-3 w-3 shrink-0 text-zinc-600 opacity-0 transition group-hover:opacity-100" />
      )}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Panel chrome                                                               */
/* -------------------------------------------------------------------------- */

export function Panel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn("rounded-md border border-zinc-800 bg-zinc-900/40", className)}
    >
      {children}
    </section>
  );
}

export function PanelHeader({
  title,
  hint,
  actions,
  icon: Icon,
}: {
  title: string;
  hint?: string;
  actions?: ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <header className="flex items-center justify-between gap-3 border-b border-zinc-800 px-3 py-2">
      <div className="flex min-w-0 items-center gap-2">
        {Icon && <Icon className="h-3.5 w-3.5 shrink-0 text-zinc-500" />}
        <h2 className="truncate text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-300">
          {title}
        </h2>
        {hint && <span className="truncate font-mono text-[10px] text-zinc-600">{hint}</span>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-1.5">{actions}</div>}
    </header>
  );
}

/** Label/value row used in the inspector and metadata grids. */
export function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-0.5 min-w-0", className)}>
      <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-zinc-600">
        {label}
      </span>
      <div className="min-w-0 text-xs text-zinc-200">{children}</div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Loading skeletons                                                          */
/* -------------------------------------------------------------------------- */

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("shimmer rounded", className)} />;
}

export function SkeletonRows({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="divide-y divide-zinc-800/70">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex items-center gap-4 px-3 py-2.5">
          {Array.from({ length: cols }).map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              className={cn("h-3", colIndex === 0 ? "w-28" : colIndex === 1 ? "w-24" : "flex-1")}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Buttons                                                                    */
/* -------------------------------------------------------------------------- */

export function ConsoleButton({
  children,
  onClick,
  variant = "default",
  size = "sm",
  disabled,
  title,
  type = "button",
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "default" | "primary" | "danger" | "ghost";
  size?: "xs" | "sm";
  disabled?: boolean;
  title?: string;
  type?: "button" | "submit";
  className?: string;
}) {
  const variants = {
    default:
      "border-zinc-700 bg-zinc-800/70 text-zinc-200 hover:bg-zinc-700 hover:text-white",
    primary:
      "border-cyan-500/40 bg-cyan-500/15 text-cyan-200 hover:bg-cyan-500/25 hover:text-cyan-100",
    danger: "border-rose-500/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20",
    ghost: "border-transparent bg-transparent text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100",
  } as const;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded border font-medium transition",
        "focus:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/60",
        "disabled:cursor-not-allowed disabled:opacity-40",
        size === "xs" ? "px-1.5 py-1 text-[10px]" : "px-2.5 py-1.5 text-xs",
        variants[variant],
        className,
      )}
    >
      {children}
    </button>
  );
}
