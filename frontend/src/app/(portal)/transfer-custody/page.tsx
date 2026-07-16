"use client";

import { useState, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Users,
  Send,
  CheckCircle2,
  Cpu,
  ArrowRight,
  FileText,
  AlertCircle,
  Key,
  ShieldCheck,
  Clock,
} from "lucide-react";
import { transferRecipients } from "@/lib/dapp-data";
import { fetchEvidenceList, transferEvidence } from "@/lib/api";
import { ensureSepoliaNetwork, getRegistryReadContract, sendWalletSignedTransfer } from "@/lib/chain";
import { useWallet, abbreviateWalletAddress } from "@/components/wallet-provider";
import { useEffect } from "react";

function TransferForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const wallet = useWallet();
  const idParam = searchParams.get("id");

  const [evidenceId, setEvidenceId] = useState(idParam || "");
  const [recipientIndex, setRecipientIndex] = useState(0);
  const [reason, setReason] = useState("");
  const [authPin, setAuthPin] = useState("");
  const [checkedAuth, setCheckedAuth] = useState(false);
  const [status, setStatus] = useState<"idle" | "signing" | "broadcasting" | "confirmed">("idle");
  const [stepMsg, setStepMsg] = useState("");
  const [evidenceList, setEvidenceList] = useState<any[]>([]);
  const [onChainEvidence, setOnChainEvidence] = useState<any>(null);

  useEffect(() => {
    async function loadEvidence() {
      try {
        const data = await fetchEvidenceList();
        setEvidenceList(data.items);
        if (!idParam && data.items.length > 0) {
          setEvidenceId(data.items[0].id);
        }
      } catch (err) {
        console.error("Failed to load evidence for transfer:", err);
      }
    }
    loadEvidence();
  }, [idParam]);

  useEffect(() => {
    async function loadOnChainEvidence() {
      if (!evidenceId) return;

      try {
        const contract = await getRegistryReadContract();
        const record = await contract.getEvidence(evidenceId);
        setOnChainEvidence(record);
      } catch (error) {
        setOnChainEvidence(null);
      }
    }

    void loadOnChainEvidence();
  }, [evidenceId]);

  const selectedEvidence = useMemo(() => {
    if (!evidenceList || evidenceList.length === 0) return null;
    return evidenceList.find((item) => item.id === evidenceId) || evidenceList[0];
  }, [evidenceId, evidenceList]);

  const recipient = transferRecipients[recipientIndex];
  const currentCustodianWallet =
    selectedEvidence?.currentCustodianWallet ||
    onChainEvidence?.currentCustodian ||
    onChainEvidence?.[4] ||
    "";
  const creatorWallet =
    selectedEvidence?.creatorWallet ||
    onChainEvidence?.creatorWallet ||
    onChainEvidence?.[8] ||
    "";
  const connectedWallet = wallet.connectedAddress;
  const walletMatchesCustodian =
    Boolean(connectedWallet) &&
    Boolean(currentCustodianWallet) &&
    connectedWallet.toLowerCase() === String(currentCustodianWallet).toLowerCase();
  const canTransfer = walletMatchesCustodian && checkedAuth && Boolean(reason.trim()) && status === "idle";

  async function executeTransfer() {
    if (!reason.trim()) {
      alert("Please state the reason for custody transfer.");
      return;
    }
    if (!checkedAuth) {
      alert("Please check the digital signature authorization box.");
      return;
    }
    if (!wallet.installed) {
      alert("MetaMask is not installed.");
      return;
    }
    if (!walletMatchesCustodian) {
      alert("The connected wallet does not match the current custodian wallet.");
      return;
    }

    setStatus("signing");
    setStepMsg("Signing evidence custody transfer request...");

    try {
      await ensureSepoliaNetwork();
      const walletTx = await sendWalletSignedTransfer(evidenceId, recipient.wallet);

      await transferEvidence(evidenceId, {
        newCustodian: recipient.name,
        newCustodianWallet: recipient.wallet,
        previousCustodianWallet: currentCustodianWallet,
        department: recipient.department,
        reason: reason.trim(),
        action: `Transferred Custody to ${recipient.name}`,
        txHash: walletTx.txHash,
        blockNumber: walletTx.blockNumber,
      });

      setStatus("confirmed");
      setStepMsg("Transfer successfully recorded in database and blockchain!");
    } catch (err: any) {
      console.error(err);
      setStatus("idle");
      setStepMsg("");
      alert(err.message || "Failed to execute transfer.");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      {/* Input panel */}
      <section className="space-y-6">
        <article className="border border-slate-200 bg-white p-6 rounded-2xl shadow-xs space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Users className="h-5 w-5 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Custody Handover Handoff</h2>
          </div>

          <div className="space-y-4">
            {/* Select Target Evidence */}
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase">Target Evidence ID</label>
              <select
                value={evidenceId}
                onChange={(e) => setEvidenceId(e.target.value)}
                disabled={status !== "idle"}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition"
              >
                {evidenceList.length > 0 ? (
                  evidenceList.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.id} - {item.type} (Custodian: {item.custodian})
                    </option>
                  ))
                ) : (
                  <option value="">No evidence items available</option>
                )}
              </select>
            </div>

            {/* Select Recipient */}
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-2">Select Recipient Custodian</label>
              <div className="grid gap-3">
                {transferRecipients.map((entry, index) => {
                  const active = recipientIndex === index;

                  return (
                    <button
                      key={entry.wallet}
                      type="button"
                      disabled={status !== "idle"}
                      onClick={() => setRecipientIndex(index)}
                      className={`w-full rounded-xl border p-4 text-left transition text-xs ${
                        active
                          ? "border-blue-500 bg-blue-50/20"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-bold text-slate-900">{entry.name}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{entry.role} • {entry.department}</p>
                        </div>
                        <span className="font-mono text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-150">
                          {entry.wallet.slice(0, 6)}...{entry.wallet.slice(-4)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Transfer Justification */}
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase">Reason for Handoff</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={status !== "idle"}
                className="mt-1.5 min-h-20 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition"
                placeholder="State forensic case, transfer authorization, or courier transit detail..."
                required
              />
            </div>
          </div>
        </article>
      </section>

      {/* Signing Panel */}
      <aside className="space-y-6">
        <section className="border border-slate-200 bg-white p-6 rounded-2xl shadow-xs space-y-5">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">Transaction Signing</h3>
          
          <div className="space-y-4 text-xs">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">Evidence Ref</span>
                <span className="font-bold text-slate-900">{selectedEvidence?.id || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">Current Holder</span>
                <span className="font-semibold text-slate-900">{selectedEvidence?.custodian || "N/A"}</span>
              </div>
                <div className="flex justify-between gap-3">
                  <span className="text-slate-400 font-semibold">Current Wallet</span>
                  <span className="font-mono text-slate-900 text-[10px] truncate" title={currentCustodianWallet || ""}>
                    {currentCustodianWallet ? abbreviateWalletAddress(String(currentCustodianWallet)) : "Unlinked"}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-slate-400 font-semibold">Creator Wallet</span>
                  <span className="font-mono text-slate-900 text-[10px] truncate" title={creatorWallet || ""}>
                    {creatorWallet ? abbreviateWalletAddress(String(creatorWallet)) : "Unknown"}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-slate-400 font-semibold">Connected Wallet</span>
                  <span className="font-mono text-slate-900 text-[10px] truncate" title={connectedWallet || ""}>
                    {connectedWallet ? abbreviateWalletAddress(connectedWallet) : "Not connected"}
                  </span>
                </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">Handoff Target</span>
                <span className="font-semibold text-slate-900">{recipient.name}</span>
              </div>
            </div>

              {!wallet.installed && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] font-semibold text-amber-800">
                  MetaMask is not installed. Install the extension to sign custody transfers locally.
                </div>
              )}

              {wallet.installed && !wallet.isConnected && (
                <button
                  type="button"
                  onClick={() => void wallet.connectWallet()}
                  className="w-full inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition"
                >
                  <Send className="h-4 w-4" />
                  <span>Connect MetaMask Wallet</span>
                </button>
              )}

              {wallet.installed && wallet.isConnected && !walletMatchesCustodian && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-[11px] font-semibold text-rose-800">
                  The connected wallet must match the current custodian wallet to transfer this evidence.
                </div>
              )}

            {/* Auth checkbox */}
            <div className="space-y-3">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checkedAuth}
                  onChange={(e) => setCheckedAuth(e.target.checked)}
                  disabled={status !== "idle"}
                  className="mt-0.5 h-4 w-4 rounded border-slate-350 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-[11px] text-slate-600 leading-tight">
                  I authorize this custody handover using my cryptographic private key. This action will be permanently recorded on the blockchain ledger.
                </span>
              </label>

              <div>
                <span className="block text-[10px] font-semibold text-slate-400 uppercase">Signer Passphrase / PIN</span>
                <div className="relative mt-1">
                  <Key className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    placeholder="Enter security key pin..."
                    value={authPin}
                    onChange={(e) => setAuthPin(e.target.value)}
                    disabled={status !== "idle"}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pr-4 pl-10 text-xs text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition"
                  />
                </div>
              </div>
            </div>

            {status === "idle" ? (
              <button
                type="button"
                onClick={executeTransfer}
                disabled={!canTransfer}
                className="w-full inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
                <span>{walletMatchesCustodian ? "Execute Transfer Handoff" : "Connect Custodian Wallet"}</span>
              </button>
            ) : (
              <div className="border border-slate-200 rounded-xl bg-slate-50 p-4 text-center space-y-3">
                <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-800">
                  <Cpu className="h-4 w-4 text-blue-600 animate-spin" />
                  <span>Blockchain Handoff Progress</span>
                </div>
                <p className="text-[11px] text-slate-500">{stepMsg}</p>
              </div>
            )}

            {status === "confirmed" && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs space-y-3">
                <div className="flex items-center gap-2 text-emerald-800 font-bold">
                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                  <span>Intake Confirmed</span>
                </div>
                <p className="text-emerald-700 text-[11px] leading-relaxed">
                  Custody successfully transferred to <span className="font-bold">{recipient.name}</span>. The evidence logs have been updated.
                </p>
                <div className="pt-2 border-t border-emerald-100 flex gap-2 font-mono text-[9px]">
                  <span className="text-emerald-600 font-bold">Receipt ID:</span>
                  <span className="text-slate-600">0x55db2f7f82ab...e8c1</span>
                </div>
              </div>
            )}
          </div>
        </section>
      </aside>
    </div>
  );
}

export default function TransferCustodyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-12 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <Clock className="h-5 w-5 text-slate-400 animate-pulse mr-2" />
          <span className="text-xs text-slate-500 font-semibold">Loading custody data...</span>
        </div>
      }
    >
      <TransferForm />
    </Suspense>
  );
}
