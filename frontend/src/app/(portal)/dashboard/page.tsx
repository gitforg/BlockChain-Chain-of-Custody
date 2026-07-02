import Link from "next/link";
import { FiArrowUpRight, FiClock, FiFileText } from "react-icons/fi";
import { dashboardMetrics, recentEvidence } from "@/lib/dapp-data";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {dashboardMetrics.map((metric) => (
          <article
            key={metric.label}
            className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-5"
          >
            <p className="text-sm text-slate-400">{metric.label}</p>
            <p className="mt-3 text-3xl font-semibold text-white">{metric.value}</p>
            <p className="mt-2 text-sm text-cyan-200/80">{metric.delta}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <article className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-white">Recent evidence</h2>
              <p className="mt-1 text-sm text-slate-400">
                Latest chain activity and custody updates.
              </p>
            </div>
            <Link
              href="/register-evidence"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:border-cyan-300/30 hover:bg-cyan-300/10"
            >
              Register new
              <FiArrowUpRight />
            </Link>
          </div>

          <div className="mt-4 overflow-hidden rounded-[1.25rem] border border-white/10">
            <table className="min-w-full divide-y divide-white/10 text-left text-sm">
              <thead className="bg-white/5 text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">ID</th>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Owner</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 bg-slate-950/60 text-slate-200">
                {recentEvidence.map((item) => (
                  <tr key={item.id} className="hover:bg-white/5">
                    <td className="px-4 py-4 font-medium text-cyan-200">
                      <Link href={`/evidence/${item.id}`}>{item.id}</Link>
                    </td>
                    <td className="px-4 py-4">{item.title}</td>
                    <td className="px-4 py-4">{item.owner}</td>
                    <td className="px-4 py-4">
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-400">{item.updatedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <aside className="space-y-4 rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-5">
          <div>
            <h2 className="text-xl font-semibold text-white">Workflow health</h2>
            <p className="mt-1 text-sm text-slate-400">
              Evidence operations status for the last 30 days.
            </p>
          </div>
          <div className="space-y-3">
            {[
              { label: "Pending approvals", value: "04", icon: FiClock },
              { label: "Manual reviews", value: "07", icon: FiFileText },
              { label: "Failed verifications", value: "01", icon: FiArrowUpRight },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
                      <Icon />
                    </span>
                    <div>
                      <p className="text-sm text-slate-300">{item.label}</p>
                      <p className="text-xs text-slate-500">Operating queue</p>
                    </div>
                  </div>
                  <span className="text-2xl font-semibold text-white">{item.value}</span>
                </div>
              );
            })}
          </div>
        </aside>
      </section>
    </div>
  );
}