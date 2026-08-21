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
import { describeWalletError, ensureTargetNetwork, getRegistryReadContract, sendWalletSignedTransfer } from "@/lib/chain";
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
  const [errorMsg, setErrorMsg] = useState("");
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
    setErrorMsg("");

    if (!reason.trim()) {
      setErrorMsg("Please state the reason for this custody transfer.");
      return;
    }
    if (!checkedAuth) {
      setErrorMsg("Please tick the digital signature authorization box before transferring.");
      return;
    }
    if (!wallet.installed) {
      setErrorMsg("MetaMask was not detected. Install the extension, reload this page, then try again.");
      return;
    }
    if (!walletMatchesCustodian) {
      setErrorMsg("The connected wallet does not match the current custodian wallet for this evidence.");
      return;
    }

    setStatus("signing");
    setStepMsg("Signing evidence custody transfer request...");

    try {
      await ensureTargetNetwork();
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
      setErrorMsg(describeWalletError(err) || "Failed to execute transfer.");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      {/* Input panel */}
      <section className="space-y-6">
        <article className="border border-zinc-800 bg-zinc-900/40 p-6 rounded-md space-y-5">
          <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
            <Users className="h-5 w-5 text-cyan-400" />
            <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">Custody Handover Handoff</h2>
          </div>

          <div className="space-y-4">
            {/* Select Target Evidence */}
            <div>
              <label className="block text-[10px] font-semibold text-zinc-600 uppercase">Target Evidence ID</label>
              <select
                value={evidenceId}
                onChange={(e) => setEvidenceId(e.target.value)}
                disabled={status !== "idle"}
                className="mt-1.5 w-full rounded border border-zinc-800 bg-zinc-900/40 px-3.5 py-2.5 text-xs font-semibold text-zinc-300 outline-none focus:border-cyan-500 focus:bg-zinc-900 transition"
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
              <label className="block text-[10px] font-semibold text-zinc-600 uppercase mb-2">Select Recipient Custodian</label>
              <div className="grid gap-3">
                {transferRecipients.map((entry, index) => {
                  const active = recipientIndex === index;

                  return (
                    <button
                      key={entry.wallet}
                      type="button"
                      disabled={status !== "idle"}
                      onClick={() => setRecipientIndex(index)}
                      className={`w-full rounded border p-4 text-left transition text-xs ${
                        active
                          ? "border-cyan-500 bg-cyan-500/10"
                          : "border-zinc-800 bg-zinc-900/40 hover:bg-zinc-800"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-bold text-zinc-100">{entry.name}</p>
                          <p className="text-[10px] text-zinc-600 mt-0.5">{entry.role} • {entry.department}</p>
                        </div>
                        <span className="font-mono text-[9px] bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded border border-zinc-800">
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
              <label className="block text-[10px] font-semibold text-zinc-600 uppercase">Reason for Handoff</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={status !== "idle"}
                className="mt-1.5 min-h-20 w-full rounded border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs text-zinc-200 outline-none focus:border-cyan-500 focus:bg-zinc-900 transition"
                placeholder="State forensic case, transfer authorization, or courier transit detail..."
                required
              />
            </div>
          </div>
        </article>
      </section>

      {/* Signing Panel */}
      <aside className="space-y-6">
        <section className="border border-zinc-800 bg-zinc-900/40 p-6 rounded-md space-y-5">
          <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider border-b border-zinc-800 pb-2">Transaction Signing</h3>
          
          <div className="space-y-4 text-xs">
            <div className="rounded border border-zinc-800 bg-zinc-900/40 p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-zinc-600 font-semibold">Evidence Ref</span>
                <span className="font-bold text-zinc-100">{selectedEvidence?.id || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600 font-semibold">Current Holder</span>
                <span className="font-semibold text-zinc-100">{selectedEvidence?.custodian || "N/A"}</span>
              </div>
                <div className="flex justify-between gap-3">
                  <span className="text-zinc-600 font-semibold">Current Wallet</span>
                  <span className="font-mono text-zinc-100 text-[10px] truncate" title={currentCustodianWallet || ""}>
                    {currentCustodianWallet ? abbreviateWalletAddress(String(currentCustodianWallet)) : "Unlinked"}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-zinc-600 font-semibold">Creator Wallet</span>
                  <span className="font-mono text-zinc-100 text-[10px] truncate" title={creatorWallet || ""}>
                    {creatorWallet ? abbreviateWalletAddress(String(creatorWallet)) : "Unknown"}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-zinc-600 font-semibold">Connected Wallet</span>
                  <span className="font-mono text-zinc-100 text-[10px] truncate" title={connectedWallet || ""}>
                    {connectedWallet ? abbreviateWalletAddress(connectedWallet) : "Not connected"}
                  </span>
                </div>
              <div className="flex justify-between">
                <span className="text-zinc-600 font-semibold">Handoff Target</span>
                <span className="font-semibold text-zinc-100">{recipient.name}</span>
              </div>
            </div>

              {!wallet.installed && (
                <div className="rounded border border-amber-500/25 bg-amber-500/10 p-3 text-[11px] font-semibold text-amber-200">
                  MetaMask is not installed. Install the extension to sign custody transfers locally.
                </div>
              )}

              {wallet.installed && !wallet.isConnected && (
                <button
                  type="button"
                  onClick={() => void wallet.connectWallet()}
                  className="w-full inline-flex h-10 items-center justify-center gap-2 rounded border border-cyan-500/30 bg-cyan-500/10 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 transition"
                >
                  <Send className="h-4 w-4" />
                  <span>Connect MetaMask Wallet</span>
                </button>
              )}

              {wallet.installed && wallet.isConnected && !walletMatchesCustodian && (
                <div className="rounded border border-rose-500/25 bg-rose-500/10 p-3 text-[11px] font-semibold text-rose-200">
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
                  className="mt-0.5 h-4 w-4 rounded border-zinc-700 text-cyan-400 focus:ring-cyan-500"
                />
                <span className="text-[11px] text-zinc-400 leading-tight">
                  I authorize this custody handover using my cryptographic private key. This action will be permanently recorded on the blockchain ledger.
                </span>
              </label>

              <div>
                <span className="block text-[10px] font-semibold text-zinc-600 uppercase">Signer Passphrase / PIN</span>
                <div className="relative mt-1">
                  <Key className="absolute top-2.5 left-3 h-4 w-4 text-zinc-600" />
                  <input
                    type="password"
                    placeholder="Enter security key pin..."
                    value={authPin}
                    onChange={(e) => setAuthPin(e.target.value)}
                    disabled={status !== "idle"}
                    className="w-full rounded border border-zinc-800 bg-zinc-900/40 py-2 pr-4 pl-10 text-xs text-zinc-200 outline-none focus:border-cyan-500 focus:bg-zinc-900 transition"
                  />
                </div>
              </div>
            </div>

            {/* Inline error surface — MetaMask rejections, gas failures,
                validation problems and backend errors all land here. */}
            {errorMsg && (
              <div className="flex items-start gap-3 rounded border border-rose-500/25 bg-rose-500/10 p-4">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-rose-200">Transfer not completed</p>
                  <p className="mt-1 text-xs leading-relaxed text-rose-300">{errorMsg}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setErrorMsg("")}
                  className="shrink-0 rounded-md p-0.5 text-rose-400 hover:bg-rose-500/20 hover:text-rose-800 transition"
                  aria-label="Dismiss error"
                >
                  ✕
                </button>
              </div>
            )}

            {status === "idle" ? (
              <button
                type="button"
                onClick={executeTransfer}
                disabled={!canTransfer}
                className="w-full inline-flex h-11 items-center justify-center gap-2 rounded bg-cyan-600 text-xs font-semibold text-white hover:bg-cyan-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
                <span>{walletMatchesCustodian ? "Execute Transfer Handoff" : "Connect Custodian Wallet"}</span>
              </button>
            ) : (
              <div className="border border-zinc-800 rounded bg-zinc-900/40 p-4 text-center space-y-3">
                <div className="flex items-center justify-center gap-2 text-xs font-semibold text-zinc-200">
                  <Cpu className="h-4 w-4 text-cyan-400 animate-spin" />
                  <span>Blockchain Handoff Progress</span>
                </div>
                <p className="text-[11px] text-zinc-500">{stepMsg}</p>
              </div>
            )}

            {status === "confirmed" && (
              <div className="rounded border border-emerald-500/25 bg-emerald-500/10 p-4 text-xs space-y-3">
                <div className="flex items-center gap-2 text-emerald-200 font-bold">
                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                  <span>Intake Confirmed</span>
                </div>
                <p className="text-emerald-300 text-[11px] leading-relaxed">
                  Custody successfully transferred to <span className="font-bold">{recipient.name}</span>. The evidence logs have been updated.
                </p>
                <div className="pt-2 border-t border-emerald-100 flex gap-2 font-mono text-[9px]">
                  <span className="text-emerald-600 font-bold">Receipt ID:</span>
                  <span className="text-zinc-400">0x55db2f7f82ab...e8c1</span>
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
        <div className="flex items-center justify-center p-12 bg-zinc-900/40 rounded-md border border-zinc-800">
          <Clock className="h-5 w-5 text-zinc-600 animate-pulse mr-2" />
          <span className="text-xs text-zinc-500 font-semibold">Loading custody data...</span>
        </div>
      }
    >
      <TransferForm />
    </Suspense>
  );
}
