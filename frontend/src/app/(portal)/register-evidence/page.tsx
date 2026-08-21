"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FilePlus,
  Shield,
  Upload,
  CheckCircle2,
  FileText,
  Key,
  Compass,
  Cpu,
  ArrowRight,
  ArrowLeft,
  Hash,
  AlertTriangle,
  X,
} from "lucide-react";
import {
  fetchEvidenceList,
  finalizeEvidenceRegistration,
  prepareEvidenceRegistration,
} from "@/lib/api";
import { describeWalletError, ensureTargetNetwork, sendWalletSignedRegistration } from "@/lib/chain";
import { sha256HexFromFile } from "@/lib/file-hash";
import { useWallet, abbreviateWalletAddress } from "@/components/wallet-provider";

const steps = ["General Info", "Custodian Details", "Upload & Hash", "Ledger Submission"];

function buildNextCaseId(existingCaseIds: string[]): string {
  const currentYear = new Date().getFullYear();
  const prefix = `CASE-${currentYear}-`;
  const sequences = existingCaseIds
    .map((caseId) => {
      const match = caseId.match(/^CASE-(\d{4})-(\d+)$/);
      if (!match || match[1] !== String(currentYear)) return null;
      return { value: Number(match[2]), width: match[2].length };
    })
    .filter((entry): entry is { value: number; width: number } => entry !== null);

  if (sequences.length === 0) {
    return `${prefix}001`;
  }

  const nextSequence = sequences.reduce((highest, entry) => {
    if (entry.value > highest.value) return entry;
    return highest;
  });

  const nextValue = nextSequence.value + 1;
  const width = Math.max(3, nextSequence.width);
  return `${prefix}${String(nextValue).padStart(width, "0")}`;
}

