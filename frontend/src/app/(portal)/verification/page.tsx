"use client";

import { useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  Upload,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  FileText,
  Search,
  Lock,
  ChevronRight,
} from "lucide-react";
import { fetchEvidenceList, verifyEvidenceFile } from "@/lib/api";
import { sha256HexFromFile } from "@/lib/file-hash";
import { useEffect } from "react";

function VerificationCenter() {
  const searchParams = useSearchParams();
  const targetId = searchParams.get("id") || "";

  const [evidenceId, setEvidenceId] = useState(targetId);
  const [file, setFile] = useState<File | null>(null);
  const [isHashing, setIsHashing] = useState(false);
  const [calculatedHash, setCalculatedHash] = useState("");
  const [auditState, setAuditState] = useState<"idle" | "verified" | "tampered" | "unknown">("idle");
  const [matchedRecord, setMatchedRecord] = useState<any>(null);
  const [evidenceList, setEvidenceList] = useState<any[]>([]);

  useEffect(() => {
    async function loadEvidence() {
      try {
        const data = await fetchEvidenceList();
        setEvidenceList(data.items);
      } catch (err) {
        console.error("Failed to load evidence records:", err);
      }
    }
    loadEvidence();
  }, []);

  const targetRecord = useMemo(() => {
    return evidenceList.find((item) => item.id === evidenceId) || null;
  }, [evidenceId, evidenceList]);

  // Handle file selection and read SHA-256 hash using crypto.subtle
  async function handleFileChange(selectedFile: File) {
    setFile(selectedFile);
    setIsHashing(true);
    setAuditState("idle");
    setMatchedRecord(null);

    try {
      const sha256Hex = await sha256HexFromFile(selectedFile);
      setCalculatedHash(sha256Hex);
      setIsHashing(false);
    } catch (err) {
      console.error(err);
      setIsHashing(false);
      alert("Failed to compute file fingerprint hash.");
    }
  }

  // Execute verification audit comparing the computed hash with the register database
  async function handleVerify() {
    if (!file) {
      alert("Please upload a file first.");
      return;
    }

    setIsHashing(true);
    setAuditState("idle");
    setMatchedRecord(null);

    try {
      const response = await verifyEvidenceFile(file, evidenceId || undefined);
      setAuditState(response.status);
      setCalculatedHash(response.calculatedHash);
      setMatchedRecord(response.evidence);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to perform verification check.");
    } finally {
      setIsHashing(false);
    }
  }

  // Simulation shortcut: Let the developer match the active selected ID hash instantly
  function runVerificationSimulation() {
    if (!targetRecord) {
      alert("Please select a target Evidence ID from the registry list.");
      return;
    }
    setFile(new File(["evidence content"], `${targetRecord.id.toLowerCase()}_payload.bin`));
    setCalculatedHash(targetRecord.fileHash);
    setAuditState("verified");
    setMatchedRecord(targetRecord);
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <section className="border border-slate-200 bg-white p-6 rounded-2xl shadow-xs space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Integrity Audit</p>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Cryptographic Verification Center</h1>
        <p className="text-xs text-slate-500">
          Upload file bundles to compute real-time SHA-256 hashes and crosscheck them against blockchain ledger blocks.
        </p>
      </section>

      {/* Main Grid split */}
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-6">
          {/* Uploader Card */}
          <article className="border border-slate-200 bg-white p-6 rounded-2xl shadow-xs space-y-5">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">1. Intake File Payload</h2>
            
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 px-6 py-10 text-center cursor-pointer hover:bg-slate-50 hover:border-blue-300 transition">
              <Upload className="h-8 w-8 text-blue-600 animate-bounce" />
              <span className="mt-3 block text-xs font-semibold text-slate-900">Drop files here or click to browse</span>
              <span className="mt-1 block text-[10px] text-slate-400">Select any physical forensic clone, image, video or database bundle</span>
              <input
                type="file"
                className="sr-only"
                onChange={(e) => e.target.files && handleFileChange(e.target.files[0])}
              />
            </label>

            {file && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-xs font-bold text-slate-950 truncate max-w-sm">{file.name}</p>
                    <p className="text-[10px] text-slate-400">Size: {(file.size / 1024).toFixed(2)} KB</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-150">
                  <span className="block text-[10px] font-semibold text-slate-400 uppercase">Calculated SHA-256 Hash</span>
                  {isHashing ? (
                    <span className="text-[10px] text-slate-500 font-semibold italic animate-pulse">Hashing file blocks...</span>
                  ) : (
                    <span className="block font-mono text-[10px] text-slate-700 bg-white border border-slate-150 px-2 py-1.5 rounded-md mt-1 break-all">
                      {calculatedHash}
                    </span>
                  )}
                </div>
              </div>
            )}
          </article>

          {/* Audit Verification trigger card */}
          <article className="border border-slate-200 bg-white p-6 rounded-2xl shadow-xs space-y-5">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">2. Cross-reference Target Registry</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase">Expected Registry ID (Optional)</label>
                <select
                  value={evidenceId}
                  onChange={(e) => setEvidenceId(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition"
                >
                  <option value="">Query entire ledger (General lookup)</option>
                  {evidenceList.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.id} - expected: {item.fileHash.slice(0, 10)}...
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">If specified, we audit whether the hash matches this specific record. Otherwise, we query the entire ledger.</p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleVerify}
                  disabled={isHashing || (!calculatedHash && !file)}
                  className="flex-1 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>Verify Against Ledger</span>
                </button>
                
                <button
                  type="button"
                  onClick={runVerificationSimulation}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs"
                  title="Simulate validation of active dropdown item without manual upload"
                >
                  Simulate Verify
                </button>
              </div>
            </div>
          </article>
        </section>

        {/* Results Pane */}
        <aside className="space-y-6">
          <section className="border border-slate-200 bg-white p-6 rounded-2xl shadow-xs space-y-6">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">Audit Verdict</h3>

            {auditState === "idle" && (
              <div className="text-center py-12 text-slate-400 space-y-3">
                <HelpCircle className="h-10 w-10 mx-auto text-slate-300" />
                <p className="text-xs font-semibold leading-relaxed">
                  Awaiting audit trigger.<br />Upload a file and execute verification to view results.
                </p>
              </div>
            )}

            {/* Verified status block */}
            {auditState === "verified" && matchedRecord && (
              <div className="space-y-4">
                {/* Badge alert */}
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-emerald-800 text-sm">Ledger Verified</p>
                    <p className="text-emerald-700 leading-normal text-[11px]">
                      The file's SHA-256 matches the registered blockchain anchor. File integrity is verified.
                    </p>
                  </div>
                </div>

                {/* Match Details */}
                <div className="border border-slate-200 rounded-xl bg-slate-50 p-4 space-y-2.5 text-xs">
                  <div className="flex justify-between border-b border-slate-150 pb-2">
                    <span className="text-slate-400 font-medium">Verified ID</span>
                    <span className="font-bold text-slate-950">{matchedRecord.id}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-150 pb-2">
                    <span className="text-slate-400 font-medium">Case Reference</span>
                    <span className="font-semibold text-slate-800">{matchedRecord.caseId}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-150 pb-2">
                    <span className="text-slate-400 font-medium">Custodian</span>
                    <span className="font-semibold text-slate-800">{matchedRecord.custodian}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Classification</span>
                    <span className="font-semibold text-slate-800">{matchedRecord.classification}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    href={`/evidence/${matchedRecord.id}`}
                    className="w-full inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-950 transition"
                  >
                    <span>Inspect Target Records</span>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            )}

            {/* Tampered status block */}
            {auditState === "tampered" && matchedRecord && (
              <div className="space-y-4">
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-rose-800 text-sm">TAMPER DETECTED</p>
                    <p className="text-rose-700 leading-normal text-[11px]">
                      The file's SHA-256 fingerprint does NOT match the anchor hash registered on-chain for <span className="font-bold">{matchedRecord.id}</span>.
                    </p>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl bg-slate-50 p-4 space-y-3.5 text-[10px]">
                  <div>
                    <span className="text-slate-400 font-semibold uppercase block">On-Chain Target Fingerprint</span>
                    <span className="block font-mono text-slate-700 bg-white border border-slate-150 p-2 rounded-lg break-all mt-1">{matchedRecord.txHash}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold uppercase block">Uploaded Payload Fingerprint</span>
                    <span className="block font-mono text-rose-700 bg-white border border-rose-150 p-2 rounded-lg break-all mt-1">{calculatedHash}</span>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-150 p-4 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-slate-800">
                    <Lock className="h-4 w-4 text-rose-600" />
                    <span>Security Protocol Triggered</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Discrepancy logged under node session. Discrepancies usually signal file modification or data corruption.
                  </p>
                </div>
              </div>
            )}

            {/* Unknown status block */}
            {auditState === "unknown" && (
              <div className="space-y-4">
                <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-amber-800 text-sm">Unknown / Unregistered Hash</p>
                    <p className="text-amber-700 leading-normal text-[11px]">
                      No matching transaction fingerprint was found in the blockchain custody registry.
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 border border-slate-100 p-4 rounded-xl">
                  This file is not anchored on the ledger. It may belong to a case that has not yet been registered or was committed on another node.
                </p>
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

export default function VerificationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-12 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-semibold">Loading verification module...</span>
        </div>
      }
    >
      <VerificationCenter />
    </Suspense>
  );
}
