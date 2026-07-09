"use client";

import { useState } from "react";
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

  return (
    <div className="space-y-6">
      {/* Header section */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border border-slate-200 bg-white p-6 rounded-2xl shadow-xs">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Ledger Metrics</p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            System Reports & Analytics
          </h1>
          <p className="text-xs text-slate-500">
            Operations intelligence dashboard mapping custody events, throughput rates, and block confirmation metrics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="block text-[10px] font-semibold text-slate-400 uppercase mr-1">Timeframe</label>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition"
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
        <section className="border border-slate-200 bg-white p-6 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <PieChart className="h-4.5 w-4.5 text-blue-600" />
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Evidence by Status</h2>
            </div>
            <span className="text-[10px] font-semibold text-slate-400">Total: 312 items</span>
          </div>

          {/* SVG Donut Chart */}
          <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-4">
            <div className="relative h-32 w-32 shrink-0">
              <svg viewBox="0 0 36 36" className="h-full w-full transform -rotate-90">
                {/* Background Circle */}
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                
                {/* Segment 1: InLab (48 items -> 15.3%) */}
                <circle
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="3.2"
                  strokeDasharray="15.3 84.7"
                  strokeDashoffset="0"
                />
                
                {/* Segment 2: InTransit (14 items -> 4.5%) */}
                <circle
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="3.2"
                  strokeDasharray="4.5 95.5"
                  strokeDashoffset="-15.3"
                />
                
                {/* Segment 3: InCourt (26 items -> 8.3%) */}
                <circle
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="none"
                  stroke="#8b5cf6"
                  strokeWidth="3.2"
                  strokeDasharray="8.3 91.7"
                  strokeDashoffset="-19.8"
                />

                {/* Segment 4: Disposed (224 items -> 71.9%) */}
                <circle
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="3.2"
                  strokeDasharray="71.9 28.1"
                  strokeDashoffset="-28.1"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xl font-bold text-slate-900">72%</span>
                <span className="text-[9px] text-slate-400 uppercase font-semibold">Disposed</span>
              </div>
            </div>

            {/* Legends */}
            <div className="space-y-2.5 text-xs w-full max-w-44">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                  <span className="text-slate-600 font-medium">In Laboratory</span>
                </div>
                <span className="font-bold text-slate-800">48</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  <span className="text-slate-600 font-medium">In Transit</span>
                </div>
                <span className="font-bold text-slate-800">14</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-purple-500" />
                  <span className="text-slate-600 font-medium">In Court</span>
                </div>
                <span className="font-bold text-slate-800">26</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                  <span className="text-slate-600 font-medium">Disposed / Archived</span>
                </div>
                <span className="font-bold text-slate-800">224</span>
              </div>
            </div>
          </div>
        </section>

        {/* Chart 2: Evidence by Department */}
        <section className="border border-slate-200 bg-white p-6 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <Layers className="h-4.5 w-4.5 text-blue-600" />
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Evidence by Department</h2>
            </div>
            <span className="text-[10px] font-semibold text-slate-400">Intake loading</span>
          </div>

          {/* Progress list charts */}
          <div className="space-y-4 py-2">
            {[
              { name: "Police Intake Division", count: 184, percent: 59, color: "bg-blue-600" },
              { name: "Forensic Laboratory", count: 72, percent: 23, color: "bg-indigo-600" },
              { name: "Municipal Courts", count: 44, percent: 14, color: "bg-purple-600" },
              { name: "Federal Archives", count: 12, percent: 4, color: "bg-slate-400" },
            ].map((dep) => (
              <div key={dep.name} className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-700">{dep.name}</span>
                  <span className="text-slate-900">{dep.count} items ({dep.percent}%)</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${dep.color} rounded-full`} style={{ width: `${dep.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Chart 3: Transfers Over Time */}
        <section className="border border-slate-200 bg-white p-6 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4.5 w-4.5 text-blue-600" />
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Transfers Over Time</h2>
            </div>
            <span className="text-[10px] font-semibold text-slate-400">Average: 4.8 / day</span>
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

          <div className="flex justify-between text-[10px] font-mono text-slate-400 pt-1">
            <span>Week 1</span>
            <span>Week 2</span>
            <span>Week 3</span>
            <span>Week 4</span>
          </div>
        </section>

        {/* Chart 4: Blockchain Transactions & Activity */}
        <section className="border border-slate-200 bg-white p-6 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <Activity className="h-4.5 w-4.5 text-blue-600" />
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Blockchain Activity</h2>
            </div>
            <span className="text-[10px] font-semibold text-slate-400">Total Tx: 1,204</span>
          </div>

          {/* SVG Vertical Bar Columns */}
          <div className="h-32 w-full flex items-end justify-between gap-4 pt-4 border-b border-slate-100">
            {[45, 60, 30, 85, 40, 95, 65, 50, 75, 90, 55, 80].map((height, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                <div
                  className="w-full bg-slate-100 rounded-t-sm group-hover:bg-blue-600 transition-colors"
                  style={{ height: `${height}%` }}
                />
              </div>
            ))}
          </div>

          <div className="flex justify-between text-[9px] font-mono text-slate-450 uppercase pt-1">
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
