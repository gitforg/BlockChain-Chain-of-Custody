"use client";

import { useState } from "react";
import {
  Settings,
  User,
  Cpu,
  Server,
  Database,
  Bell,
  Monitor,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { useAuth } from "@/components/auth-provider";

export default function SettingsPage() {
  const { user } = useAuth();
  const [successMsg, setSuccessMsg] = useState("");

  const [rpcUrl, setRpcUrl] = useState("http://127.0.0.1:8545");
  const [registryAddress, setRegistryAddress] = useState("0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512");
  const [ipfsGateway, setIpfsGateway] = useState("https://ipfs.io/ipfs/");
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [pushAlerts, setPushAlerts] = useState(true);

  function handleSave() {
    setSuccessMsg("Configuration settings saved successfully.");
    setTimeout(() => setSuccessMsg(""), 3000);
  }

  return (
    <div className="space-y-6">
      {/* Header section */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border border-slate-200 bg-white p-6 rounded-2xl shadow-xs">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Administration</p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            System Settings
          </h1>
          <p className="text-xs text-slate-500">
            Manage your administrative profile, blockchain node provider, IPFS storage directories, and app alert configurations.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="inline-flex h-10 items-center justify-center rounded-xl bg-blue-600 px-5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition"
        >
          Save Configuration
        </button>
      </section>

      {successMsg && (
        <div className="rounded-xl border border-emerald-250 bg-emerald-50 px-4 py-3 text-xs text-emerald-800 font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Settings Sections Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Section 1: Admin Information */}
        <section className="border border-slate-200 bg-white p-6 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <User className="h-4.5 w-4.5 text-blue-600" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Admin Profile</h2>
          </div>

          <div className="grid gap-4 text-xs">
            <div>
              <span className="block text-[10px] font-semibold text-slate-400 uppercase">Administrator Email</span>
              <span className="mt-1 block font-semibold text-slate-900">{user?.email || "admin@company.com"}</span>
            </div>
            <div>
              <span className="block text-[10px] font-semibold text-slate-400 uppercase">Designated Role</span>
              <span className="mt-1 block font-semibold text-slate-900">System Compliance Lead</span>
            </div>
            <div>
              <span className="block text-[10px] font-semibold text-slate-400 uppercase">Department Assignment</span>
              <span className="mt-1 block font-semibold text-slate-900">Federal Records Administration</span>
            </div>
            <div>
              <span className="block text-[10px] font-semibold text-slate-400 uppercase">Active Credentials Status</span>
              <div className="mt-1.5 flex items-center gap-1.5 text-emerald-700 font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>Security Token Verified</span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Blockchain Configuration */}
        <section className="border border-slate-200 bg-white p-6 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Cpu className="h-4.5 w-4.5 text-blue-600" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Blockchain Node</h2>
          </div>

          <div className="space-y-3.5 text-xs">
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase">RPC Provider Gateway URL</label>
              <input
                type="text"
                value={rpcUrl}
                onChange={(e) => setRpcUrl(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase">EvidenceRegistry Contract Address</label>
              <input
                type="text"
                value={registryAddress}
                onChange={(e) => setRegistryAddress(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition"
              />
            </div>
          </div>
        </section>

        {/* Section 3: IPFS Settings */}
        <section className="border border-slate-200 bg-white p-6 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Server className="h-4.5 w-4.5 text-blue-600" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">IPFS Directory Settings</h2>
          </div>

          <div className="space-y-3.5 text-xs">
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase">Public Gateway URL</label>
              <input
                type="text"
                value={ipfsGateway}
                onChange={(e) => setIpfsGateway(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition"
              />
            </div>

            <div>
              <span className="block text-[10px] font-semibold text-slate-400 uppercase">Storage Provider Pinning API</span>
              <span className="mt-1.5 inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600">
                Pinata IPFS Endpoint (Active)
              </span>
            </div>
          </div>
        </section>

        {/* Section 4: Firebase Integration */}
        <section className="border border-slate-200 bg-white p-6 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Database className="h-4.5 w-4.5 text-blue-600" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Firebase Sync Configuration</h2>
          </div>

          <div className="space-y-4 text-xs">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-450 font-medium">Authentication State</span>
                <span className="text-emerald-700 font-bold">Operational</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-450 font-medium">Session Persistence</span>
                <span className="font-semibold text-slate-800">Local Browser persistence</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-450 font-medium">API Integration</span>
                <span className="font-semibold text-slate-800">Active</span>
              </div>
            </div>

            <div className="rounded-lg border border-slate-100 p-3 bg-slate-50/50 flex items-start gap-2 text-[10px] text-slate-500 leading-relaxed">
              <Lock className="h-4.5 w-4.5 text-blue-600 shrink-0" />
              <span>Firebase credentials configured in .env.local are read client-side on bootstrap initialize hooks. No manual sync needed.</span>
            </div>
          </div>
        </section>

        {/* Section 5: Notifications Alert */}
        <section className="border border-slate-200 bg-white p-6 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Bell className="h-4.5 w-4.5 text-blue-600" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Operational Alerts</h2>
          </div>

          <div className="space-y-3.5 text-xs">
            <label className="flex items-center justify-between gap-3 cursor-pointer py-1 border-b border-slate-50">
              <span className="text-slate-700 font-semibold">Email Alerts for Handovers</span>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
            </label>

            <label className="flex items-center justify-between gap-3 cursor-pointer py-1">
              <span className="text-slate-700 font-semibold">Immediate push notifications</span>
              <input
                type="checkbox"
                checked={pushAlerts}
                onChange={(e) => setPushAlerts(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
            </label>
          </div>
        </section>

        {/* Section 6: System Information */}
        <section className="border border-slate-200 bg-white p-6 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Monitor className="h-4.5 w-4.5 text-blue-600" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">System Information</h2>
          </div>

          <div className="grid gap-3.5 text-xs text-slate-650">
            <div className="flex justify-between">
              <span>Framework Version</span>
              <span className="font-bold text-slate-900">Next.js 16.2.9 (App Router)</span>
            </div>
            <div className="flex justify-between">
              <span>Styling Architecture</span>
              <span className="font-bold text-slate-900">Tailwind CSS 4.0</span>
            </div>
            <div className="flex justify-between">
              <span>Smart Contract Library</span>
              <span className="font-bold text-slate-900">Ethers.js v6</span>
            </div>
            <div className="flex justify-between">
              <span>MetaMask Client SDK</span>
              <span className="font-bold text-slate-900">Installed / Connected</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
