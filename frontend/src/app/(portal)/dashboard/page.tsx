"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  Boxes,
  Database,
  FlaskConical,
  Gavel,
  Layers,
  RefreshCw,
  Trash2,
  Truck,
} from "lucide-react";
import { fetchEvidenceList, fetchStats } from "@/lib/api";
import type { EvidenceRecord, StatsDistribution, StatusTone } from "@/lib/types";
import { bucketByDay, cn } from "@/lib/utils";
import { ConsoleButton, Led, Panel, PanelHeader, Skeleton } from "@/components/ui/primitives";
import { EvidenceTable } from "@/components/console/evidence-table";
import { InspectorDrawer } from "@/components/console/inspector-drawer";
import { DistributionChart, IngestionTrendChart } from "@/components/console/charts";
import { useCommandPalette } from "@/components/console/command-palette";

/* -------------------------------------------------------------------------- */
/* Metric strip                                                               */
/* -------------------------------------------------------------------------- */

interface Metric {
  key: string;
  label: string;
  value: number;
  tone: StatusTone;
  icon: React.ComponentType<{ className?: string }>;
  hint: string;
}

/**
 * Dense metric cell. No icon bubbles, no drop shadows — a hairline-separated
 * readout strip in the spirit of an instrument panel.
 */
function MetricCell({ metric, loading, index }: { metric: Metric; loading: boolean; index: number }) {
  const Icon = metric.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.025, duration: 0.2 }}
      title={metric.hint}
      className="flex min-w-0 flex-col gap-1 border-r border-zinc-800 px-3 py-2.5 last:border-r-0"
    >
      <div className="flex items-center gap-1.5">
        <Icon className="h-3 w-3 shrink-0 text-zinc-600" />
        <span className="truncate text-[10px] font-medium uppercase tracking-[0.08em] text-zinc-500">
          {metric.label}
        </span>
      </div>

      <div className="flex items-baseline gap-1.5">
        {loading ? (
          <Skeleton className="h-6 w-10" />
        ) : (
          <>
            <span className="font-mono text-xl font-semibold tabular-nums text-zinc-100">
              {metric.value}
            </span>
            <Led tone={metric.tone} pulse={metric.tone === "pending" && metric.value > 0} />
          </>
        )}
      </div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* Dashboard                                                                  */
/* -------------------------------------------------------------------------- */

