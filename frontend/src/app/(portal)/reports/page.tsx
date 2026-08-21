"use client";

import { fetchStats } from "@/lib/api";
import { useEffect, useState } from "react";
import {
  BarChart3,
  TrendingUp,
  PieChart,
  Calendar,
  Layers,
  Activity,
  Award,
  ChevronDown,
} from "lucide-react";

export default function ReportsPage() {
  const [timeRange, setTimeRange] = useState("30");
  const [distribution, setDistribution] = useState<any>({
    total: 0,
    inLab: 0,
    inTransit: 0,
    inCourt: 0,
    disposed: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        const data = await fetchStats();
        if (data.distribution) {
          setDistribution(data.distribution);
        }
      } catch (err) {
        console.error("Failed to load reports stats:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const total = distribution.total || 0;
  const inLab = distribution.inLab || 0;
  const inTransit = distribution.inTransit || 0;
  const inCourt = distribution.inCourt || 0;
  const disposed = distribution.disposed || 0;

  const registered = Math.max(0, total - inTransit - inLab - inCourt - disposed);

  const inLabPct = total > 0 ? (inLab / total) * 100 : 0;
  const inTransitPct = total > 0 ? (inTransit / total) * 100 : 0;
  const inCourtPct = total > 0 ? (inCourt / total) * 100 : 0;
  const disposedPct = total > 0 ? (disposed / total) * 100 : 0;

  const offset1 = 0;
  const offset2 = -inLabPct;
  const offset3 = -(inLabPct + inTransitPct);
  const offset4 = -(inLabPct + inTransitPct + inCourtPct);

  const intakeCount = registered + inTransit;
  const intakePct = total > 0 ? Math.round((intakeCount / total) * 100) : 0;
  const labPct = total > 0 ? Math.round((inLab / total) * 100) : 0;
  const courtPct = total > 0 ? Math.round((inCourt / total) * 100) : 0;
  const archivePct = total > 0 ? Math.round((disposed / total) * 100) : 0;

  const departments = [
    { name: "Police Intake Division", count: intakeCount, percent: intakePct, color: "bg-cyan-600" },
    { name: "Forensic Laboratory", count: inLab, percent: labPct, color: "bg-indigo-500" },
    { name: "Municipal Courts", count: inCourt, percent: courtPct, color: "bg-purple-500" },
    { name: "Federal Archives", count: disposed, percent: archivePct, color: "bg-zinc-600" },
  ];

  return (
    <div className="space-y-6">
      {/* Header section */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border border-zinc-800 bg-zinc-900/40 p-6 rounded-md">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600">Ledger Metrics</p>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            System Reports & Analytics
          </h1>
          <p className="text-xs text-zinc-500">
            Operations intelligence dashboard mapping custody events, throughput rates, and block confirmation metrics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="block text-[10px] font-semibold text-zinc-600 uppercase mr-1">Timeframe</label>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="rounded border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs font-semibold text-zinc-300 outline-none focus:border-cyan-500 focus:bg-zinc-900 transition"
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last Quarter</option>
          </select>
        </div>
      </section>

      {/* Analytics Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Chart 1: Evidence by Status */}
        <section className="border border-zinc-800 bg-zinc-900/40 p-6 rounded-md space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <div className="flex items-center gap-2">
              <PieChart className="h-4.5 w-4.5 text-cyan-400" />
              <h2 className="text-xs font-bold text-zinc-100 uppercase tracking-wider">Evidence by Status</h2>
            </div>
            <span className="text-[10px] font-semibold text-zinc-600">Total: {total} items</span>
          </div>

          {/* SVG Donut Chart */}
          <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-4">
            <div className="relative h-32 w-32 shrink-0">
              <svg viewBox="0 0 36 36" className="h-full w-full transform -rotate-90">
                {/* Background Circle */}
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                
                {/* Segment 1: InLab */}
                <circle
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="3.2"
                  strokeDasharray={`${inLabPct} ${100 - inLabPct}`}
                  strokeDashoffset={offset1}
                />
                
                {/* Segment 2: InTransit */}
                <circle
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="3.2"
                  strokeDasharray={`${inTransitPct} ${100 - inTransitPct}`}
                  strokeDashoffset={offset2}
                />
                
                {/* Segment 3: InCourt */}
                <circle
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="none"
                  stroke="#8b5cf6"
                  strokeWidth="3.2"
                  strokeDasharray={`${inCourtPct} ${100 - inCourtPct}`}
                  strokeDashoffset={offset3}
                />

                {/* Segment 4: Disposed */}
                <circle
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="3.2"
                  strokeDasharray={`${disposedPct} ${100 - disposedPct}`}
                  strokeDashoffset={offset4}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xl font-bold text-zinc-100">{Math.round(disposedPct)}%</span>
                <span className="text-[9px] text-zinc-600 uppercase font-semibold">Disposed</span>
              </div>
            </div>

            {/* Legends */}
            <div className="space-y-2.5 text-xs w-full max-w-44">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-cyan-500" />
                  <span className="text-zinc-400 font-medium">In Laboratory</span>
                </div>
                <span className="font-bold text-zinc-200">{inLab}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  <span className="text-zinc-400 font-medium">In Transit</span>
                </div>
                <span className="font-bold text-zinc-200">{inTransit}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-purple-500" />
                  <span className="text-zinc-400 font-medium">In Court</span>
                </div>
                <span className="font-bold text-zinc-200">{inCourt}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                  <span className="text-zinc-400 font-medium">Disposed / Archived</span>
                </div>
                <span className="font-bold text-zinc-200">{disposed}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Chart 2: Evidence by Department */}
        <section className="border border-zinc-800 bg-zinc-900/40 p-6 rounded-md space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <div className="flex items-center gap-2">
              <Layers className="h-4.5 w-4.5 text-cyan-400" />
              <h2 className="text-xs font-bold text-zinc-100 uppercase tracking-wider">Evidence by Department</h2>
            </div>
            <span className="text-[10px] font-semibold text-zinc-600">Intake loading</span>
          </div>

          {/* Progress list charts */}
          <div className="space-y-4 py-2">
            {departments.map((dep) => (
              <div key={dep.name} className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-zinc-300">{dep.name}</span>
                  <span className="text-zinc-100">{dep.count} items ({dep.percent}%)</span>
                </div>
                <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div className={`h-full ${dep.color} rounded-full`} style={{ width: `${dep.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Chart 3: Transfers Over Time */}
        <section className="border border-zinc-800 bg-zinc-900/40 p-6 rounded-md space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4.5 w-4.5 text-cyan-400" />
              <h2 className="text-xs font-bold text-zinc-100 uppercase tracking-wider">Transfers Over Time</h2>
            </div>
            <span className="text-[10px] font-semibold text-zinc-600">Average: 4.8 / day</span>
          </div>

          {/* SVG Line Chart */}
          <div className="h-32 w-full pt-4">
            <svg className="h-full w-full overflow-visible" viewBox="0 0 300 100" preserveAspectRatio="none">
              {/* Grid Lines */}
              <line x1="0" y1="20" x2="300" y2="20" stroke="#f1f5f9" strokeWidth="0.5" />
              <line x1="0" y1="50" x2="300" y2="50" stroke="#f1f5f9" strokeWidth="0.5" />
              <line x1="0" y1="80" x2="300" y2="80" stroke="#f1f5f9" strokeWidth="0.5" />

              {/* Area Under Curve */}
              <path
                d="M 0 80 Q 50 20 100 60 T 200 40 T 300 10 L 300 100 L 0 100 Z"
                fill="url(#gradient-blue)"
                opacity="0.1"
              />

              {/* Line Curve */}
              <path
                d="M 0 80 Q 50 20 100 60 T 200 40 T 300 10"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
              />

              {/* Legend Gradients */}
              <defs>
                <linearGradient id="gradient-blue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#ffffff" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="flex justify-between text-[10px] font-mono text-zinc-600 pt-1">
            <span>Week 1</span>
            <span>Week 2</span>
            <span>Week 3</span>
            <span>Week 4</span>
          </div>
        </section>

        {/* Chart 4: Blockchain Transactions & Activity */}
        <section className="border border-zinc-800 bg-zinc-900/40 p-6 rounded-md space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <div className="flex items-center gap-2">
              <Activity className="h-4.5 w-4.5 text-cyan-400" />
              <h2 className="text-xs font-bold text-zinc-100 uppercase tracking-wider">Blockchain Activity</h2>
            </div>
            <span className="text-[10px] font-semibold text-zinc-600">Total Tx: 1,204</span>
          </div>

          {/* SVG Vertical Bar Columns */}
          <div className="h-32 w-full flex items-end justify-between gap-4 pt-4 border-b border-zinc-800">
            {[45, 60, 30, 85, 40, 95, 65, 50, 75, 90, 55, 80].map((height, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                <div
                  className="w-full bg-zinc-800 rounded-t-sm group-hover:bg-cyan-600 transition-colors"
                  style={{ height: `${height}%` }}
                />
              </div>
            ))}
          </div>

          <div className="flex justify-between text-[9px] font-mono text-zinc-500 uppercase pt-1">
            <span>Jan</span>
            <span>May</span>
            <span>Sep</span>
            <span>Dec</span>
          </div>
        </section>
      </div>
    </div>
  );
}
