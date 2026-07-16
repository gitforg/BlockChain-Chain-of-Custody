"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";
import {
  fetchEvidenceList,
  finalizeEvidenceRegistration,
  prepareEvidenceRegistration,
} from "@/lib/api";
import { ensureSepoliaNetwork, sendWalletSignedRegistration } from "@/lib/chain";
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
  const [minedBlock, setMinedBlock] = useState("");
  const [minedHash, setMinedHash] = useState("");

  const next = () => setStep((current) => Math.min(current + 1, steps.length - 1));
  const back = () => setStep((current) => Math.max(current - 1, 0));

  useEffect(() => {
    async function loadSuggestedCaseId() {
      try {
        setCaseIdLoading(true);
        const response = await fetchEvidenceList({ limit: 1000 });
        const suggestedCaseId = buildNextCaseId(response.items.map((item: any) => item.caseId).filter(Boolean));
        setForm((current) => (current.caseId ? current : { ...current, caseId: suggestedCaseId }));
      } catch (error) {
        console.error("Failed to load next case ID:", error);
        const fallbackCaseId = `CASE-${new Date().getFullYear()}-001`;
        setForm((current) => (current.caseId ? current : { ...current, caseId: fallbackCaseId }));
      } finally {
        setCaseIdLoading(false);
      }
    }

    loadSuggestedCaseId();
  }, []);

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
      alert("Failed to hash file content.");
    } finally {
      setIsHashing(false);
    }
  }

  function setIpfsDetails(cid: string) {
    setSimulatedCid(cid);
  }

  async function executeLedgerSubmit() {
    if (!form.title.trim()) {
      alert("Please enter an evidence title.");
      return;
    }
    if (files.length === 0) {
      alert("Please upload at least one file to hash before submission.");
      return;
    }
    if (!wallet.installed) {
      alert("MetaMask is not installed.");
      return;
    }
    if (!wallet.connectedAddress) {
      alert("Please connect your MetaMask wallet before registering evidence.");
      return;
    }

    setTxState("submitting");
    setTxMsg("Preparing payload and waiting for MetaMask signature...");

    try {
      await ensureSepoliaNetwork();

      const formData = new FormData();
      formData.append("file", files[0]);

      const prepared = await prepareEvidenceRegistration(formData);
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
      alert(err.message || "Failed to submit evidence registration.");
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <section className="border border-slate-200 bg-white p-6 rounded-2xl shadow-xs space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Intake Center</p>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Register Case Evidence</h1>
        <p className="text-xs text-slate-500">
          Guided setup to register physical/digital evidence metadata and anchor fingerprints on the blockchain.
        </p>
      </section>

      {/* Progress wizard indicator */}
      <div className="border border-slate-200 bg-white p-5 rounded-2xl shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {steps.map((label, index) => {
            const active = step === index;
            const done = step > index;

            return (
              <div key={label} className="flex-1 flex items-center gap-3">
                <span className={`flex h-7 w-7 items-center justify-center rounded-lg border text-xs font-bold ${
                  active
                    ? "bg-blue-600 border-blue-600 text-white shadow-xs"
                    : done
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700 font-bold"
                    : "bg-slate-50 border-slate-200 text-slate-400"
                }`}>
                  {index + 1}
                </span>
                <span className={`text-xs font-semibold ${active ? "text-slate-900 font-bold" : done ? "text-slate-700" : "text-slate-400"}`}>
                  {label}
                </span>
                {index < steps.length - 1 && (
                  <span className="hidden sm:inline-block flex-1 h-[1px] bg-slate-200 mx-4" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Layout Form */}
      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="border border-slate-200 bg-white p-6 rounded-2xl shadow-xs space-y-5">
          {/* Step 1: General Info */}
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Case & General Information</h2>
                <p className="text-[11px] text-slate-400 mt-0.5">Define the case tracking logs and intake labels.</p>
              </div>

              <div className="space-y-3 text-xs">
                <label className="block">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">Evidence Title</span>
                  <input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 transition"
                    placeholder="E.g. Seized Laptop Clone Package..."
                  />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase">Case ID Reference</span>
                    <input
                      value={form.caseId}
                      onChange={(e) => setForm({ ...form, caseId: e.target.value })}
                      placeholder={caseIdLoading ? "Loading next case number..." : "CASE-2026-042"}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition"
                    />
                  </label>
                  
                  <label className="block">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase">Evidence Classification</span>
                    <select
                      value={form.classification}
                      onChange={(e) => setForm({ ...form, classification: e.target.value })}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-650 outline-none focus:border-blue-500 focus:bg-white transition"
                    >
                      <option>Restricted</option>
                      <option>Confidential</option>
                      <option>Public</option>
                    </select>
                  </label>
                </div>

                <label className="block">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">Intake Comments & Notes</span>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="mt-1.5 min-h-24 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition"
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
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Custody Location Details</h2>
                <p className="text-[11px] text-slate-400 mt-0.5">Assign the initial holder and shelf coordinates.</p>
              </div>

              <div className="space-y-3 text-xs">
                <label className="block">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">Assignee Custodian Name</span>
                  <input
                    value={form.custodian}
                    onChange={(e) => setForm({ ...form, custodian: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition"
                  />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase">Vault Facility Coordinates</span>
                    <input
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition"
                    />
                  </label>
                  
                  <label className="block">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase">Responsible Division</span>
                    <input
                      value={form.department}
                      onChange={(e) => setForm({ ...form, department: e.target.value })}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition"
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
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Payload Attachments</h2>
                <p className="text-[11px] text-slate-400 mt-0.5">Attach evidence files to compute the cryptographic fingerprint.</p>
              </div>

              <div className="space-y-4 text-xs">
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-250 rounded-xl bg-slate-50/50 px-6 py-8 text-center cursor-pointer hover:bg-slate-50 hover:border-blue-300 transition">
                  <Upload className="h-6 w-6 text-blue-600" />
                  <span className="mt-2 block text-xs font-semibold text-slate-900 font-sans">Click to attach file payload</span>
                  <input
                    type="file"
                    multiple
                    className="sr-only"
                    onChange={(e) => handleFileChange(e.target.files)}
                  />
                </label>

                {files.length > 0 && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-150 pb-2">
                      <span className="font-semibold text-slate-900">Intake File:</span>
                      <span className="text-[10px] font-mono text-slate-450">{files[0].name}</span>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <span className="block text-[9px] font-semibold text-slate-400 uppercase">Computed SHA-256 fingerprint</span>
                        {isHashing ? (
                          <span className="text-[10px] text-slate-500 font-semibold italic animate-pulse">Hashing sectors...</span>
                        ) : (
                          <span className="block font-mono text-[10px] text-slate-700 bg-white border border-slate-150 p-2 rounded-lg mt-1 break-all select-all">
                            {calculatedHash}
                          </span>
                        )}
                      </div>

                      <div>
                        <span className="block text-[9px] font-semibold text-slate-400 uppercase">Simulated IPFS CID hash</span>
                        <span className="block font-mono text-[10px] text-slate-700 bg-white border border-slate-150 p-2 rounded-lg mt-1 break-all">
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
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Registry Summary Review</h2>
                <p className="text-[11px] text-slate-400 mt-0.5">Verify details before committing values to the blockchain node.</p>
              </div>

              <div className="border border-slate-200 rounded-xl bg-slate-50 p-4 space-y-2.5 text-xs">
                <div className="flex justify-between border-b border-slate-150 pb-2">
                  <span className="text-slate-400 font-medium">Evidence Title</span>
                  <span className="font-bold text-slate-950">{form.title || "Untitled File"}</span>
                </div>
                <div className="flex justify-between border-b border-slate-150 pb-2">
                  <span className="text-slate-400 font-medium">Case Reference</span>
                  <span className="font-semibold text-slate-800">{form.caseId}</span>
                </div>
                <div className="flex justify-between border-b border-slate-150 pb-2">
                  <span className="text-slate-400 font-medium">Custodian Assignee</span>
                  <span className="font-semibold text-slate-800">{form.custodian}</span>
                </div>
                <div className="flex justify-between border-b border-slate-150 pb-2">
                  <span className="text-slate-400 font-medium">Intake Coordinates</span>
                  <span className="font-semibold text-slate-800">{form.location}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block mb-1">SHA-256 Hash to commit</span>
                  <span className="block font-mono text-[10px] bg-white border border-slate-150 p-2 rounded-lg text-slate-600 break-all">{calculatedHash}</span>
                </div>
              </div>

              {txState === "submitting" && (
                <div className="border border-slate-250 rounded-xl bg-slate-50 p-4 text-center space-y-2">
                  <Cpu className="h-5 w-5 text-blue-600 animate-spin mx-auto" />
                  <p className="text-xs font-semibold text-slate-800">Anchoring Registry Ledger Node</p>
                  <p className="text-[10px] text-slate-500 italic">{txMsg}</p>
                </div>
              )}

              {wallet.connectedAddress && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-[11px] text-slate-600 space-y-1">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-slate-500 uppercase text-[10px]">Connected Wallet</span>
                    <span className="font-mono text-slate-800">{abbreviateWalletAddress(wallet.connectedAddress)}</span>
                  </div>
                </div>
              )}

              {txState === "confirmed" && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs space-y-3.5">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold">
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                    <span>Evidence Registered Successfully</span>
                  </div>
                  <div className="grid gap-2 border-t border-emerald-100 pt-3 text-[10px] font-mono text-slate-600">
                    <div className="flex justify-between">
                      <span>Mined Block:</span>
                      <span className="text-slate-800 font-bold">{minedBlock}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ledger Tx Hash:</span>
                      <span className="text-slate-800 font-bold truncate max-w-sm" title={minedHash}>{minedHash}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Wizard Controls */}
          <div className="mt-8 pt-4 border-t border-slate-150 flex items-center justify-between gap-3 print:hidden">
            <button
              type="button"
              onClick={back}
              disabled={step === 0 || txState === "submitting"}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-xs"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </button>

            {step < steps.length - 1 ? (
              <button
                type="button"
                onClick={next}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition"
              >
                <span>Continue</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={executeLedgerSubmit}
                disabled={txState !== "idle"}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition"
              >
                <Shield className="h-4 w-4" />
                <span>Submit to Ledger</span>
              </button>
            )}
          </div>
        </section>

        {/* Info panel */}
        <aside className="space-y-4 border border-slate-200 bg-white p-6 rounded-2xl shadow-xs self-start print:hidden">
          <div className="rounded-xl bg-slate-50 p-4 border border-slate-100 text-xs space-y-2">
            <div className="flex items-center gap-2 font-semibold text-slate-800">
              <Shield className="h-4.5 w-4.5 text-blue-600" />
              <span>Cryptographic Intake Policy</span>
            </div>
            <p className="text-slate-500 leading-relaxed text-[11px]">
              Every file payload is hashed client-side. The computed hash serves as the immutable digital fingerprint, ensuring contents cannot be altered once written to the smart contract registry.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2 text-xs">
            <span className="block text-[10px] font-semibold text-slate-400 uppercase">Current Phase</span>
            <p className="font-bold text-slate-900 flex items-center gap-1.5">
              <ChevronRightIcon className="h-4 w-4 text-blue-600 shrink-0" />
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