export default function DashboardPage() {
  const palette = useCommandPalette();

  const [records, setRecords] = useState<EvidenceRecord[]>([]);
  const [distribution, setDistribution] = useState<StatsDistribution>({
    total: 0,
    inLab: 0,
    inTransit: 0,
    inCourt: 0,
    disposed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [inspectId, setInspectId] = useState<string | null>(null);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [trendWindow, setTrendWindow] = useState<7 | 30 | 90>(30);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [stats, list] = await Promise.all([
        fetchStats(),
        fetchEvidenceList({ limit: 500, sort: "uploadedAt", order: "desc" }),
      ]);

      setDistribution(stats.distribution);
      setRecords((list.items ?? []) as EvidenceRecord[]);
    } catch {
      setError("Unable to reach the backend node. Showing the last known state.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openInspector = useCallback((id: string) => {
    setInspectId(id);
    setInspectorOpen(true);
  }, []);

  const registered = Math.max(
    0,
    distribution.total -
      distribution.inTransit -
      distribution.inLab -
      distribution.inCourt -
      distribution.disposed,
  );

  const metrics: Metric[] = useMemo(
    () => [
      { key: "total", label: "Total Evidence", value: distribution.total, tone: "info", icon: Database, hint: "All records in the registry" },
      { key: "registered", label: "Registered", value: registered, tone: "info", icon: Boxes, hint: "Anchored, awaiting handoff" },
      { key: "transit", label: "In Transit", value: distribution.inTransit, tone: "pending", icon: Truck, hint: "Custody handoff in progress" },
      { key: "lab", label: "In Laboratory", value: distribution.inLab, tone: "verified", icon: FlaskConical, hint: "Under forensic analysis" },
      { key: "court", label: "In Court", value: distribution.inCourt, tone: "info", icon: Gavel, hint: "Submitted as exhibit" },
      { key: "disposed", label: "Disposed", value: distribution.disposed, tone: "muted", icon: Trash2, hint: "Legally disposed of" },
    ],
    [distribution, registered],
  );

  const trend = useMemo(
    () => bucketByDay(records, (record) => record.uploadedAt, trendWindow),
    [records, trendWindow],
  );

  const departmentBreakdown = useMemo(() => {
    const counts = new Map<string, number>();

    for (const record of records) {
      const key = record.department?.trim() || "Unassigned";
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    const palette = ["#22d3ee", "#10b981", "#f59e0b", "#a78bfa", "#f43f5e", "#52525b"];

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value], index) => ({
        name: name.length > 16 ? `${name.slice(0, 15)}…` : name,
        value,
        color: palette[index % palette.length],
      }));
  }, [records]);

  const anchoredCount = records.filter((record) => Boolean(record.txHash)).length;
  const anchoredPct = records.length > 0 ? Math.round((anchoredCount / records.length) * 100) : 0;

  return (
    <div className="space-y-3">
      {/* Command bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-sm font-semibold tracking-tight text-zinc-100">
            Forensic Command Center
          </h1>
          <p className="mt-0.5 font-mono text-[10px] text-zinc-600">
            Evidence integrity, custody chain and on-chain anchor status
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <ConsoleButton variant="ghost" onClick={palette.toggle}>
            <Layers className="h-3 w-3" />
            Command palette
            <kbd className="ml-1 rounded border border-zinc-700 px-1 font-mono text-[9px] text-zinc-500">
              ⌘K
            </kbd>
          </ConsoleButton>

          <ConsoleButton onClick={() => void load()} disabled={loading}>
            <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
            Refresh
          </ConsoleButton>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded border border-amber-500/30 bg-amber-500/10 px-3 py-2">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-400" />
          <p className="text-[11px] text-amber-200">{error}</p>
        </div>
      )}

      {/* Metric strip */}
      <Panel>
        <div className="grid grid-cols-2 divide-zinc-800 sm:grid-cols-3 lg:grid-cols-6">
          {metrics.map((metric, index) => (
            <MetricCell key={metric.key} metric={metric} loading={loading} index={index} />
          ))}
        </div>
      </Panel>

      {/* Analytics */}
      <div className="grid gap-3 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <PanelHeader
            title="Ingestion trend"
            hint={`${trend.reduce((sum, point) => sum + point.count, 0)} registrations · ${trendWindow}d`}
            icon={Activity}
            actions={
              <div className="flex items-center gap-0.5 rounded border border-zinc-800 bg-zinc-900 p-0.5">
                {([7, 30, 90] as const).map((window) => (
                  <button
                    key={window}
                    type="button"
                    onClick={() => setTrendWindow(window)}
                    className={cn(
                      "relative rounded px-1.5 py-0.5 font-mono text-[10px] transition",
                      trendWindow === window
                        ? "text-zinc-100"
                        : "text-zinc-600 hover:text-zinc-300",
                    )}
                  >
                    {trendWindow === window && (
                      <motion.span
                        layoutId="trend-window"
                        className="absolute inset-0 rounded bg-zinc-700"
                        transition={{ type: "spring", stiffness: 500, damping: 38 }}
                      />
                    )}
                    <span className="relative">{window}D</span>
                  </button>
                ))}
              </div>
            }
          />
          {loading ? (
            <div className="p-3">
              <Skeleton className="h-40 w-full" />
            </div>
          ) : (
            <div className="p-2">
              <IngestionTrendChart data={trend} />
            </div>
          )}
        </Panel>

        <Panel>
          <PanelHeader
            title="Custody distribution"
            hint={`${departmentBreakdown.length} departments`}
            icon={Layers}
          />
          {loading ? (
            <div className="p-3">
              <Skeleton className="h-40 w-full" />
            </div>
          ) : departmentBreakdown.length > 0 ? (
            <div className="p-2">
              <DistributionChart data={departmentBreakdown} />
            </div>
          ) : (
            <p className="px-3 py-16 text-center text-xs text-zinc-600">No department data.</p>
          )}

          {/* Anchor integrity readout */}
          <div className="border-t border-zinc-800 px-3 py-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-zinc-600">
                On-chain anchored
              </span>
              <span className="font-mono text-xs font-semibold text-emerald-300">
                {anchoredPct}%
              </span>
            </div>
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-zinc-800">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${anchoredPct}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="h-full rounded-full bg-emerald-500"
              />
            </div>
            <p className="mt-1 font-mono text-[10px] text-zinc-600">
              {anchoredCount}/{records.length} records carry a transaction hash
            </p>
          </div>
        </Panel>
      </div>

      {/* Evidence table */}
      <Panel>
        <PanelHeader
          title="Evidence registry"
          hint="click any row to inspect"
          icon={Database}
        />
        <EvidenceTable
          data={records}
          loading={loading}
          onInspect={openInspector}
          selectedId={inspectorOpen ? inspectId : null}
        />
      </Panel>

      <InspectorDrawer
        evidenceId={inspectId}
        open={inspectorOpen}
        onOpenChange={setInspectorOpen}
        onMutated={load}
      />
    </div>
  );
}
