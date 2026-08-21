"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TooltipContentProps } from "recharts";
import { cn } from "@/lib/utils";

const AXIS_STYLE = {
  stroke: "#3f3f46",
  fontSize: 10,
  tickLine: false,
} as const;

/**
 * Shared dark tooltip. Recharts' default chrome is far too light for this console.
 *
 * Recharts injects these props at render time, so they are optional here —
 * otherwise passing `<ConsoleTooltip />` to `content` fails typechecking.
 */
type ConsoleTooltipProps = Partial<TooltipContentProps<number, string>> & { unit?: string };

function ConsoleTooltip({ active, payload, label, unit = "" }: ConsoleTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded border border-zinc-700 bg-zinc-950/95 px-2.5 py-1.5 shadow-xl shadow-black/60 backdrop-blur">
      <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">{label}</p>
      {payload.map((entry, index) => (
        <p key={index} className="mt-0.5 flex items-baseline gap-2">
          <span
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: entry.color ?? "#22d3ee" }}
          />
          <span className="font-mono text-xs font-semibold text-zinc-100">
            {entry.value}
            {unit}
          </span>
          <span className="text-[10px] text-zinc-500">{entry.name}</span>
        </p>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Ingestion trend                                                            */
/* -------------------------------------------------------------------------- */

export function IngestionTrendChart({
  data,
  className,
}: {
  data: { label: string; count: number }[];
  className?: string;
}) {
  return (
    <div className={cn("h-44 w-full", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -22 }}>
          <defs>
            <linearGradient id="ingestion-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
            </linearGradient>
          </defs>

          <XAxis dataKey="label" {...AXIS_STYLE} axisLine={{ stroke: "#27272a" }} interval="preserveStartEnd" />
          <YAxis {...AXIS_STYLE} axisLine={false} allowDecimals={false} width={34} />

          <Tooltip
            cursor={{ stroke: "#3f3f46", strokeWidth: 1 }}
            content={<ConsoleTooltip />}
          />

          <Area
            type="monotone"
            dataKey="count"
            name="registrations"
            stroke="#22d3ee"
            strokeWidth={1.5}
            fill="url(#ingestion-fill)"
            dot={false}
            activeDot={{ r: 3, fill: "#22d3ee", stroke: "#09090b", strokeWidth: 2 }}
            isAnimationActive
            animationDuration={420}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Distribution breakdown                                                     */
/* -------------------------------------------------------------------------- */

export function DistributionChart({
  data,
  className,
}: {
  data: { name: string; value: number; color: string }[];
  className?: string;
}) {
  return (
    <div className={cn("h-44 w-full", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 12, bottom: 0, left: 4 }}>
          <XAxis type="number" {...AXIS_STYLE} axisLine={false} allowDecimals={false} hide />
          <YAxis
            type="category"
            dataKey="name"
            {...AXIS_STYLE}
            axisLine={false}
            width={86}
            tick={{ fill: "#a1a1aa", fontSize: 10 }}
          />

          <Tooltip
            cursor={{ fill: "rgba(63,63,70,0.25)" }}
            content={<ConsoleTooltip unit=" items" />}
          />

          <Bar dataKey="value" name="items" radius={[0, 2, 2, 0]} barSize={14} isAnimationActive animationDuration={420}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