export default function RegisterEvidencePage() {
  const router = useRouter();
  const wallet = useWallet();
  const [step, setStep] = useState(0);
  const [files, setFiles] = useState<File[]>([]);
  const [isHashing, setIsHashing] = useState(false);
  const [calculatedHash, setCalculatedHash] = useState("");
  const [simulatedCid, setSimulatedCid] = useState("");
  const [caseIdLoading, setCaseIdLoading] = useState(true);

  const [form, setForm] = useState({
    title: "",
    caseId: "",
    classification: "Restricted",
    notes: "",
    custodian: "Officer Robert Vance",
    location: "Vault Room B, Shelf 4",
    department: "Intake Division",
  });

  const [txState, setTxState] = useState<"idle" | "submitting" | "confirmed">("idle");
  const [txMsg, setTxMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [minedBlock, setMinedBlock] = useState("");
  const [minedHash, setMinedHash] = useState("");

  const next = () => setStep((current) => Math.min(current + 1, steps.length - 1));
  const back = () => setStep((current) => Math.max(current - 1, 0));

  /** Clears the wizard for a fresh intake and re-suggests the next case number. */
  function resetWizard() {
    setStep(0);
    setFiles([]);
    setCalculatedHash("");
    setSimulatedCid("");
    setTxState("idle");
    setTxMsg("");
    setMinedBlock("");
    setMinedHash("");
    setErrorMsg("");
    setForm((current) => ({ ...current, title: "", notes: "", caseId: "" }));
    void refreshSuggestedCaseId();
  }

  const refreshSuggestedCaseId = useCallback(async () => {
    try {
      setCaseIdLoading(true);
      const response = await fetchEvidenceList({ limit: 1000 });
      const suggestedCaseId = buildNextCaseId(
        response.items.map((item: { caseId?: string }) => item.caseId ?? "").filter(Boolean),
      );
      setForm((current) => (current.caseId ? current : { ...current, caseId: suggestedCaseId }));
    } catch (error) {
      console.error("Failed to load next case ID:", error);
      const fallbackCaseId = `CASE-${new Date().getFullYear()}-001`;
      setForm((current) => (current.caseId ? current : { ...current, caseId: fallbackCaseId }));
    } finally {
      setCaseIdLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshSuggestedCaseId();
  }, [refreshSuggestedCaseId]);

  // Compute real SHA-256 hash using web crypto
  async function handleFileChange(selectedFiles: FileList | null) {
    if (!selectedFiles) return;
    const fileList = Array.from(selectedFiles);
    setFiles(fileList);
    setIsHashing(true);

    try {
      const sha256Hex = await sha256HexFromFile(fileList[0]);
      setCalculatedHash(sha256Hex);

      // Simulate IPFS CID
      const mockCid = "Qm" + sha256Hex.slice(10, 56);
      setIpfsDetails(mockCid);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to read and hash the selected file. Try a different file.");
    } finally {
      setIsHashing(false);
    }
  }

  function setIpfsDetails(cid: string) {
    setSimulatedCid(cid);
  }

  async function executeLedgerSubmit() {
    setErrorMsg("");

    if (!form.title.trim()) {
      setErrorMsg("Please enter an evidence title on step 1 before submitting.");
      return;
    }
    if (files.length === 0) {
      setErrorMsg("Please attach at least one evidence file on step 3 before submitting.");
      return;
    }
    if (!wallet.installed) {
      setErrorMsg(
        "MetaMask was not detected. Install the MetaMask extension, reload this page, then try again.",
      );
      return;
    }

    setTxState("submitting");

    try {
      // Connect on demand rather than dead-ending the user on a disabled button.
      if (!wallet.connectedAddress) {
        setTxMsg("Waiting for MetaMask connection approval...");
        await wallet.connectWallet();
      }

      setTxMsg(`Switching MetaMask to ${wallet.targetChainName}...`);
      await ensureTargetNetwork();

      setTxMsg("Uploading payload to IPFS and computing fingerprint...");

      const formData = new FormData();
      formData.append("file", files[0]);

      const prepared = await prepareEvidenceRegistration(formData);

      setTxMsg("Confirm the transaction in MetaMask to anchor it on-chain...");

      const walletTx = await sendWalletSignedRegistration(
        prepared.evidenceId,
        form.caseId,
        prepared.fileHash,
        prepared.ipfsCid,
      );

      const response = await finalizeEvidenceRegistration({
        evidenceId: prepared.evidenceId,
        title: form.title,
        caseId: form.caseId,
        classification: form.classification,
        notes: form.notes,
        custodian: form.custodian,
        location: form.location,
        department: form.department,
        type: files[0].name.split(".").pop()?.toUpperCase() + " File" || "Digital Evidence",
        fileHash: prepared.fileHash,
        ipfsCid: prepared.ipfsCid,
        filePath: prepared.gatewayUrl,
        fileName: prepared.fileName,
        fileSize: prepared.fileSize,
        txHash: walletTx.txHash,
        blockNumber: walletTx.blockNumber,
        creatorWallet: wallet.connectedAddress,
      });

      setTxState("confirmed");
      setMinedBlock("Verified Block");
      setMinedHash(response.txHash || "0xSimulatedTxHash");
      setTxMsg("Evidence successfully registered and anchored on the ledger by the connected wallet!");
    } catch (err: any) {
      console.error(err);
      setTxState("idle");
      setTxMsg("");
      setErrorMsg(describeWalletError(err) || "Failed to submit evidence registration.");
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <section className="border border-zinc-800 bg-zinc-900/40 p-6 rounded-md space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600">Intake Center</p>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Register Case Evidence</h1>
        <p className="text-xs text-zinc-500">
          Guided setup to register physical/digital evidence metadata and anchor fingerprints on the blockchain.
        </p>
      </section>

      {/* Progress wizard indicator */}
      <div className="border border-zinc-800 bg-zinc-900/40 p-5 rounded-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {steps.map((label, index) => {
            const active = step === index;
            const done = step > index;

            return (
              <div key={label} className="flex-1 flex items-center gap-3">
                <span className={`flex h-7 w-7 items-center justify-center rounded-lg border text-xs font-bold ${
                  active
                    ? "bg-cyan-600 border-blue-600 text-white "
                    : done
                    ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-300 font-bold"
                    : "bg-zinc-900/40 border-zinc-800 text-zinc-600"
                }`}>
                  {index + 1}
                </span>
                <span className={`text-xs font-semibold ${active ? "text-zinc-100 font-bold" : done ? "text-zinc-300" : "text-zinc-600"}`}>
                  {label}
                </span>
                {index < steps.length - 1 && (
                  <span className="hidden sm:inline-block flex-1 h-[1px] bg-zinc-800 mx-4" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Layout Form */}
      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="border border-zinc-800 bg-zinc-900/40 p-6 rounded-md space-y-5">
          {/* Step 1: General Info */}
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">Case & General Information</h2>
                <p className="text-[11px] text-zinc-600 mt-0.5">Define the case tracking logs and intake labels.</p>
              </div>

              <div className="space-y-3 text-xs">
                <label className="block">
                  <span className="text-[10px] font-semibold text-zinc-600 uppercase">Evidence Title</span>
                  <input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="mt-1.5 w-full rounded border border-zinc-800 bg-zinc-900/40 px-3.5 py-2.5 text-xs text-zinc-200 outline-none focus:border-cyan-500 focus:bg-zinc-900 focus:ring-1 focus:ring-cyan-500 transition"
                    placeholder="E.g. Seized Laptop Clone Package..."
                  />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-[10px] font-semibold text-zinc-600 uppercase">Case ID Reference</span>
                    <input
                      value={form.caseId}
                      onChange={(e) => setForm({ ...form, caseId: e.target.value })}
                      placeholder={caseIdLoading ? "Loading next case number..." : "CASE-2026-042"}
                      className="mt-1.5 w-full rounded border border-zinc-800 bg-zinc-900/40 px-3.5 py-2.5 text-xs text-zinc-200 outline-none focus:border-cyan-500 focus:bg-zinc-900 transition"
                    />
                  </label>
                  
                  <label className="block">
                    <span className="text-[10px] font-semibold text-zinc-600 uppercase">Evidence Classification</span>
                    <select
                      value={form.classification}
                      onChange={(e) => setForm({ ...form, classification: e.target.value })}
                      className="mt-1.5 w-full rounded border border-zinc-800 bg-zinc-900/40 px-3.5 py-2.5 text-xs text-zinc-400 outline-none focus:border-cyan-500 focus:bg-zinc-900 transition"
                    >
                      <option>Restricted</option>
                      <option>Confidential</option>
                      <option>Public</option>
                    </select>
                  </label>
                </div>

                <label className="block">
                  <span className="text-[10px] font-semibold text-zinc-600 uppercase">Intake Comments & Notes</span>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="mt-1.5 min-h-24 w-full rounded border border-zinc-800 bg-zinc-900/40 px-3.5 py-2.5 text-xs text-zinc-200 outline-none focus:border-cyan-500 focus:bg-zinc-900 transition"
                    placeholder="E.g. Cloned partition hashes match sector counts. Sealed bag ID..."
                  />
                </label>
              </div>
            </div>
          )}

          {/* Step 2: Custodian Info */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">Custody Location Details</h2>
                <p className="text-[11px] text-zinc-600 mt-0.5">Assign the initial holder and shelf coordinates.</p>
              </div>

              <div className="space-y-3 text-xs">
                <label className="block">
                  <span className="text-[10px] font-semibold text-zinc-600 uppercase">Assignee Custodian Name</span>
                  <input
                    value={form.custodian}
                    onChange={(e) => setForm({ ...form, custodian: e.target.value })}
                    className="mt-1.5 w-full rounded border border-zinc-800 bg-zinc-900/40 px-3.5 py-2.5 text-xs text-zinc-200 outline-none focus:border-cyan-500 focus:bg-zinc-900 transition"
                  />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-[10px] font-semibold text-zinc-600 uppercase">Vault Facility Coordinates</span>
                    <input
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                      className="mt-1.5 w-full rounded border border-zinc-800 bg-zinc-900/40 px-3.5 py-2.5 text-xs text-zinc-200 outline-none focus:border-cyan-500 focus:bg-zinc-900 transition"
                    />
                  </label>
                  
                  <label className="block">
                    <span className="text-[10px] font-semibold text-zinc-600 uppercase">Responsible Division</span>
                    <input
                      value={form.department}
                      onChange={(e) => setForm({ ...form, department: e.target.value })}
                      className="mt-1.5 w-full rounded border border-zinc-800 bg-zinc-900/40 px-3.5 py-2.5 text-xs text-zinc-200 outline-none focus:border-cyan-500 focus:bg-zinc-900 transition"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Hashing */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">Payload Attachments</h2>
                <p className="text-[11px] text-zinc-600 mt-0.5">Attach evidence files to compute the cryptographic fingerprint.</p>
              </div>

              <div className="space-y-4 text-xs">
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-700 rounded bg-zinc-800/40 px-6 py-8 text-center cursor-pointer hover:bg-zinc-800 hover:border-cyan-500/50 transition">
                  <Upload className="h-6 w-6 text-cyan-400" />
                  <span className="mt-2 block text-xs font-semibold text-zinc-100 font-sans">Click to attach file payload</span>
                  <input
                    type="file"
                    multiple
                    className="sr-only"
                    onChange={(e) => handleFileChange(e.target.files)}
                  />
                </label>

                {files.length > 0 && (
                  <div className="rounded border border-zinc-800 bg-zinc-900/40 p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                      <span className="font-semibold text-zinc-100">Intake File:</span>
                      <span className="text-[10px] font-mono text-zinc-500">{files[0].name}</span>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <span className="block text-[9px] font-semibold text-zinc-600 uppercase">Computed SHA-256 fingerprint</span>
                        {isHashing ? (
                          <span className="text-[10px] text-zinc-500 font-semibold italic animate-pulse">Hashing sectors...</span>
                        ) : (
                          <span className="block font-mono text-[10px] text-zinc-300 bg-zinc-900/40 border border-zinc-800 p-2 rounded-lg mt-1 break-all select-all">
                            {calculatedHash}
                          </span>
                        )}
                      </div>

                      <div>
                        <span className="block text-[9px] font-semibold text-zinc-600 uppercase">Simulated IPFS CID hash</span>
                        <span className="block font-mono text-[10px] text-zinc-300 bg-zinc-900/40 border border-zinc-800 p-2 rounded-lg mt-1 break-all">
                          {simulatedCid}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Submission */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">Registry Summary Review</h2>
                <p className="text-[11px] text-zinc-600 mt-0.5">Verify details before committing values to the blockchain node.</p>
              </div>

              <div className="border border-zinc-800 rounded bg-zinc-900/40 p-4 space-y-2.5 text-xs">
                <div className="flex justify-between border-b border-zinc-800 pb-2">
                  <span className="text-zinc-600 font-medium">Evidence Title</span>
                  <span className="font-bold text-zinc-50">{form.title || "Untitled File"}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-800 pb-2">
                  <span className="text-zinc-600 font-medium">Case Reference</span>
                  <span className="font-semibold text-zinc-200">{form.caseId}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-800 pb-2">
                  <span className="text-zinc-600 font-medium">Custodian Assignee</span>
                  <span className="font-semibold text-zinc-200">{form.custodian}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-800 pb-2">
                  <span className="text-zinc-600 font-medium">Intake Coordinates</span>
                  <span className="font-semibold text-zinc-200">{form.location}</span>
                </div>
                <div>
                  <span className="text-zinc-600 font-medium block mb-1">SHA-256 Hash to commit</span>
                  <span className="block font-mono text-[10px] bg-zinc-900/40 border border-zinc-800 p-2 rounded-lg text-zinc-400 break-all">{calculatedHash}</span>
                </div>
              </div>

              {txState === "submitting" && (
                <div className="border border-zinc-700 rounded bg-zinc-900/40 p-4 text-center space-y-2">
                  <Cpu className="h-5 w-5 text-cyan-400 animate-spin mx-auto" />
                  <p className="text-xs font-semibold text-zinc-200">Anchoring Registry Ledger Node</p>
                  <p className="text-[10px] text-zinc-500 italic">{txMsg}</p>
                </div>
              )}

              {wallet.connectedAddress && (
                <div className="rounded border border-zinc-800 bg-zinc-900/40 p-4 text-[11px] text-zinc-400 space-y-1">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-zinc-500 uppercase text-[10px]">Connected Wallet</span>
                    <span className="font-mono text-zinc-200">{abbreviateWalletAddress(wallet.connectedAddress)}</span>
                  </div>
                </div>
              )}

              {txState === "confirmed" && (
                <div className="rounded border border-emerald-500/25 bg-emerald-500/10 p-4 text-xs space-y-3.5">
                  <div className="flex items-center gap-2 text-emerald-200 font-bold">
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                    <span>Evidence Registered Successfully</span>
                  </div>
                  <div className="grid gap-2 border-t border-emerald-100 pt-3 text-[10px] font-mono text-zinc-400">
                    <div className="flex justify-between">
                      <span>Mined Block:</span>
                      <span className="text-zinc-200 font-bold">{minedBlock}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ledger Tx Hash:</span>
                      <span className="text-zinc-200 font-bold truncate max-w-sm" title={minedHash}>{minedHash}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Inline error surface — MetaMask rejections, insufficient gas,
              validation problems and backend failures all land here. */}
          {errorMsg && (
            <div className="flex items-start gap-3 rounded border border-rose-500/25 bg-rose-500/10 p-4">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-rose-200">Transaction not completed</p>
                <p className="mt-1 text-xs leading-relaxed text-rose-300">{errorMsg}</p>
              </div>
              <button
                type="button"
                onClick={() => setErrorMsg("")}
                className="shrink-0 rounded-md p-0.5 text-rose-400 hover:bg-rose-500/20 hover:text-rose-800 transition"
                aria-label="Dismiss error"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Wizard Controls */}
          <div className="mt-8 pt-4 border-t border-zinc-800 flex items-center justify-between gap-3 print:hidden">
            <button
              type="button"
              onClick={back}
              disabled={step === 0 || txState === "submitting"}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded border border-zinc-800 bg-zinc-900/40 px-4 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </button>

            {step < steps.length - 1 ? (
              <button
                type="button"
                onClick={next}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded bg-cyan-600 px-4 text-xs font-semibold text-white hover:bg-cyan-500 transition"
              >
                <span>Continue</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : txState === "confirmed" ? (
              /* The submit button is spent once the item is anchored. Offer the
                 next action instead of leaving a dead, permanently-disabled control. */
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => router.push("/evidence")}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded border border-zinc-800 bg-zinc-900/40 px-4 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition"
                >
                  <FileText className="h-4 w-4" />
                  <span>View in Archive</span>
                </button>
                <button
                  type="button"
                  onClick={resetWizard}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded bg-emerald-600 px-4 text-xs font-semibold text-white hover:bg-emerald-500 transition"
                >
                  <FilePlus className="h-4 w-4" />
                  <span>Register Another Item</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={executeLedgerSubmit}
                disabled={txState === "submitting"}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded bg-cyan-600 px-4 text-xs font-semibold text-white hover:bg-cyan-500 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500 transition"
              >
                {txState === "submitting" ? (
                  <>
                    <Cpu className="h-4 w-4 animate-pulse" />
                    <span>Anchoring…</span>
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4" />
                    <span>Submit to Ledger</span>
                  </>
                )}
              </button>
            )}
          </div>
        </section>

        {/* Info panel */}
        <aside className="space-y-4 border border-zinc-800 bg-zinc-900/40 p-6 rounded-md self-start print:hidden">
          <div className="rounded bg-zinc-900/40 p-4 border border-zinc-800 text-xs space-y-2">
            <div className="flex items-center gap-2 font-semibold text-zinc-200">
              <Shield className="h-4.5 w-4.5 text-cyan-400" />
              <span>Cryptographic Intake Policy</span>
            </div>
            <p className="text-zinc-500 leading-relaxed text-[11px]">
              Every file payload is hashed client-side. The computed hash serves as the immutable digital fingerprint, ensuring contents cannot be altered once written to the smart contract registry.
            </p>
          </div>

          <div className="rounded border border-zinc-800 bg-zinc-900/40 p-4 space-y-2 text-xs">
            <span className="block text-[10px] font-semibold text-zinc-600 uppercase">Current Phase</span>
            <p className="font-bold text-zinc-100 flex items-center gap-1.5">
              <ChevronRightIcon className="h-4 w-4 text-cyan-400 shrink-0" />
              <span>{steps[step]}</span>
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

// Chevron helper
function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
    </svg>
  );
}
